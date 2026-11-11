'use client';
/** Left column: mini calendar, today's plan, categories, ready-made routines, location. */
import { useEffect, useState } from 'react';
import type { DayWindows, PrayerLocation } from '@/lib/prayerTimes';
import {
  CATS, TEMPLATES, addDays, clock, mondayOf, resolve, span, toKey, toMin,
  type Activity, type Cat, type Occurrence, type Template,
} from '@/lib/schedule';
import { CatIcon, IconCheck, IconLeft, IconPin, IconPlus, IconRight, IconSpark } from './icons';
import s from './schedule.module.css';

const WD = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function inTime(min: number) {
  if (min < 1) return 'now';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `in ${h ? `${h}h ` : ''}${m}m`;
}

export default function Sidebar({
  now, cursor, onPick, week, today, todayTimes, ramadan, items, hidden, onToggleCat, onAdd, onTemplates,
  onToggleDone, onOpen, loc, locBusy, onGps, timesFailed,
}: {
  now: Date;
  cursor: string;
  onPick: (k: string) => void;
  week: string[];
  today: Occurrence[];
  todayTimes?: DayWindows;
  ramadan: boolean;
  items: Activity[];
  hidden: Cat[];
  onToggleCat: (c: Cat) => void;
  onAdd: () => void;
  onTemplates: (t: Template[]) => void;
  onToggleDone: (o: Occurrence) => void;
  onOpen: (o: Occurrence) => void;
  loc: PrayerLocation | null;
  locBusy: boolean;
  onGps: () => void;
  timesFailed: boolean;
}) {
  /* mini calendar month follows the selected day */
  const [month, setMonth] = useState(() => {
    const d = new Date(`${cursor}T00:00:00`);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  useEffect(() => {
    const d = new Date(`${cursor}T00:00:00`);
    setMonth(m => (m.getMonth() === d.getMonth() && m.getFullYear() === d.getFullYear() ? m : new Date(d.getFullYear(), d.getMonth(), 1)));
  }, [cursor]);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(mondayOf(month), i));
  const todayKey = toKey(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const done = today.filter(o => o.done).length;
  const next = today.find(o => o.end > nowMin && !o.done);

  // Ramadan: the two times that matter most today
  const fastTimes = ramadan && todayTimes
    ? [
        { label: 'Sehri ends', at: toMin(todayTimes.Fajr) },
        { label: 'Iftar', at: toMin(todayTimes.Maghrib) },
      ]
    : [];

  const counts = Object.fromEntries(CATS.map(c => [c.key, items.filter(a => a.cat === c.key).length])) as Record<Cat, number>;
  const have = new Set(items.map(a => a.title.toLowerCase()));
  const templates = TEMPLATES.filter(t => ramadan || !t.ramadan);
  const missing = templates.filter(t => !have.has(t.title.toLowerCase()));

  return (
    <aside className={s.side} aria-label="Schedule tools">
      <button type="button" className={s.sideAdd} onClick={onAdd}>
        <IconPlus /> New activity
      </button>

      {/* mini calendar */}
      <section className={s.mini} aria-label="Pick a date">
        <div className={s.miniHead}>
          <b>{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</b>
          <span>
            <button type="button" className={s.iconBtnSm} aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
              <IconLeft />
            </button>
            <button type="button" className={s.iconBtnSm} aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
              <IconRight />
            </button>
          </span>
        </div>
        <div className={s.miniGrid}>
          {WD.map((w, i) => (
            <span key={i} className={s.miniWd} aria-hidden="true">
              {w}
            </span>
          ))}
          {cells.map(d => {
            const k = toKey(d);
            return (
              <button
                key={k}
                type="button"
                className={[
                  s.miniDay,
                  d.getMonth() !== month.getMonth() ? s.miniOut : '',
                  week.includes(k) ? s.miniWeek : '',
                  k === cursor ? s.miniSel : '',
                  k === todayKey ? s.miniToday : '',
                ].join(' ')}
                onClick={() => onPick(k)}
                aria-label={d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                aria-current={k === cursor ? 'date' : undefined}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </section>

      {/* today */}
      <section className={s.card} aria-label="Today">
        <div className={s.cardHead}>
          <h2>Today</h2>
          {today.length > 0 && (
            <span className={s.count}>
              {done} of {today.length} done
            </span>
          )}
        </div>
        {today.length > 0 && (
          <div className={s.progress} aria-hidden="true">
            <i style={{ width: `${(done / today.length) * 100}%` }} />
          </div>
        )}

        {fastTimes.length > 0 && (
          <div className={s.fastRow}>
            {fastTimes.map(f => (
              <div key={f.label} className={s.fastTile}>
                <small>{f.label}</small>
                <b>{clock(f.at)}</b>
                <span>{f.at > nowMin ? inTime(f.at - nowMin) : 'passed'}</span>
              </div>
            ))}
          </div>
        )}

        {next && (
          <p className={s.nextUp}>
            <span>Next</span> <b>{next.a.title}</b> · {clock(next.start)} {next.start > nowMin ? `(${inTime(next.start - nowMin)})` : '(now)'}
          </p>
        )}

        {today.length === 0 ? (
          <p className={s.muted}>Nothing planned for today.</p>
        ) : (
          <ul className={s.todayList}>
            {today.map(o => (
              <li key={o.a.id} className={`${s.todayItem} ${s[`c_${o.a.cat}`]} ${o.done ? s.todayDone : ''} ${o.end <= nowMin && !o.done ? s.todayPast : ''}`}>
                <button type="button" className={s.tick} aria-pressed={o.done} aria-label={o.done ? 'Mark as not done' : 'Mark as done'} onClick={() => onToggleDone(o)}>
                  <IconCheck />
                </button>
                <button type="button" className={s.todayText} onClick={() => onOpen(o)}>
                  <b>{o.a.title}</b>
                  <small>{span(o.start, o.end)}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* categories */}
      <section className={s.card} aria-label="Categories">
        <div className={s.cardHead}>
          <h2>Categories</h2>
          {hidden.length > 0 && <span className={s.count}>{hidden.length} hidden</span>}
        </div>
        {/* phones and tablets: adding an activity lives here instead of a floating button */}
        <button type="button" className={s.catAdd} onClick={onAdd}>
          <IconPlus /> New activity
        </button>
        <ul className={s.cats}>
          {CATS.map(c => {
            const off = hidden.includes(c.key);
            return (
              <li key={c.key}>
                <button type="button" className={`${s.cat} ${s[`c_${c.key}`]} ${off ? s.catOff : ''}`} aria-pressed={!off} onClick={() => onToggleCat(c.key)}>
                  <span className={s.catIcon}>
                    <CatIcon cat={c.key} />
                  </span>
                  <span className={s.catText}>
                    <b>{c.label}</b>
                    <small>{c.hint}</small>
                  </span>
                  <span className={s.catCount}>{counts[c.key]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ready-made */}
      {missing.length > 0 && (
        <section className={s.card} aria-label="Ready-made activities">
          <div className={s.cardHead}>
            <h2>
              <IconSpark className={s.spark} /> {ramadan ? 'Ramadan routine' : 'Daily routine'}
            </h2>
          </div>
          <p className={s.muted}>Pinned to prayer times, so they move with the sun.</p>
          <ul className={s.tpls}>
            {missing.map(t => {
              const r = resolve(t.when, todayTimes);
              return (
                <li key={t.title} className={s[`c_${t.cat}`]}>
                  <span className={s.tplDot} />
                  <span className={s.tplText}>
                    <b>{t.title}</b>
                    <small>{clock(r.start)}</small>
                  </span>
                  <button type="button" className={s.iconBtnSm} aria-label={`Add ${t.title}`} onClick={() => onTemplates([t])}>
                    <IconPlus />
                  </button>
                </li>
              );
            })}
          </ul>
          {missing.length > 1 && (
            <button type="button" className={s.ghostBtn} onClick={() => onTemplates(missing)}>
              Add all {missing.length}
            </button>
          )}
        </section>
      )}

      {/* location */}
      <section className={s.locCard}>
        <IconPin className={s.locIcon} />
        <div>
          <small>Prayer times for</small>
          <b>{loc ? loc.name : 'Finding your location…'}</b>
          {timesFailed && <span className={s.err}>Could not load prayer times. Using estimates.</span>}
        </div>
        <button type="button" className={s.linkBtn} onClick={onGps} disabled={locBusy}>
          {locBusy ? 'Locating…' : 'Use my location'}
        </button>
      </section>
    </aside>
  );
}
