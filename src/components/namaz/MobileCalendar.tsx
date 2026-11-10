'use client';
/**
 * Phone layout of the Namaz Tracker, in the style of a mobile calendar app:
 * month grid with prayer dots (collapsible to a week strip) and a Today / Tomorrow agenda.
 */
import { useEffect, useRef, useState } from 'react';
import { PRAYERS, fromKey, toKey, type Log, type PrayerKey } from '@/lib/namaz';
import type { DayWindows } from '@/lib/prayerTimes';
import { EXCUSE_LABEL, hijri, type Extras } from '@/lib/namazExtras';
import { windowOf } from './WeekGrid';
import { BLOCK_LABEL, Icons } from './shared';
import m from './mobile.module.css';

const WD = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sundayOf = (d: Date) => addDays(d, -d.getDay());

/** "05:01","06:13" → "5:01 – 6:13 AM" */
function range12(a: string, b: string | null) {
  const to = (hhmm: string) => {
    const [h, mm] = hhmm.split(':').map(Number);
    return { t: `${h % 12 || 12}:${String(mm).padStart(2, '0')}`, ap: h < 12 ? 'AM' : 'PM' };
  };
  const x = to(a);
  if (!b) return `${x.t} ${x.ap} – Fajr`;
  const y = to(b);
  return x.ap === y.ap ? `${x.t} – ${y.t} ${y.ap}` : `${x.t} ${x.ap} – ${y.t} ${y.ap}`;
}
const END: Record<PrayerKey, keyof DayWindows | null> = { fajr: 'Sunrise', dhuhr: 'Asr', asr: 'Maghrib', maghrib: 'Isha', isha: null };
const START: Record<PrayerKey, keyof DayWindows> = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };

export type MobileAction = 'qaza' | 'insights' | 'reminders' | 'settings' | 'export' | 'print';

export default function MobileCalendar({
  now, selected, onSelect, log, extras, times, owedTotal, unloggedToday, locationMissing, missingNode, qazaNode, view, onBack,
  onOpenPrayer, onOpenDay, onLog, onAction, embedded = false,
}: {
  now: Date;
  selected: string;
  onSelect: (day: string) => void;
  log: Log;
  extras: Extras;
  times: Record<string, DayWindows>;
  owedTotal: number;
  unloggedToday: number;
  locationMissing: boolean;
  missingNode: React.ReactNode;
  qazaNode: React.ReactNode;
  view: 'tracker' | 'qaza';
  onBack: () => void;
  onOpenPrayer: (day: string, p: PrayerKey, el: HTMLElement) => void;
  onOpenDay: (day: string, el: HTMLElement) => void;
  onLog: () => void;
  onAction: (a: MobileAction) => void;
  /** inside the page's own tabs, top bar and banner: no header of its own */
  embedded?: boolean;
}) {
  const today = toKey(now);
  const sel = fromKey(selected);
  const [month, setMonth] = useState(() => new Date(sel.getFullYear(), sel.getMonth(), 1));
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  // the shown month follows the selected day (e.g. tapping a spill-over day)
  useEffect(() => {
    const d = fromKey(selected);
    setMonth(prev => (prev.getFullYear() === d.getFullYear() && prev.getMonth() === d.getMonth() ? prev : new Date(d.getFullYear(), d.getMonth(), 1)));
  }, [selected]);

  const shiftMonth = (n: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + n, 1);
    setMonth(next);
    // select the 1st (or today when coming back to this month)
    const isThis = next.getFullYear() === now.getFullYear() && next.getMonth() === now.getMonth();
    onSelect(isThis ? today : toKey(next));
  };
  const shiftWeek = (n: number) => {
    const d = addDays(sel, n * 7);
    onSelect(toKey(d));
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const onTouchStart = (e: React.TouchEvent) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.changedTouches[0].clientX - t.x;
    const dy = e.changedTouches[0].clientY - t.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    const dir = dx < 0 ? 1 : -1;
    if (collapsed) shiftWeek(dir);
    else shiftMonth(dir);
  };

  /* month grid: 6 weeks from the Sunday before the 1st */
  const first = sundayOf(month);
  const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, i) => addDays(first, w * 7 + i)));
  const visibleWeeks = weeks.filter((wk, i) => i < 5 || wk[0].getMonth() === month.getMonth());
  const week = Array.from({ length: 7 }, (_, i) => addDays(sundayOf(sel), i));

  const dots = (k: string) => {
    if (k > today) return null;
    if (extras.excused[k]) return <span className={m.dots}><i className={m.dX} /></span>;
    const e = log[k];
    if (!e) return <span className={m.dots} />;
    return (
      <span className={m.dots}>
        {PRAYERS.map(p => (e[p.key] ? <i key={p.key} className={m['d' + e[p.key]]} /> : null))}
      </span>
    );
  };

  const dayCell = (d: Date, inMonth: boolean) => {
    const k = toKey(d);
    const isSel = k === selected;
    return (
      <button
        key={k}
        type="button"
        className={`${m.day} ${inMonth ? '' : m.dayOut} ${isSel ? m.daySel : ''} ${k === today ? m.dayToday : ''}`}
        aria-pressed={isSel}
        aria-label={d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })}
        onClick={() => onSelect(k)}
      >
        <span className={m.num}>{d.getDate()}</span>
        {dots(k)}
      </button>
    );
  };

  /* agenda for a day */
  const section = (d: Date) => {
    const k = toKey(d);
    const t = times[k];
    const h = hijri(d);
    const rel = k === today ? 'TODAY' : k === toKey(addDays(now, 1)) ? 'TOMORROW' : k === toKey(addDays(now, -1)) ? 'YESTERDAY' : d.toLocaleDateString('en', { weekday: 'long' }).toUpperCase();
    const excused = extras.excused[k];
    const note = (extras.notes[k] ?? '').trim();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return (
      <section key={k} className={m.section} aria-label={`${rel} ${k}`}>
        <button type="button" className={m.secHead} onClick={e => onOpenDay(k, e.currentTarget)}>
          <span>
            <b>{rel}</b> {k}
          </span>
          <span className={m.secRight}>
            {excused && <i className={m.tagX}>{EXCUSE_LABEL[excused]}</i>}
            {extras.travel[k] && <i className={m.tagT}>Travel</i>}
            {d.getDay() === 5 && <i className={m.tagJ}>Jumu’ah</i>}
            {h && <small>{h.day} {h.name}</small>}
          </span>
        </button>
        {note && <p className={m.note}>“{note}”</p>}
        {!t ? (
          <p className={m.loading}>Loading prayer times…</p>
        ) : (
          <ul className={m.list}>
            {PRAYERS.map(p => {
              const w = windowOf(t, p.key);
              const code = log[k]?.[p.key];
              const started = k < today || (k === today && w.start <= nowMin);
              const ended = k < today || (k === today && w.end <= nowMin);
              const current = k === today && w.start <= nowMin && nowMin < w.end;
              const name = d.getDay() === 5 && p.key === 'dhuhr' ? 'Jumu’ah' : p.label;
              const status = excused ? 'X' : code ?? (started ? 'N' : 'F');
              const qasr = extras.travel[k] && (p.key === 'dhuhr' || p.key === 'asr' || p.key === 'isha');
              const pnote = (extras.prayerNotes[`${k}:${p.key}`] ?? '').trim();
              return (
                <li key={p.key}>
                  <button
                    type="button"
                    className={`${m.item} ${ended && !code && !excused ? m.itemPast : ''}`}
                    disabled={!started}
                    onClick={e => onOpenPrayer(k, p.key, e.currentTarget)}
                    aria-label={`${name}, ${range12(t[START[p.key]], END[p.key] ? t[END[p.key]!] : null)}, ${excused ? 'excused' : started ? BLOCK_LABEL[code ?? 'none'] : 'not yet'}`}
                  >
                    <i className={`${m.dot} ${m['d' + status]}`} aria-hidden="true" />
                    <span className={m.itemText}>
                      <small>{range12(t[START[p.key]], END[p.key] ? t[END[p.key]!] : null)}</small>
                      <b>
                        {name} <span lang="ar" dir="rtl">{p.ar}</span>
                        {current && <em className={m.now}>Now</em>}
                      </b>
                      {(qasr || pnote) && <span className={m.sub}>{[qasr && 'Qasr', pnote].filter(Boolean).join(' · ')}</span>}
                    </span>
                    {started && <em className={`${m.state} ${m['t' + status]}`}>{excused ? 'Excused' : BLOCK_LABEL[code ?? 'none']}</em>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  };

  const year = month.getFullYear();
  const monthName = month.toLocaleDateString('en', { month: 'long' });

  return (
    <div className={`${m.root} ${embedded ? m.embedded : ''}`}>
      {/* header */}
      {!embedded && (
      <header className={m.head}>
        <button type="button" className={m.iconBtn} onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M8 9h8M8 12.5h8M8 16h5" /></svg>
        </button>
        <span className={m.appName}>{view === 'qaza' ? 'Qaza manager' : 'Namaz Tracker'}</span>
        <button type="button" className={`${m.iconBtn} ${m.bell}`} onClick={() => onAction('reminders')} aria-label={`Reminders${unloggedToday ? `, ${unloggedToday} prayers to log today` : ''}`}>
          <Icons.Bell />
          {unloggedToday > 0 && <i className={m.badge} />}
        </button>
        <button type="button" className={m.iconBtn} onClick={() => onAction('settings')} aria-label="Settings">
          <Icons.Settings />
        </button>
      </header>
      )}

      {view === 'qaza' ? (
        <div className={m.qazaWrap}>
          <button type="button" className={m.back} onClick={onBack}>
            <Icons.Left /> Calendar
          </button>
          {qazaNode}
        </div>
      ) : (
        <>
          <h1 className={m.title}>
            {monthName} <span>{year}</span>
          </h1>

          <div className={m.cal} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className={m.wdRow} aria-hidden="true">
              {WD.map((w, i) => (
                <span key={w} className={collapsed ? (week[i] && toKey(week[i]) === selected ? m.wdOn : '') : i === sel.getDay() ? m.wdOn : ''}>
                  {w}
                </span>
              ))}
            </div>

            {collapsed ? (
              <div className={m.strip}>
                {week.map(d => {
                  const k = toKey(d);
                  const t = times[k];
                  return (
                    <button key={k} type="button" className={`${m.stripDay} ${k === selected ? m.stripSel : ''} ${k === today ? m.dayToday : ''}`} onClick={() => onSelect(k)} aria-pressed={k === selected} aria-label={d.toDateString()}>
                      <span className={m.stripNum}>{d.getDate()}</span>
                      <span className={m.mini} aria-hidden="true">
                        {t &&
                          k <= today &&
                          PRAYERS.map(p => {
                            const w = windowOf(t, p.key);
                            const top = ((w.start - 240) / (20 * 60)) * 100;
                            const c = extras.excused[k] ? 'X' : log[k]?.[p.key] ?? 'N';
                            return <i key={p.key} className={m['d' + c]} style={{ top: `${Math.max(0, top)}%`, left: `${20 + PRAYERS.indexOf(p) * 12}%` }} />;
                          })}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={m.grid} role="grid" aria-label={`${monthName} ${year}`}>
                {visibleWeeks.map((wk, i) => (
                  <div key={i} className={`${m.week} ${wk.some(d => toKey(d) === selected) ? m.weekSel : ''}`} role="row">
                    {wk.map(d => dayCell(d, d.getMonth() === month.getMonth()))}
                  </div>
                ))}
              </div>
            )}

            <button type="button" className={m.grab} onClick={() => setCollapsed(c => !c)} aria-label={collapsed ? 'Show the whole month' : 'Show one week'}>
              <i />
            </button>
          </div>

          <div className={m.agenda}>
            {locationMissing ? missingNode : [section(sel), section(addDays(sel, 1))]}
          </div>

          <button type="button" className={m.fab} onClick={onLog} aria-label="Log the current prayer">
            <Icons.Plus />
          </button>
        </>
      )}

      {menuOpen && (
        <div className={m.sheetBack} onClick={() => setMenuOpen(false)}>
          <div className={m.sheet} role="dialog" aria-label="Menu" onClick={e => e.stopPropagation()}>
            <i className={m.sheetGrab} aria-hidden="true" />
            {(
              [
                ['qaza', 'Qaza manager', 'Qaza', owedTotal ? `${owedTotal} owed` : ''],
                ['insights', 'Insights', 'Insights', ''],
                ['reminders', 'Reminders', 'Bell', ''],
                ['settings', 'Settings', 'Settings', ''],
                ['export', 'Export backup', 'Download', ''],
                ['print', 'Print this month', 'Print', ''],
              ] as [MobileAction, string, keyof typeof Icons, string][]
            ).map(([a, label, icon, extra]) => {
              const Icon = Icons[icon];
              return (
                <button
                  key={a}
                  type="button"
                  className={m.sheetItem}
                  onClick={() => {
                    setMenuOpen(false);
                    onAction(a);
                  }}
                >
                  <Icon />
                  <span>{label}</span>
                  {extra && <em>{extra}</em>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
