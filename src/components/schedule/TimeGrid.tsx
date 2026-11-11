'use client';
/**
 * Hours down, days across (7 for the week, 1 for a day).
 * Prayer times are thin lines across each day; activities are blocks;
 * clicking an empty spot starts a new activity at that half hour.
 */
import { useEffect, useRef } from 'react';
import type { DayWindows } from '@/lib/prayerTimes';
import { hijri } from '@/lib/namazExtras';
import { HIJRI_SHORT, clock, layoutDay, span, toKey, toMin, whenLabel, whenShort, type Occurrence } from '@/lib/schedule';
import { CatIcon, IconAnchor, IconCheck, IconMoon, IconRepeat } from './icons';
import s from './schedule.module.css';

const HOUR = 60; // px per hour
const PX = HOUR / 60;
const LINES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

export default function TimeGrid({
  days, todayKey, now, times, occ, showPrayers, ramadan, onSlot, onOpen, onToggle, onPickDay,
}: {
  days: Date[];
  todayKey: string;
  now: Date;
  times: Record<string, DayWindows>;
  occ: (day: string) => Occurrence[];
  showPrayers: boolean;
  ramadan: (d: Date) => boolean;
  onSlot: (day: string, min: number) => void;
  onOpen: (o: Occurrence) => void;
  onToggle: (o: Occurrence) => void;
  onPickDay: (day: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const single = days.length === 1;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const firstKey = toKey(days[0]);

  // open near "now" on today's week, otherwise near the first activity (or Fajr)
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const keys = days.map(toKey);
    const firsts = keys.flatMap(k => occ(k).map(o => o.start));
    const target = keys.includes(todayKey) ? nowMin - 90 : firsts.length ? Math.min(...firsts) - 45 : 4 * 60;
    el.scrollTop = Math.max(0, target * PX);
    // only when the range changes, not on every tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstKey, days.length]);

  const slotClick = (day: string) => (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const y = e.nativeEvent.offsetY;
    onSlot(day, Math.floor(y / PX / 30) * 30);
  };

  const cols = `${single ? 64 : 72}px repeat(${days.length}, minmax(0, 1fr))`;

  // week: prayer names sit in the time gutter (from today, else the first day with times)
  const refKey = days.map(toKey).find(k => k === todayKey && times[k]) ?? days.map(toKey).find(k => times[k]);
  const ref = !single && showPrayers && refKey ? times[refKey] : undefined;
  const refFast = refKey ? ramadan(new Date(`${refKey}T00:00:00`)) : false;
  const gutter = ref ? LINES.map(p => ({ p, m: toMin(ref[p]) })) : [];

  return (
    <div className={`${s.gridCard} ${single ? s.gridSingle : ''}`}>
      <div className={s.gridScroll} ref={scroller}>
        {/* day headers */}
        <div className={s.dayHeads} style={{ gridTemplateColumns: cols }}>
          <div className={s.tz} />
          {days.map(d => {
            const k = toKey(d);
            const h = hijri(d);
            const isToday = k === todayKey;
            const list = occ(k);
            const done = list.filter(o => o.done).length;
            return (
              <button key={k} type="button" className={`${s.dayHead} ${isToday ? s.dayHeadToday : ''}`} onClick={() => onPickDay(k)} disabled={single}>
                <span className={s.dhName}>{d.toLocaleDateString('en-GB', { weekday: single ? 'long' : 'short' })}</span>
                <span className={s.dhNum}>{d.getDate()}</span>
                <span className={s.dhHijri}>
                  {h ? `${h.day} ${single ? h.name : HIJRI_SHORT[h.month]}` : ''}
                  {ramadan(d) && <IconMoon className={s.dhMoon} />}
                </span>
                {list.length > 0 && (
                  <span className={s.dhBar} aria-label={`${done} of ${list.length} done`}>
                    <i style={{ width: `${(done / list.length) * 100}%` }} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* body */}
        <div className={s.gridBody} style={{ gridTemplateColumns: cols, height: 24 * HOUR }}>
          <div className={s.hours} aria-hidden="true">
            {Array.from({ length: 23 }, (_, i) => i + 1)
              .filter(h => !gutter.some(g => Math.abs(g.m - h * 60) < 24))
              .map(h => (
                <span key={h} style={{ top: h * HOUR }}>
                  {clock(h * 60)}
                </span>
              ))}
            {gutter.map(({ p, m }) => {
              const gold = refFast && (p === 'Fajr' || p === 'Maghrib');
              return (
                <div key={p} className={`${s.pGut} ${p === 'Sunrise' ? s.pGutSoft : ''} ${gold ? s.pGutGold : ''}`} style={{ top: m * PX }}>
                  <b>{gold ? (p === 'Fajr' ? 'Sehri ends' : 'Iftar') : p}</b>
                  <small>{clock(m)}</small>
                </div>
              );
            })}
          </div>

          {days.map(d => {
            const k = toKey(d);
            const t = times[k];
            const isToday = k === todayKey;
            const fast = ramadan(d);
            const placed = layoutDay(occ(k));
            return (
              <div
                key={k}
                className={`${s.col} ${isToday ? s.colToday : ''}`}
                onClick={slotClick(k)}
                role="presentation"
                title="Click to add an activity"
              >
                {/* fasting window (Ramadan): Fajr → Maghrib */}
                {showPrayers && fast && t && (
                  <div className={s.fastBand} style={{ top: toMin(t.Fajr) * PX, height: (toMin(t.Maghrib) - toMin(t.Fajr)) * PX }} />
                )}

                {showPrayers && t && LINES.map(p => {
                  const m = toMin(t[p]);
                  const iftar = fast && p === 'Maghrib';
                  const sehri = fast && p === 'Fajr';
                  return (
                    <div key={p} className={`${s.pLine} ${p === 'Sunrise' ? s.pLineSoft : ''} ${iftar || sehri ? s.pLineGold : ''}`} style={{ top: m * PX }}>
                      {single && (
                        <span className={s.pTag}>
                          {iftar ? 'Iftar' : sehri ? 'Sehri ends' : p} · {clock(m)}
                        </span>
                      )}
                    </div>
                  );
                })}

                {placed.map(({ o, col, cols: n }) => {
                  const h = (o.end - o.start) * PX;
                  const tiny = h < 44;
                  // overlaps cascade: later blocks sit on top, indented, so every title stays readable
                  const indent = Math.min(col, 3) * (single ? 12 : 26);
                  const layered = n > 1 && col > 0;
                  const anchored = o.a.when.kind === 'prayer';
                  return (
                    <div
                      key={o.a.id}
                      className={`${s.ev} ${s[`c_${o.a.cat}`]} ${o.done ? s.evDone : ''} ${tiny ? s.evTiny : ''} ${layered ? s.evLayer : ''}`}
                      style={{
                        top: o.start * PX + 1,
                        height: Math.max(22, h - 2),
                        left: `calc(${indent}% + 3px)`,
                        width: `calc(${100 - indent}% - 6px)`,
                        zIndex: 2 + col,
                      }}
                    >
                      <button type="button" className={s.evMain} onClick={() => onOpen(o)} title={`${o.a.title} · ${span(o.start, o.end)}`} aria-label={`${o.a.title}, ${span(o.start, o.end)}. Edit`}>
                        <span className={s.evTitle}>
                          {!tiny && <CatIcon cat={o.a.cat} className={s.evIcon} />}
                          {o.a.title}
                        </span>
                        {(!tiny || single) && <span className={s.evTime}>
                          {span(o.start, o.end)}
                          {!tiny && anchored && (
                            <em>
                              <IconAnchor /> {single ? whenLabel(o.a.when) : whenShort(o.a.when)}
                            </em>
                          )}
                          {!tiny && o.a.repeat !== 'none' && !anchored && <IconRepeat className={s.evRep} />}
                        </span>}
                      </button>
                      <button
                        type="button"
                        className={s.evCheck}
                        aria-pressed={o.done}
                        aria-label={o.done ? `Mark ${o.a.title} as not done` : `Mark ${o.a.title} as done`}
                        onClick={() => onToggle(o)}
                      >
                        <IconCheck />
                      </button>
                    </div>
                  );
                })}

                {isToday && (
                  <div className={s.nowLine} style={{ top: nowMin * PX }} aria-hidden="true">
                    <i />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
