'use client';
/**
 * Namaz Tracker — calendar dashboard.
 * Left rail · top bar · time-of-day banner · month calendar + qaza · week grid of real prayer windows.
 * The prayer log keeps its original storage ("namaz-tracker-v2"); everything new lives in namazExtras.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import NamazInsights from '@/components/NamazInsights';
import NextPrayerCard, { useReminders } from '@/components/NextPrayerCard';
import { PRAYERS, fromKey, toKey, type Code, type Log, type PrayerKey } from '@/lib/namaz';
import {
  DEFAULT_EXTRAS, EXCUSE_LABEL, EXTRAS_KEY, LOG_KEY, exportData, hijri, loadExtras, loadLog, owedByPrayer, owedFromLog, parseBackup, save,
  type ExcuseReason, type Extras, type RamadanKey, type SunnahKey,
} from '@/lib/namazExtras';
import {
  getCachedLocation, getPrayerMonth, locateByGps, locateByIp, to12h,
  type DayWindows, type PrayerLocation,
} from '@/lib/prayerTimes';
import BannerArt, { type Phase } from './BannerArt';
import MiniCalendar from './MiniCalendar';
import MobileCalendar, { type MobileAction } from './MobileCalendar';
import WeekGrid, { windowOf } from './WeekGrid';
import { BLOCK_LABEL, FILTERS, Icons, STATUS_OPTIONS, longDate, shortDate, type Filter } from './shared';
import s from './namaz.module.css';
import './namaz-print.css';

type View = 'tracker' | 'qaza';
type Dialog = null | 'reminders' | 'settings' | 'backlog';
type Pop = null | { kind: 'block'; day: string; p: PrayerKey; rect: DOMRect } | { kind: 'day'; day: string; rect: DOMRect };

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
const minsNow = (d: Date) => d.getHours() * 60 + d.getMinutes();
const fmtIn = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

/** how many day columns fit: 7 on wide screens, 3 on tablets, 1 on phones */
function useCols() {
  const [cols, setCols] = useState(7);
  useEffect(() => {
    const q7 = matchMedia('(min-width: 1280px)');
    const q3 = matchMedia('(min-width: 720px)');
    const sync = () => setCols(q7.matches ? 7 : q3.matches ? 3 : 1);
    sync();
    q7.addEventListener('change', sync);
    q3.addEventListener('change', sync);
    return () => {
      q7.removeEventListener('change', sync);
      q3.removeEventListener('change', sync);
    };
  }, []);
  return cols;
}

/* ---------- small overlays ---------- */

function Popover({ rect, onClose, label, children }: { rect: DOMRect; onClose: () => void; label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // first render is invisible so the real size can be measured, then it sits beside the anchor (or as a sheet on phones)
  const [place, setPlace] = useState<'measure' | 'sheet' | { left: number; top: number }>('measure');
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const vw = innerWidth, vh = innerHeight;
    if (vw < 600) return setPlace('sheet');
    const w = el.offsetWidth, h = el.offsetHeight;
    let left = rect.right + 10;
    if (left + w > vw - 12) left = rect.left - w - 10;
    if (left < 12) left = Math.min(vw - w - 12, Math.max(12, rect.left));
    const top = Math.min(vh - h - 12, Math.max(12, rect.top));
    setPlace({ left, top });
  }, [rect]);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose();
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => document.addEventListener('mousedown', onDown), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      prev?.focus?.();
    };
  }, [onClose]);
  useEffect(() => {
    if (place !== 'measure') ref.current?.querySelector<HTMLElement>('button, textarea, select')?.focus();
  }, [place]);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      className={`${s.popover} ${place === 'measure' ? s.measure : place === 'sheet' ? s.sheet : ''}`}
      style={typeof place === 'object' ? { left: place.left, top: place.top } : undefined}
    >
      {children}
    </div>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className={s.overlay} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={`${s.modal} ${wide ? s.modalWide : ''}`}>
        <div className={s.modalHead}>
          <h2>{title}</h2>
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Close">
            <Icons.Close />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- main ---------- */

export default function NamazDashboard() {
  const uid = useId().replace(/:/g, '');
  const cols = useCols();
  const reminders = useReminders();

  const [ready, setReady] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [log, setLog] = useState<Log>({});
  const [extras, setExtras] = useState<Extras>(() => ({ ...DEFAULT_EXTRAS }));
  const [selected, setSelected] = useState('');
  const [calMonth, setCalMonth] = useState<Date | null>(null);
  const [view, setView] = useState<View>('tracker');
  const [filter, setFilter] = useState<Filter>('all');
  const [pop, setPop] = useState<Pop>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [insights, setInsights] = useState(false);
  const [menu, setMenu] = useState<null | 'bell' | 'banner' | 'filter'>(null);

  const [loc, setLoc] = useState<PrayerLocation | null>(null);
  const [locState, setLocState] = useState<'loading' | 'ok' | 'missing'>('loading');
  const [locError, setLocError] = useState('');
  const [months, setMonths] = useState<Record<string, Record<string, DayWindows>>>({});
  const [timesError, setTimesError] = useState(false);
  const [toast, setToast] = useState('');

  /* load */
  useEffect(() => {
    const d = new Date();
    setNow(d);
    setSelected(toKey(d));
    setCalMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setLog(loadLog());
    setExtras(loadExtras());
    setReady(true);
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (ready) save(LOG_KEY, log); }, [log, ready]);
  useEffect(() => { if (ready) save(EXTRAS_KEY, extras); }, [extras, ready]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  /* location: cached → IP → ask */
  const resolveLocation = useCallback(async () => {
    setLocState('loading');
    const cached = getCachedLocation();
    if (cached) {
      setLoc(cached);
      setLocState('ok');
      return;
    }
    const ip = await locateByIp();
    if (ip.source === 'default') return setLocState('missing');
    setLoc(ip);
    setLocState('ok');
  }, []);
  useEffect(() => { resolveLocation(); }, [resolveLocation]);
  const useGps = async () => {
    setLocError('');
    try {
      const l = await locateByGps();
      setMonths({});
      setLoc(l);
      setLocState('ok');
      setToast(`Location set to ${l.name}`);
    } catch (e) {
      setLocError((e as Error).message);
    }
  };

  /* the visible days */
  const today = now ? toKey(now) : '';
  const days = useMemo(() => {
    if (!selected) return [];
    const sel = fromKey(selected);
    const start = cols === 7 ? mondayOf(sel) : cols === 3 ? addDays(sel, -1) : sel;
    return Array.from({ length: cols }, (_, i) => addDays(start, i));
  }, [selected, cols]);

  /* fetch the months those days fall in (plus today's month for the banner) */
  const monthIds = useMemo(() => {
    const ids = new Set<string>();
    const extra: Date[] = [];
    if (selected) {
      const sel = fromKey(selected);
      extra.push(addDays(sel, 1), addDays(sel, -sel.getDay()), addDays(sel, 6 - sel.getDay()));
    }
    [...days, ...extra, ...(now ? [now] : [])].forEach(d => ids.add(`${d.getFullYear()}-${d.getMonth()}`));
    return [...ids];
  }, [days, now, selected]);
  useEffect(() => {
    if (!loc) return;
    monthIds.forEach(id => {
      if (months[id]) return;
      const [y, m] = id.split('-').map(Number);
      getPrayerMonth(loc, y, m)
        .then(t => {
          setTimesError(false);
          setMonths(prev => ({ ...prev, [id]: t }));
        })
        .catch(() => setTimesError(true));
    });
  }, [loc, monthIds, months]);
  const times = useMemo(() => Object.assign({}, ...Object.values(months)) as Record<string, DayWindows>, [months]);

  /* ---------- updates ---------- */
  const setDay = (day: string, fn: (d: Log[string]) => void) =>
    setLog(prev => {
      const d = { ...prev[day] };
      fn(d);
      const next = { ...prev };
      if (Object.keys(d).length) next[day] = d;
      else delete next[day];
      return next;
    });
  const setCode = (day: string, p: PrayerKey, c: Code | null) =>
    setDay(day, d => {
      if (!c || d[p] === c) delete d[p];
      else d[p] = c;
    });
  const patch = (fn: (e: Extras) => Extras) => setExtras(prev => fn(prev));
  const toggleIn = <T extends string>(rec: Record<string, Partial<Record<T, true>>>, day: string, k: T) => {
    const cur = { ...rec[day] };
    if (cur[k]) delete cur[k];
    else cur[k] = true;
    const next = { ...rec };
    if (Object.keys(cur).length) next[day] = cur;
    else delete next[day];
    return next;
  };

  /** prayers whose time has started on that day */
  const startedOn = (day: string) => {
    if (!now) return [];
    if (day < today) return PRAYERS.map(p => p.key);
    if (day > today) return [];
    const t = times[day];
    if (!t) return [];
    return PRAYERS.filter(p => windowOf(t, p.key).start <= minsNow(now)).map(p => p.key);
  };
  const markDay = (day: string) => {
    const keys = startedOn(day);
    setDay(day, d => keys.forEach(k => { d[k] ??= 'O'; }));
    setToast(keys.length ? `Marked ${keys.length === 5 ? 'the whole day' : `${keys.length} prayers`} on time` : 'No prayer time has started yet');
  };

  /* travel mode tags today automatically */
  useEffect(() => {
    if (ready && extras.travelMode && today && !extras.travel[today]) patch(e => ({ ...e, travel: { ...e.travel, [today]: true } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, extras.travelMode, today]);

  /* ---------- qaza ---------- */
  const owed = useMemo(() => owedByPrayer(log, extras), [log, extras]);
  const owedList = useMemo(() => owedFromLog(log, extras), [log, extras]);
  const owedTotal = Object.values(owed).reduce((a, b) => a + b, 0);
  const makeUp = (p: PrayerKey) => {
    if ((extras.backlog[p] ?? 0) > 0) {
      patch(e => ({ ...e, backlog: { ...e.backlog, [p]: (e.backlog[p] ?? 1) - 1 } }));
    } else {
      const item = owedList.find(x => x.p === p);
      if (item) setCode(item.day, p, 'Q');
    }
    setToast(`${PRAYERS.find(x => x.key === p)!.label} qaza made up. May Allah accept it.`);
  };
  const finish = extras.qazaPlan > 0 && owedTotal > 0 && now ? addDays(now, Math.ceil(owedTotal / extras.qazaPlan)) : null;

  /* ---------- today, banner ---------- */
  const tToday = today ? times[today] : undefined;
  const upcoming = useMemo(() => {
    if (!now || !tToday) return [];
    return PRAYERS.map(p => ({ p, w: windowOf(tToday, p.key) })).filter(x => x.w.start > minsNow(now));
  }, [now, tToday]);
  const tomorrowFajr = now && times[toKey(addDays(now, 1))]?.Fajr;
  const next = upcoming[0];
  const nextLine = !now
    ? ''
    : next
      ? `${next.p.label} in ${fmtIn(next.w.start - minsNow(now))}`
      : tomorrowFajr
        ? `Fajr tomorrow at ${tomorrowFajr}`
        : '';
  const unloggedToday = today ? startedOn(today).filter(k => !log[today]?.[k]).length : 0;

  const phase: Phase = useMemo(() => {
    if (!now) return 'day';
    const m = minsNow(now);
    if (!tToday) return now.getHours() < 6 ? 'dawn' : now.getHours() < 17 ? 'day' : now.getHours() < 19 ? 'sunset' : 'night';
    const mm = (x: string) => Number(x.split(':')[0]) * 60 + Number(x.split(':')[1]);
    if (m < mm(tToday.Fajr) || m >= mm(tToday.Isha)) return 'night';
    if (m < mm(tToday.Sunrise) + 60) return 'dawn';
    if (m < mm(tToday.Maghrib) - 45) return 'day';
    return 'sunset';
  }, [now, tToday]);

  /* weekly goal: chosen prayer on time (or in jamaat), this week */
  const goal = useMemo(() => {
    if (!now) return { done: 0, target: extras.goal.days };
    const mon = mondayOf(now);
    let done = 0;
    for (let i = 0; i < 7; i++) {
      const k = toKey(addDays(mon, i));
      if (k > today) break;
      const c = log[k]?.[extras.goal.prayer];
      if (c === 'O' || c === 'J') done++;
    }
    return { done, target: extras.goal.days };
  }, [log, extras.goal, now, today]);

  /* ---------- week navigation ---------- */
  const shift = (dir: 1 | -1) => {
    const d = addDays(fromKey(selected), dir * cols);
    setSelected(toKey(d));
    setCalMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const pickDay = (k: string) => {
    setSelected(k);
    setView('tracker');
    if (cols === 1) document.getElementById(`${uid}-grid`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const rangeLabel = days.length
    ? days.length === 1
      ? longDate(days[0])
      : `${shortDate(days[0])} – ${shortDate(days[days.length - 1])}`
    : '';

  /** "Log prayer": opens the current prayer's block */
  const logNow = () => {
    if (!now) return;
    setView('tracker');
    const k = today;
    if (!days.some(d => toKey(d) === k)) setSelected(k);
    const started = startedOn(k);
    const p = started[started.length - 1];
    if (!p) return setToast('Fajr hasn’t started yet today');
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-key="${k}:${p}"]`);
      const rect = el?.getBoundingClientRect() ?? new DOMRect(innerWidth / 2 - 150, 160, 0, 0);
      setPop({ kind: 'block', day: k, p, rect });
    });
  };

  /* ---------- backup ---------- */
  const fileRef = useRef<HTMLInputElement>(null);
  /** Export: the month's log as a PDF, through the print sheet below ("Save as PDF" in the print dialog) */
  const doExport = () => {
    setToast('Choose “Save as PDF” to download your log');
    setTimeout(() => window.print(), 250);
  };
  /** Backup for Import: the full log as JSON */
  const doBackup = () => {
    const blob = new Blob([exportData(log, extras)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `namaz-tracker-${today}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setToast('Backup downloaded');
  };
  const doImport = async (file: File) => {
    try {
      const data = parseBackup(await file.text());
      const n = Object.keys(data.log).length;
      if (!confirm(`Replace your current log with this backup (${n} days)? This can’t be undone.`)) return;
      setLog(data.log);
      setExtras(data.extras);
      setToast(`Restored ${n} days`);
    } catch (e) {
      setToast((e as Error).message);
    }
  };

  const closePop = useCallback(() => setPop(null), []);
  const closeDialog = useCallback(() => setDialog(null), []);
  const closeInsights = useCallback(() => setInsights(false), []);

  if (!now || !calMonth) return <div className={s.app} style={{ minHeight: '100vh' }} />;

  /* ---------- pieces ---------- */
  const hToday = hijri(now);
  const rail: { id: string; label: string; icon: keyof typeof Icons; on?: boolean; act: () => void }[] = [
    { id: 'tracker', label: 'Tracker', icon: 'Calendar', on: view === 'tracker', act: () => setView('tracker') },
    { id: 'qaza', label: 'Qaza', icon: 'Qaza', on: view === 'qaza', act: () => setView('qaza') },
    { id: 'insights', label: 'Insights', icon: 'Insights', act: () => setInsights(true) },
    { id: 'reminders', label: 'Reminders', icon: 'Bell', act: () => setDialog('reminders') },
    { id: 'settings', label: 'Settings', icon: 'Settings', act: () => setDialog('settings') },
  ];

  const qazaCard = (
    <section className={s.qazaCard} aria-labelledby={`${uid}-qz`}>
      <div className={s.qazaHead}>
        <h2 id={`${uid}-qz`}>Qaza to make up</h2>
        <button type="button" className={s.squareBtn} onClick={() => setDialog('backlog')} aria-label="Add qaza from before you started tracking">
          <Icons.Plus />
        </button>
      </div>
      {owedTotal === 0 ? (
        <p className={s.muted}>Nothing owed. May Allah accept your salah.</p>
      ) : (
        <ul className={s.qazaList}>
          {PRAYERS.filter(p => owed[p.key] > 0).map(p => (
            <li key={p.key}>
              <span>
                <b>{p.label}</b>
                <em>{owed[p.key]} owed</em>
              </span>
              <button type="button" onClick={() => makeUp(p.key)}>
                <Icons.Check /> Made up
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className={s.linkBtn} onClick={() => setView('qaza')}>
        {owedTotal ? `${owedTotal} in total · open qaza manager` : 'Open qaza manager'} →
      </button>
    </section>
  );

  const toolbar = (
    <div className={s.toolbar}>
      <div className={s.tabs} role="tablist" aria-label="Show">
        {FILTERS.map(f => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={filter === f.id ? s.tabOn : s.tab} onClick={() => setFilter(f.id)}>
            {f.id !== 'all' && <i className={`${s.swatch} ${s['st' + f.id]}`} aria-hidden="true" />}
            {f.label}
          </button>
        ))}
      </div>
      <div className={s.toolRight}>
        <div className={s.menuWrap}>
          <button type="button" className={s.squareBtn} aria-expanded={menu === 'filter'} aria-label="Display options" onClick={() => setMenu(menu === 'filter' ? null : 'filter')}>
            <Icons.Filter />
          </button>
          {menu === 'filter' && (
            <div className={s.menu} role="menu">
              <label className={s.check}>
                <input type="checkbox" checked={extras.hideUnlogged} onChange={e => patch(x => ({ ...x, hideUnlogged: e.target.checked }))} />
                Hide prayers not logged
              </label>
              <label className={s.check}>
                <input type="checkbox" checked={extras.showSunnah} onChange={e => patch(x => ({ ...x, showSunnah: e.target.checked }))} />
                Show Sunnah prayers
              </label>
            </div>
          )}
        </div>
        <button type="button" className={s.primary} onClick={logNow}>
          Log prayer <Icons.Plus />
        </button>
      </div>
    </div>
  );

  const missingLocation = (
    <div className={s.emptyTimes}>
      <Icons.Pin />
      <h3>Set your location to see prayer times</h3>
      <p>Times are calculated for where you are, so the grid needs your location.</p>
      <div className={s.row}>
        <button type="button" className={s.primary} onClick={useGps}>Use my location</button>
        <button type="button" className={s.ghost} onClick={resolveLocation}>Try again</button>
      </div>
      {locError && <p className={s.error}>{locError}</p>}
    </div>
  );

  const qazaManager = (
    <section className={s.manager} aria-labelledby={`${uid}-qm`}>
      <div className={s.managerHead}>
        <div>
          <h2 id={`${uid}-qm`}>Qaza manager</h2>
          <p className={s.muted}>{owedTotal ? `${owedTotal} prayers to make up` : 'You don’t owe any prayers.'}</p>
        </div>
        <button type="button" className={s.ghost} onClick={() => setDialog('backlog')}>
          <Icons.Plus /> Add from before tracking
        </button>
      </div>
      <div className={s.owedCards}>
        {PRAYERS.map(p => (
          <div key={p.key} className={s.owedCard}>
            <span>
              {p.label} <span lang="ar" dir="rtl">{p.ar}</span>
            </span>
            <b>{owed[p.key]}</b>
            <button type="button" disabled={!owed[p.key]} onClick={() => makeUp(p.key)}>
              Made up one
            </button>
          </div>
        ))}
      </div>
      <div className={s.plan}>
        <label>
          Make up
          <select value={extras.qazaPlan} onChange={e => patch(x => ({ ...x, qazaPlan: Number(e.target.value) }))}>
            {[0, 1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>
                {n === 0 ? 'no plan' : `${n} extra ${n === 1 ? 'prayer' : 'prayers'}`}
              </option>
            ))}
          </select>
          a day
        </label>
        <p>
          {finish
            ? <>At this pace you’ll be done by <b>{finish.toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}</b>, in shā’ Allāh.</>
            : owedTotal
              ? 'Pick a daily amount to see when you’ll be done.'
              : 'Nothing to plan.'}
        </p>
      </div>
      {owedList.length > 0 && (
        <>
          <h3 className={s.subHead}>Missed prayers in your log</h3>
          <ul className={s.owedList}>
            {owedList.slice(0, 40).map(({ day, p }) => (
              <li key={day + p}>
                <span>
                  <b>{PRAYERS.find(x => x.key === p)!.label}</b>
                  <em>{longDate(fromKey(day))}</em>
                </span>
                <button type="button" onClick={() => setCode(day, p, 'Q')}>Made up</button>
              </li>
            ))}
            {owedList.length > 40 && <li className={s.muted}>+{owedList.length - 40} more</li>}
          </ul>
        </>
      )}
    </section>
  );

  /* popover contents */
  let popover: React.ReactNode = null;
  if (pop?.kind === 'block') {
    const p = PRAYERS.find(x => x.key === pop.p)!;
    const d = fromKey(pop.day);
    const code = log[pop.day]?.[pop.p];
    const w = times[pop.day] ? windowOf(times[pop.day], pop.p) : null;
    const noteKey = `${pop.day}:${pop.p}`;
    const name = d.getDay() === 5 && pop.p === 'dhuhr' ? 'Jumu’ah' : p.label;
    popover = (
      <Popover rect={pop.rect} onClose={closePop} label={`${name}, ${longDate(d)}`}>
        <div className={s.popHead}>
          <div>
            <b>{name} <span lang="ar" dir="rtl">{p.ar}</span></b>
            <span>{shortDate(d)}{w ? ` · ${w.label}` : ''}</span>
          </div>
          <button type="button" className={s.iconBtn} onClick={closePop} aria-label="Close">
            <Icons.Close />
          </button>
        </div>
        {extras.excused[pop.day] ? (
          <p className={s.muted}>This day is marked excused ({EXCUSE_LABEL[extras.excused[pop.day]]}); it isn’t counted as missed.</p>
        ) : (
          <div className={s.statusGrid} role="group" aria-label="How did you pray it?">
            {STATUS_OPTIONS.map(o => (
              <button key={o.code} type="button" aria-pressed={code === o.code} className={`${s.statusBtn} ${s['st' + o.code]} ${code === o.code ? s.statusOn : ''}`} onClick={() => setCode(pop.day, pop.p, o.code)}>
                <b>{o.label}</b>
                <span>{o.hint}</span>
              </button>
            ))}
            {(code === 'M' || code === 'Q') && (
              <button type="button" aria-pressed={code === 'Q'} className={`${s.statusBtn} ${s.stQ} ${code === 'Q' ? s.statusOn : ''} ${s.full}`} onClick={() => setCode(pop.day, pop.p, code === 'Q' ? 'M' : 'Q')}>
                <b>{code === 'Q' ? 'Made up ✓' : 'I made it up later'}</b>
                <span>Qaza prayed</span>
              </button>
            )}
          </div>
        )}
        <label className={s.noteField}>
          <span>Note</span>
          <textarea
            rows={2}
            maxLength={200}
            placeholder="Optional, e.g. prayed at the masjid"
            value={extras.prayerNotes[noteKey] ?? ''}
            onChange={e => patch(x => ({ ...x, prayerNotes: { ...x.prayerNotes, [noteKey]: e.target.value } }))}
          />
        </label>
        <div className={s.popFoot}>
          {code && (
            <button type="button" className={s.textBtn} onClick={() => setCode(pop.day, pop.p, null)}>
              Clear
            </button>
          )}
          <button type="button" className={s.primary} onClick={closePop}>Done</button>
        </div>
      </Popover>
    );
  } else if (pop?.kind === 'day') {
    const d = fromKey(pop.day);
    const h = hijri(d);
    popover = (
      <Popover rect={pop.rect} onClose={closePop} label={`Options for ${longDate(d)}`}>
        <div className={s.popHead}>
          <div>
            <b>{longDate(d)}</b>
            {h && <span>{h.day} {h.name} {h.year}</span>}
          </div>
          <button type="button" className={s.iconBtn} onClick={closePop} aria-label="Close">
            <Icons.Close />
          </button>
        </div>
        <button type="button" className={s.primaryWide} disabled={pop.day > today} onClick={() => markDay(pop.day)}>
          <Icons.Check /> Mark whole day on time
        </button>
        <label className={s.field}>
          <span>Excused day</span>
          <select
            value={extras.excused[pop.day] ?? ''}
            onChange={e => {
              const v = e.target.value as ExcuseReason | '';
              patch(x => {
                const excused = { ...x.excused };
                if (v) excused[pop.day] = v;
                else delete excused[pop.day];
                return { ...x, excused };
              });
            }}
          >
            <option value="">Not excused</option>
            {(Object.keys(EXCUSE_LABEL) as ExcuseReason[]).map(r => (
              <option key={r} value={r}>{EXCUSE_LABEL[r]}</option>
            ))}
          </select>
          <small>Excused days aren’t counted as missed or owed.</small>
        </label>
        <label className={s.check}>
          <input
            type="checkbox"
            checked={!!extras.travel[pop.day]}
            onChange={e =>
              patch(x => {
                const travel = { ...x.travel };
                if (e.target.checked) travel[pop.day] = true;
                else delete travel[pop.day];
                return { ...x, travel };
              })
            }
          />
          Travelling (qasr) on this day
        </label>
        <label className={s.noteField}>
          <span>Reflection</span>
          <textarea
            rows={3}
            maxLength={500}
            placeholder="How did your prayers feel today?"
            value={extras.notes[pop.day] ?? ''}
            onChange={e => patch(x => ({ ...x, notes: { ...x.notes, [pop.day]: e.target.value } }))}
          />
        </label>
      </Popover>
    );
  }

  /* print sheet (only visible when printing) */
  const pm = calMonth;
  const pDays = new Date(pm.getFullYear(), pm.getMonth() + 1, 0).getDate();
  const monthTally = { J: 0, O: 0, L: 0, Q: 0, M: 0 } as Record<string, number>;
  for (let i = 1; i <= pDays; i++) {
    const k = toKey(new Date(pm.getFullYear(), pm.getMonth(), i));
    if (extras.excused[k]) continue;
    for (const p of PRAYERS) { const c = log[k]?.[p.key]; if (c) monthTally[c] = (monthTally[c] ?? 0) + 1; }
  }
  const printSheet = (
    <div className={`${s.printSheet} nz-print-sheet`} aria-hidden="true">
      <header className="nzp-head">
        <span className="nzp-brand">
          {/* the Learn Quran logo: an open book on a green tile */}
          <svg className="nzp-logo" viewBox="0 0 48 48" aria-hidden="true">
            <defs>
              <linearGradient id="nzp-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#18a07a" />
                <stop offset="1" stopColor="#0b5d48" />
              </linearGradient>
            </defs>
            <rect width="48" height="48" rx="12" fill="url(#nzp-g)" />
            <path d="M10 15.5c4.6-1.6 9.2-1.3 13 1.1v18c-3.8-2.4-8.4-2.7-13-1.1z" fill="#fff" />
            <path d="M38 15.5c-4.6-1.6-9.2-1.3-13 1.1v18c3.8-2.4 8.4-2.7 13-1.1z" fill="#fff" />
            <path d="M28.5 21.5h6M28.5 25h6M28.5 28.5h6" stroke="#0b5d48" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span>
            <b>Learn Quran</b>
            <small>A little every day</small>
          </span>
        </span>
        <span className="nzp-meta">
          <b>Namaz log</b>
          <span>{pm.toLocaleDateString('en', { month: 'long', year: 'numeric' })}{loc?.name ? ` · ${loc.name}` : ''}</span>
        </span>
      </header>
      <ul className="nzp-tally">
        <li><b>{monthTally.J}</b> Jamaat</li>
        <li><b>{monthTally.O}</b> On time</li>
        <li><b>{monthTally.L}</b> Late</li>
        <li><b>{monthTally.Q}</b> Made up</li>
        <li><b>{monthTally.M}</b> Missed</li>
      </ul>
      <table>
        <thead>
          <tr>
            <th>Day</th>
            {PRAYERS.map(p => <th key={p.key}>{p.label}</th>)}
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: pDays }, (_, i) => {
            const d = new Date(pm.getFullYear(), pm.getMonth(), i + 1);
            const k = toKey(d);
            return (
              <tr key={k}>
                <td>{shortDate(d)}</td>
                {PRAYERS.map(p => (
                  <td key={p.key}>{extras.excused[k] ? 'Excused' : log[k]?.[p.key] ? BLOCK_LABEL[log[k]![p.key]!] : ''}</td>
                ))}
                <td>{extras.notes[k] ?? ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <footer className="nzp-foot">
        Generated by Learn Quran · {new Date().toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}
      </footer>
    </div>
  );

  const railNode = (
    <nav className={s.rail} aria-label="Namaz tracker">
      <span className={s.logo} aria-hidden="true">
        <span lang="ar">ص</span>
      </span>
      {rail.map(r => {
        const Icon = Icons[r.icon];
        return (
          <button key={r.id} type="button" className={r.on ? s.railOn : s.railBtn} aria-current={r.on ? 'page' : undefined} onClick={r.act} title={r.label}>
            <Icon />
            <span>{r.label}</span>
          </button>
        );
      })}
      <button type="button" className={`${s.railBtn} ${s.railBottom}`} onClick={doExport} title="Export this month as PDF">
        <Icons.Download />
        <span>Export</span>
      </button>
    </nav>
  );

  const topbarNode = (
    <header className={s.topbar}>
      <div className={s.titleBlock}>
        <h1>Namaz Tracker</h1>
        <button type="button" className={s.locBtn} onClick={() => setDialog('settings')}>
          <Icons.Pin /> {locState === 'ok' && loc ? loc.name : locState === 'loading' ? 'Finding your location…' : 'Set location'}
        </button>
      </div>
      <div className={s.topRight}>
        <button type="button" className={`${s.pill} ${reminders.on ? s.pillOn : ''}`} onClick={() => setDialog('reminders')}>
          <Icons.Bell /> Reminders <i className={s.pillDot} aria-hidden="true" />
          <span className={s.srOnly}>{reminders.on ? 'on' : 'off'}</span>
        </button>
        <div className={s.menuWrap}>
          <button type="button" className={s.bellBtn} aria-expanded={menu === 'bell'} aria-label="Today’s prayers" onClick={() => setMenu(menu === 'bell' ? null : 'bell')}>
            <Icons.Bell />
            {unloggedToday > 0 && <i className={s.badge}>{unloggedToday}</i>}
          </button>
          {menu === 'bell' && (
            <div className={`${s.menu} ${s.bellMenu}`} role="menu">
              <p className={s.menuTitle}>Today’s prayers</p>
              {tToday ? (
                PRAYERS.map(p => {
                  const w = windowOf(tToday, p.key);
                  const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.floor(w.start / 60), w.start % 60);
                  const code = log[today]?.[p.key];
                  const isNext = next?.p.key === p.key;
                  return (
                    <div key={p.key} className={`${s.bellRow} ${isNext ? s.bellNext : ''}`}>
                      <span>
                        <b>{p.label}</b> {to12h(at)}
                      </span>
                      <em className={s['st' + (code ?? (at > now ? 'F' : 'N'))]}>{at > now ? (isNext ? 'Next' : 'Later') : BLOCK_LABEL[code ?? 'none']}</em>
                    </div>
                  );
                })
              ) : (
                <p className={s.muted}>Set your location to see times.</p>
              )}
              <button type="button" className={s.linkBtn} onClick={() => { setMenu(null); setDialog('reminders'); }}>
                Reminder settings →
              </button>
            </div>
          )}
        </div>
        <span className={s.me}>
          <span className={s.avatar} aria-hidden="true"><Icons.User /></span>
          <span className={s.meText}>
            <b>My prayers</b>
            <small>Saved on this device</small>
          </span>
        </span>
      </div>
    </header>
  );

  const bannerNode = (
    <section className={s.banner} aria-label="Today">
      <BannerArt phase={phase} id={uid} />
      <div className={s.bannerText}>
        <h2>
          {now.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          {hToday && <span> · {hToday.day} {hToday.name} {hToday.year}</span>}
        </h2>
        <p>
          {locState === 'missing'
            ? 'Set your location to see today’s prayer times'
            : tToday
              ? `${upcoming.length} ${upcoming.length === 1 ? 'prayer' : 'prayers'} left today${nextLine ? ` · ${nextLine}` : ''}`
              : 'Loading today’s prayer times…'}
        </p>
        <span className={s.goalPill}>
          Goal: {PRAYERS.find(p => p.key === extras.goal.prayer)!.label} on time · <b>{goal.done}/{goal.target}</b> days this week
        </span>
      </div>
      <div className={s.menuWrap}>
        <button type="button" className={s.bannerMenuBtn} aria-label="Banner options" aria-expanded={menu === 'banner'} onClick={() => setMenu(menu === 'banner' ? null : 'banner')}>
          <Icons.Dots />
        </button>
        {menu === 'banner' && (
          <div className={`${s.menu} ${s.menuRight}`} role="menu">
            <button type="button" role="menuitem" onClick={() => { setMenu(null); useGps(); }}><Icons.Pin /> Use my precise location</button>
            <button type="button" role="menuitem" onClick={() => { setMenu(null); window.print(); }}><Icons.Print /> Print this month</button>
            <button type="button" role="menuitem" onClick={() => { setMenu(null); setDialog('settings'); }}><Icons.Settings /> Settings</button>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className={s.app}>
      {cols === 1 ? (
        <>
        {railNode}
        <div className={s.main}>
        {topbarNode}
        {bannerNode}
        <MobileCalendar
          embedded
          now={now}
          selected={selected}
          onSelect={k => { setSelected(k); setCalMonth(new Date(fromKey(k).getFullYear(), fromKey(k).getMonth(), 1)); }}
          log={log}
          extras={extras}
          times={times}
          owedTotal={owedTotal}
          unloggedToday={unloggedToday}
          locationMissing={locState === 'missing'}
          missingNode={missingLocation}
          qazaNode={qazaManager}
          view={view}
          onBack={() => setView('tracker')}
          onOpenPrayer={(day, p, el) => setPop({ kind: 'block', day, p, rect: el.getBoundingClientRect() })}
          onOpenDay={(day, el) => setPop({ kind: 'day', day, rect: el.getBoundingClientRect() })}
          onLog={logNow}
          onAction={(a: MobileAction) => {
            if (a === 'qaza') setView('qaza');
            else if (a === 'insights') setInsights(true);
            else if (a === 'reminders') setDialog('reminders');
            else if (a === 'settings') setDialog('settings');
            else if (a === 'export') doExport();
            else window.print();
          }}
        />
        </div>
        </>
      ) : (
        <>
        {/* rail (bottom-of-header tabs on phones) */}
        {railNode}

        <div className={s.main}>
          {/* top bar */}
          {topbarNode}

          {/* banner */}
          {bannerNode}

          <div className={s.columns}>
            <aside className={s.left}>
              <MiniCalendar month={calMonth} onMonth={setCalMonth} selected={selected} onSelect={pickDay} today={now} log={log} extras={extras} />
              {qazaCard}
            </aside>

            <div className={s.right} id={`${uid}-grid`}>
              {view === 'qaza' ? (
                qazaManager
              ) : (
                <>
                  {toolbar}
                  {locState === 'missing' ? (
                    missingLocation
                  ) : timesError && !Object.keys(times).length ? (
                    <div className={s.emptyTimes}>
                      <h3>Prayer times couldn’t be loaded</h3>
                      <p>Check your connection and try again.</p>
                      <button type="button" className={s.primary} onClick={() => { setTimesError(false); setMonths({}); }}>Try again</button>
                    </div>
                  ) : (
                    <WeekGrid
                      days={days}
                      now={now}
                      times={times}
                      log={log}
                      extras={extras}
                      filter={filter}
                      rangeLabel={rangeLabel}
                      onBlock={(day, p, el) => setPop({ kind: 'block', day, p, rect: el.getBoundingClientRect() })}
                      onDay={(day, el) => setPop({ kind: 'day', day, rect: el.getBoundingClientRect() })}
                      onPrev={() => shift(-1)}
                      onNext={() => shift(1)}
                      onToggleSunnah={(day, k: SunnahKey) => patch(x => ({ ...x, sunnah: toggleIn(x.sunnah, day, k) }))}
                      onToggleRamadan={(day, k: RamadanKey) => patch(x => ({ ...x, ramadan: toggleIn(x.ramadan, day, k) }))}
                    />
                  )}
                  <ul className={s.legend} aria-label="Colours">
                    {(['J', 'O', 'L', 'Q', 'M', 'N'] as const).map(c => (
                      <li key={c}>
                        <i className={`${s.swatch} ${s['st' + c]}`} />
                        {c === 'N' ? 'Not logged' : BLOCK_LABEL[c]}
                      </li>
                    ))}
                    <li><i className={`${s.swatch} ${s.stX}`} />Excused</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>

        </>
      )}

      {popover}

      {dialog === 'reminders' && (
        <Modal title="Prayer reminders" onClose={closeDialog}>
          <p className={s.muted}>Get a notification before each prayer while Learn Quran is open in your browser.</p>
          <NextPrayerCard />
        </Modal>
      )}

      {dialog === 'backlog' && (
        <Modal title="Add qaza from before tracking" onClose={closeDialog}>
          <p className={s.muted}>If you owe prayers from before you started using the tracker, add them here so the qaza manager can count them.</p>
          <div className={s.backlogGrid}>
            {PRAYERS.map(p => (
              <label key={p.key} className={s.field}>
                <span>{p.label}</span>
                <input
                  type="number"
                  min={0}
                  max={99999}
                  inputMode="numeric"
                  value={extras.backlog[p.key] ?? 0}
                  onChange={e => patch(x => ({ ...x, backlog: { ...x.backlog, [p.key]: Math.max(0, Math.min(99999, Number(e.target.value) || 0)) } }))}
                />
              </label>
            ))}
          </div>
          <button type="button" className={s.primary} onClick={closeDialog}>Save</button>
        </Modal>
      )}

      {dialog === 'settings' && (
        <Modal title="Settings" onClose={closeDialog} wide>
          <div className={s.settings}>
            <section>
              <h3>Location</h3>
              <p className={s.muted}>{loc ? `Prayer times for ${loc.name}` : 'No location yet'} · method chosen for your region by Aladhan</p>
              <div className={s.row}>
                <button type="button" className={s.primary} onClick={useGps}><Icons.Pin /> Use my precise location</button>
                <button type="button" className={s.ghost} onClick={() => { try { localStorage.removeItem('prayerLocation'); } catch {} setMonths({}); resolveLocation(); }}>Detect again</button>
              </div>
              {locError && <p className={s.error}>{locError}</p>}
            </section>
            <section>
              <h3>Weekly goal</h3>
              <div className={s.row}>
                <select value={extras.goal.prayer} onChange={e => patch(x => ({ ...x, goal: { ...x.goal, prayer: e.target.value as PrayerKey } }))} aria-label="Prayer">
                  {PRAYERS.map(p => <option key={p.key} value={p.key}>{p.label} on time</option>)}
                </select>
                <select value={extras.goal.days} onChange={e => patch(x => ({ ...x, goal: { ...x.goal, days: Number(e.target.value) } }))} aria-label="Days a week">
                  {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n} {n === 1 ? 'day' : 'days'} a week</option>)}
                </select>
              </div>
            </section>
            <section>
              <h3>Display</h3>
              <label className={s.check}>
                <input type="checkbox" checked={extras.showSunnah} onChange={e => patch(x => ({ ...x, showSunnah: e.target.checked }))} />
                Track Sunnah prayers (Tahajjud, Duha, Witr)
              </label>
              <label className={s.check}>
                <input type="checkbox" checked={extras.hideUnlogged} onChange={e => patch(x => ({ ...x, hideUnlogged: e.target.checked }))} />
                Hide prayers not logged
              </label>
              <label className={s.check}>
                <input type="checkbox" checked={extras.travelMode} onChange={e => patch(x => ({ ...x, travelMode: e.target.checked }))} />
                Travel mode: tag each day as travelling (qasr) until turned off
              </label>
            </section>
            <section>
              <h3>Backup</h3>
              <p className={s.muted}>Your log stays on this device. Export it to keep a copy or move it to another browser.</p>
              <div className={s.row}>
                <button type="button" className={s.ghost} onClick={doExport}><Icons.Download /> Export PDF</button>
                <button type="button" className={s.ghost} onClick={doBackup}><Icons.Download /> Backup (JSON)</button>
                <button type="button" className={s.ghost} onClick={() => fileRef.current?.click()}><Icons.Upload /> Import</button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) doImport(f);
                  e.target.value = '';
                }}
              />
            </section>
          </div>
        </Modal>
      )}

      <NamazInsights
        log={log}
        today={now}
        open={insights}
        onClose={closeInsights}
        onMarkToday={() => { setInsights(false); setSelected(today); setView('tracker'); }}
      />

      {menu && <div className={s.menuCatcher} onClick={() => setMenu(null)} aria-hidden="true" />}
      {toast && <div className={s.toast} role="status">{toast}</div>}
      {printSheet}
    </div>
  );
}
