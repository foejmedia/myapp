'use client';
/**
 * My Schedule — plan the day around the five prayers.
 * Week / Day / Month views, real prayer times for the user's location,
 * activities pinned to a prayer, repeats, and a done tick per day.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCachedLocation, getPrayerMonth, locateByGps, locateByIp,
  type DayWindows, type PrayerLocation, type PrayerMonth,
} from '@/lib/prayerTimes';
import { hijri } from '@/lib/namazExtras';
import {
  addDays, doneId, fromKey, fromMin, loadStore, mondayOf, newId, occurrencesOn, saveStore, toKey,
  type Activity, type Cat, type Occurrence, type Store, type Template,
} from '@/lib/schedule';
import TimeGrid from './TimeGrid';
import MonthView from './MonthView';
import Sidebar from './Sidebar';
import Editor, { type Draft } from './Editor';
import { IconLeft, IconPlus, IconRight } from './icons';
import s from './schedule.module.css';

type View = 'day' | 'week' | 'month';
const VIEW_KEY = 'my-schedule-view';
const PRAYERS_KEY = 'my-schedule-prayers';

const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-GB', o);

function hijriRange(a: Date, b: Date) {
  const x = hijri(a);
  const y = hijri(b);
  if (!x || !y) return '';
  if (x.month === y.month && x.year === y.year) return `${x.day} – ${y.day} ${x.name} ${x.year} AH`;
  if (x.year === y.year) return `${x.day} ${x.name} – ${y.day} ${y.name} ${y.year} AH`;
  return `${x.day} ${x.name} ${x.year} – ${y.day} ${y.name} ${y.year} AH`;
}

function useIsNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)');
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

export default function ScheduleApp() {
  const [now, setNow] = useState<Date | null>(null);
  const [cursor, setCursor] = useState(''); // the selected day, YYYY-MM-DD
  const [view, setView] = useState<View>('week');
  const [store, setStore] = useState<Store>({ items: [], done: {} });
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState<Cat[]>([]);
  const [showPrayers, setShowPrayers] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toast, setToast] = useState('');
  const narrow = useIsNarrow();

  /* ---------- first load (browser only) ---------- */
  useEffect(() => {
    const d = new Date();
    setNow(d);
    setCursor(toKey(d));
    setStore(loadStore());
    try {
      const v = localStorage.getItem(VIEW_KEY) as View | null;
      if (v === 'day' || v === 'week' || v === 'month') setView(v);
      if (localStorage.getItem(PRAYERS_KEY) === '0') setShowPrayers(false);
    } catch {
      /* storage blocked */
    }
    setReady(true);
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (ready) saveStore(store);
  }, [store, ready]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(VIEW_KEY, view);
      localStorage.setItem(PRAYERS_KEY, showPrayers ? '1' : '0');
    } catch {
      /* storage blocked */
    }
  }, [view, showPrayers, ready]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- location + prayer times ---------- */
  const [loc, setLoc] = useState<PrayerLocation | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [months, setMonths] = useState<Record<string, PrayerMonth>>({});
  const [timesFailed, setTimesFailed] = useState(false);

  useEffect(() => {
    const cached = getCachedLocation();
    if (cached) return setLoc(cached);
    locateByIp().then(setLoc);
  }, []);
  const useGps = useCallback(async () => {
    setLocBusy(true);
    try {
      const l = await locateByGps();
      setMonths({});
      setLoc(l);
      setToast(`Prayer times set for ${l.name}`);
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setLocBusy(false);
    }
  }, []);

  /* ---------- visible days ---------- */
  const narrowView: View = narrow && view === 'week' ? 'day' : view;
  const sel = cursor ? fromKey(cursor) : null;
  const days = useMemo(() => {
    if (!sel) return [];
    if (narrowView === 'day') return [sel];
    if (narrowView === 'week') return Array.from({ length: 7 }, (_, i) => addDays(mondayOf(sel), i));
    const first = new Date(sel.getFullYear(), sel.getMonth(), 1);
    return Array.from({ length: 42 }, (_, i) => addDays(mondayOf(first), i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, narrowView]);

  // the week around the selected day is always needed (sidebar + phone day strip)
  const week = useMemo(() => (sel ? Array.from({ length: 7 }, (_, i) => addDays(mondayOf(sel), i)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cursor]);

  const monthIds = useMemo(() => {
    const ids = new Set<string>();
    [...days, ...week, ...(now ? [now] : [])].forEach(d => ids.add(`${d.getFullYear()}-${d.getMonth()}`));
    return [...ids];
  }, [days, week, now]);
  useEffect(() => {
    if (!loc) return;
    monthIds.forEach(id => {
      if (months[id]) return;
      const [y, m] = id.split('-').map(Number);
      getPrayerMonth(loc, y, m)
        .then(t => {
          setTimesFailed(false);
          setMonths(prev => ({ ...prev, [id]: t }));
        })
        .catch(() => setTimesFailed(true));
    });
  }, [loc, monthIds, months]);
  const times = useMemo(() => Object.assign({}, ...Object.values(months)) as Record<string, DayWindows>, [months]);

  /* ---------- occurrences ---------- */
  const visibleItems = useMemo(() => store.items.filter(a => !hidden.includes(a.cat)), [store.items, hidden]);
  const occ = useCallback(
    (day: string): Occurrence[] => occurrencesOn(visibleItems, day, times[day], store.done),
    [visibleItems, times, store.done],
  );
  const todayKey = now ? toKey(now) : '';
  const todayAll = useMemo(
    () => (todayKey ? occurrencesOn(store.items, todayKey, times[todayKey], store.done) : []),
    [store.items, todayKey, times, store.done],
  );

  /* ---------- actions ---------- */
  const toggleDone = (o: Occurrence) =>
    setStore(prev => {
      const id = doneId(o.a.id, o.day);
      const done = { ...prev.done };
      if (done[id]) delete done[id];
      else done[id] = 1;
      return { ...prev, done };
    });

  const openNew = (day: string, startMin?: number) => {
    const start = startMin ?? Math.min(22 * 60, Math.ceil(((now?.getHours() ?? 9) * 60 + (now?.getMinutes() ?? 0)) / 30) * 30);
    setDraft({
      id: null, title: '', cat: 'quran', date: day, repeat: 'none', note: '', occurrenceDay: day,
      when: { kind: 'at', start: fromMin(start), end: fromMin(start + 30) },
    });
  };
  const openEdit = (o: Occurrence) =>
    setDraft({ id: o.a.id, title: o.a.title, cat: o.a.cat, date: o.a.date, repeat: o.a.repeat, note: o.a.note ?? '', when: o.a.when, occurrenceDay: o.day });

  const saveDraft = (d: Draft) => {
    const a: Activity = { id: d.id ?? newId(), title: d.title.trim() || 'Untitled', cat: d.cat, date: d.date, repeat: d.repeat, when: d.when, note: d.note.trim() || undefined };
    setStore(prev => {
      const old = prev.items.find(x => x.id === a.id);
      if (old?.skip) a.skip = old.skip;
      return { ...prev, items: old ? prev.items.map(x => (x.id === a.id ? a : x)) : [...prev.items, a] };
    });
    setDraft(null);
    setToast(d.id ? 'Activity updated' : 'Activity added');
    if (!d.id) setCursor(d.date);
  };
  const deleteDraft = (d: Draft, onlyThisDay: boolean) => {
    if (!d.id) return;
    setStore(prev => ({
      ...prev,
      items: onlyThisDay
        ? prev.items.map(x => (x.id === d.id ? { ...x, skip: [...(x.skip ?? []), d.occurrenceDay] } : x))
        : prev.items.filter(x => x.id !== d.id),
    }));
    setDraft(null);
    setToast(onlyThisDay ? 'Removed from this day' : 'Activity deleted');
  };
  const addTemplates = (list: Template[]) => {
    const start = todayKey || cursor;
    setStore(prev => ({
      ...prev,
      items: [...prev.items, ...list.map(t => ({ id: newId(), title: t.title, cat: t.cat, date: start, repeat: t.repeat, when: t.when }))],
    }));
    setToast(list.length === 1 ? `${list[0].title} added` : `${list.length} activities added`);
  };

  const step = (dir: 1 | -1) => {
    if (!sel) return;
    if (narrowView === 'day') setCursor(toKey(addDays(sel, dir)));
    else if (narrowView === 'week') setCursor(toKey(addDays(sel, dir * 7)));
    else setCursor(toKey(new Date(sel.getFullYear(), sel.getMonth() + dir, 1)));
  };

  /* ---------- header labels ---------- */
  let title = '';
  let sub = '';
  if (sel) {
    if (narrowView === 'day') {
      title = fmt(sel, { weekday: 'long', day: 'numeric', month: 'long' });
      const h = hijri(sel);
      sub = h ? `${h.day} ${h.name} ${h.year} AH` : '';
    } else if (narrowView === 'week') {
      const a = days[0];
      const b = days[6];
      title = a.getMonth() === b.getMonth()
        ? `${a.getDate()} – ${fmt(b, { day: 'numeric', month: 'long', year: 'numeric' })}`
        : `${fmt(a, { day: 'numeric', month: 'short' })} – ${fmt(b, { day: 'numeric', month: 'short', year: 'numeric' })}`;
      sub = hijriRange(a, b);
    } else {
      title = fmt(sel, { month: 'long', year: 'numeric' });
      const first = new Date(sel.getFullYear(), sel.getMonth(), 1);
      const last = new Date(sel.getFullYear(), sel.getMonth() + 1, 0);
      sub = hijriRange(first, last);
    }
  }
  const inRamadan = (d: Date) => hijri(d)?.month === 8;
  const ramadanNow = now ? inRamadan(now) : false;

  if (!now || !sel) {
    return (
      <div className={s.app}>
        <div className={s.loadingPage} aria-busy="true">Loading your schedule…</div>
      </div>
    );
  }

  return (
    <div className={s.app}>
      <Sidebar
        now={now}
        cursor={cursor}
        onPick={k => setCursor(k)}
        week={week.map(toKey)}
        today={todayAll}
        todayTimes={times[todayKey]}
        ramadan={ramadanNow}
        items={store.items}
        hidden={hidden}
        onToggleCat={c => setHidden(h => (h.includes(c) ? h.filter(x => x !== c) : [...h, c]))}
        onAdd={() => openNew(cursor)}
        onTemplates={addTemplates}
        onToggleDone={toggleDone}
        onOpen={openEdit}
        loc={loc}
        locBusy={locBusy}
        onGps={useGps}
        timesFailed={timesFailed}
      />

      <main className={s.main}>
        <header className={s.head}>
          <div className={s.headTitle}>
            <p className={s.eyebrow}>
              My Schedule
              {ramadanNow && <span className={s.ramadanTag}>Ramadan {hijri(now)?.year}</span>}
            </p>
            <h1>{title}</h1>
            {sub && <p className={s.hijri}>{sub}</p>}
          </div>

          <div className={s.toolbar}>
            <div className={s.navGroup}>
              <button type="button" className={s.iconBtn} onClick={() => step(-1)} aria-label="Previous">
                <IconLeft />
              </button>
              <button type="button" className={s.todayBtn} onClick={() => setCursor(todayKey)} disabled={cursor === todayKey}>
                Today
              </button>
              <button type="button" className={s.iconBtn} onClick={() => step(1)} aria-label="Next">
                <IconRight />
              </button>
            </div>
            <div className={s.seg} role="tablist" aria-label="View">
              {(['day', 'week', 'month'] as View[]).map(v => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={narrowView === v}
                  className={`${s.segBtn} ${v === 'week' ? s.hideNarrow : ''}`}
                  onClick={() => setView(v)}
                >
                  {v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            {narrowView !== 'month' && (
              <label className={s.switch}>
                <input type="checkbox" checked={showPrayers} onChange={e => setShowPrayers(e.target.checked)} />
                <span aria-hidden="true" />
                Prayer times
              </label>
            )}
            <button type="button" className={s.addBtn} onClick={() => openNew(cursor)}>
              <IconPlus /> <span>New activity</span>
            </button>
          </div>
        </header>

        {narrowView === 'day' && (
          <nav className={s.strip} aria-label="Days of this week">
            {week.map(d => {
              const k = toKey(d);
              const n = occ(k).length;
              return (
                <button
                  key={k}
                  type="button"
                  className={`${s.stripDay} ${k === cursor ? s.stripOn : ''} ${k === todayKey ? s.stripToday : ''}`}
                  onClick={() => setCursor(k)}
                  aria-current={k === cursor ? 'date' : undefined}
                >
                  <small>{fmt(d, { weekday: 'short' })}</small>
                  <b>{d.getDate()}</b>
                  <i aria-hidden="true">{n ? Array.from({ length: Math.min(3, n) }, (_, j) => <span key={j} />) : null}</i>
                </button>
              );
            })}
          </nav>
        )}

        {narrowView === 'month' ? (
          <MonthView
            days={days}
            month={sel.getMonth()}
            todayKey={todayKey}
            occ={occ}
            ramadan={inRamadan}
            onPick={k => {
              setCursor(k);
              setView('day');
            }}
          />
        ) : (
          <TimeGrid
            days={days}
            todayKey={todayKey}
            now={now}
            times={times}
            occ={occ}
            showPrayers={showPrayers}
            ramadan={inRamadan}
            onSlot={openNew}
            onOpen={openEdit}
            onToggle={toggleDone}
            onPickDay={k => {
              setCursor(k);
              setView('day');
            }}
          />
        )}

        {store.items.length === 0 && (
          <p className={s.emptyHint}>
            Nothing planned yet. Click any time slot to add an activity, or start from a ready-made routine on the left.
          </p>
        )}
      </main>

      {draft && (
        <Editor
          draft={draft}
          times={times}
          onCancel={() => setDraft(null)}
          onSave={saveDraft}
          onDelete={deleteDraft}
        />
      )}

      <div className={s.toast} role="status" aria-live="polite" data-on={toast ? '' : undefined}>
        {toast}
      </div>
    </div>
  );
}
