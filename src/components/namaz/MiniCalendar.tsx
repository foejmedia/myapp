'use client';
/** Month calendar: each day ringed by five segments, one per prayer, coloured by status. */
import { PRAYERS, toKey, type Log } from '@/lib/namaz';
import { hijri, type Extras } from '@/lib/namazExtras';
import { Icons } from './shared';
import s from './namaz.module.css';

const WD = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const R = 15;
const C = 2 * Math.PI * R;
const SEG = C / 5;

export default function MiniCalendar({
  month, onMonth, selected, onSelect, today, log, extras,
}: {
  month: Date; // first of the shown month
  onMonth: (d: Date) => void;
  selected: string;
  onSelect: (day: string) => void;
  today: Date;
  log: Log;
  extras: Extras;
}) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const daysIn = new Date(y, m + 1, 0).getDate();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7; // Monday first
  const todayKey = toKey(today);
  const label = month.toLocaleDateString('en', { month: 'long', year: 'numeric' });
  const h1 = hijri(new Date(y, m, 1));
  const h2 = hijri(new Date(y, m, daysIn));
  const hLabel = h1 && h2 ? (h1.name === h2.name ? `${h1.name} ${h1.year}` : `${h1.name} – ${h2.name} ${h2.year}`) : '';

  return (
    <section className={s.miniCal} aria-labelledby="nz-cal-title">
      <p className={s.kickerSm}>Calendar</p>
      <div className={s.calHead}>
        <h2 id="nz-cal-title">{label}</h2>
        <div className={s.calNav}>
          <button type="button" onClick={() => onMonth(new Date(y, m - 1, 1))} aria-label="Previous month">
            <Icons.Left />
          </button>
          <button type="button" onClick={() => onMonth(new Date(today.getFullYear(), today.getMonth(), 1))} className={s.calToday}>
            Today
          </button>
          <button type="button" onClick={() => onMonth(new Date(y, m + 1, 1))} aria-label="Next month">
            <Icons.Right />
          </button>
        </div>
      </div>
      {hLabel && <p className={s.calHijri}>{hLabel}</p>}

      <div className={s.calGrid} role="grid" aria-label={label}>
        {WD.map((w, i) => (
          <span key={i} className={s.calWd} aria-hidden="true">
            {w}
          </span>
        ))}
        {Array.from({ length: daysIn }, (_, i) => {
          const d = new Date(y, m, i + 1);
          const k = toKey(d);
          const future = k > todayKey;
          const entry = log[k];
          const done = PRAYERS.filter(p => entry?.[p.key] && entry[p.key] !== 'M').length;
          const hd = hijri(d);
          const note = (extras.notes[k] ?? '').trim();
          return (
            <button
              key={k}
              type="button"
              role="gridcell"
              className={`${s.calDay} ${k === selected ? s.calSel : ''} ${k === todayKey ? s.calIsToday : ''} ${extras.excused[k] ? s.calExcused : ''}`}
              style={i === 0 ? { gridColumnStart: lead + 1 } : undefined}
              aria-pressed={k === selected}
              aria-label={`${d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })}${future ? '' : `, ${done} of 5 prayed`}${note ? ', has a note' : ''}`}
              onClick={() => onSelect(k)}
            >
              <svg viewBox="0 0 36 36" className={s.ring} aria-hidden="true">
                {!future &&
                  PRAYERS.map((p, pi) => (
                    <circle
                      key={p.key}
                      cx="18"
                      cy="18"
                      r={R}
                      className={s['ring' + (extras.excused[k] ? 'X' : entry?.[p.key] ?? 'N')]}
                      strokeDasharray={`${SEG - 2.2} ${C - SEG + 2.2}`}
                      strokeDashoffset={-pi * SEG + C / 4}
                    />
                  ))}
              </svg>
              <span className={s.calNum}>{d.getDate()}</span>
              {hd && <span className={s.calHday}>{hd.day}</span>}
              {note && <i className={s.calNote} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
