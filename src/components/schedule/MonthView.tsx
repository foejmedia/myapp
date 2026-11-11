'use client';
/** Six weeks of days; each shows up to three activities. Picking a day opens it in Day view. */
import { hijri } from '@/lib/namazExtras';
import { HIJRI_SHORT, clock, toKey, type Occurrence } from '@/lib/schedule';
import { IconMoon } from './icons';
import s from './schedule.module.css';

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MonthView({
  days, month, todayKey, occ, ramadan, onPick,
}: {
  days: Date[];
  month: number;
  todayKey: string;
  occ: (day: string) => Occurrence[];
  ramadan: (d: Date) => boolean;
  onPick: (day: string) => void;
}) {
  // drop a trailing week that lies wholly in the next month
  const shown = days[35] && days[35].getMonth() !== month ? days.slice(0, 35) : days;
  return (
    <div className={s.monthCard}>
      <div className={s.monthHead} aria-hidden="true">
        {WD.map(w => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className={s.monthGrid}>
        {shown.map(d => {
          const k = toKey(d);
          const list = occ(k);
          const h = hijri(d);
          const out = d.getMonth() !== month;
          const done = list.filter(o => o.done).length;
          return (
            <button
              key={k}
              type="button"
              className={`${s.mCell} ${out ? s.mOut : ''} ${k === todayKey ? s.mToday : ''} ${ramadan(d) ? s.mFast : ''}`}
              onClick={() => onPick(k)}
              aria-label={`${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}: ${list.length ? `${list.length} activities` : 'nothing planned'}`}
            >
              <span className={s.mTop}>
                <b>{d.getDate()}</b>
                <small>
                  {h && (h.day === 1 || d.getDate() === 1) ? `${h.day} ${HIJRI_SHORT[h.month]}` : h?.day}
                  {ramadan(d) && <IconMoon />}
                </small>
              </span>
              <span className={s.mList}>
                {list.slice(0, 3).map(o => (
                  <span key={o.a.id} className={`${s.mChip} ${s[`c_${o.a.cat}`]} ${o.done ? s.mChipDone : ''}`}>
                    <i />
                    <span>{o.a.title}</span>
                    <time>{clock(o.start, true)}</time>
                  </span>
                ))}
                {list.length > 3 && <span className={s.mMore}>+{list.length - 3} more</span>}
              </span>
              {list.length > 0 && done === list.length && <span className={s.mAll}>All done</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
