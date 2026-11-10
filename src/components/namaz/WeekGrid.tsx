'use client';
/**
 * The week grid: days across, hours down, each prayer a block spanning its real time window
 * (Fajr → sunrise, Dhuhr → Asr, Asr → Maghrib, Maghrib → Isha, Isha → end of day).
 */
import { useEffect, useRef } from 'react';
import { PRAYERS, toKey, type Log, type PrayerKey } from '@/lib/namaz';
import type { DayWindows } from '@/lib/prayerTimes';
import { EXCUSE_LABEL, SUNNAH, hijri, isRamadan, type Extras, type RamadanKey, type SunnahKey } from '@/lib/namazExtras';
import { BLOCK_LABEL, type Filter } from './shared';
import s from './namaz.module.css';

const PX_PER_MIN = 0.8; // 48px per hour
const PAD = 12; // room above the first hour label
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_KEY: Record<PrayerKey, keyof DayWindows> = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const END_KEY: Record<PrayerKey, keyof DayWindows | null> = { fajr: 'Sunrise', dhuhr: 'Asr', asr: 'Maghrib', maghrib: 'Isha', isha: null };
const QASR = new Set<PrayerKey>(['dhuhr', 'asr', 'isha']);

const mins = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
export const hourLabel = (h: number) => `${h % 12 || 12} ${h < 12 || h === 24 ? 'AM' : 'PM'}`;

/** The window of one prayer on one day, in minutes after midnight */
export function windowOf(t: DayWindows, p: PrayerKey) {
  const start = mins(t[TIME_KEY[p]]);
  const endKey = END_KEY[p];
  const end = endKey ? mins(t[endKey]) : 24 * 60;
  return { start, end: Math.max(end, start + 30), label: `${t[TIME_KEY[p]]} – ${endKey ? t[endKey] : 'Fajr'}` };
}

export default function WeekGrid({
  days, now, times, log, extras, filter, onBlock, onDay, onPrev, onNext, onToggleSunnah, onToggleRamadan, rangeLabel,
}: {
  days: Date[];
  now: Date;
  times: Record<string, DayWindows>;
  log: Log;
  extras: Extras;
  filter: Filter;
  onBlock: (day: string, p: PrayerKey, el: HTMLElement) => void;
  onDay: (day: string, el: HTMLElement) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleSunnah: (day: string, k: SunnahKey) => void;
  onToggleRamadan: (day: string, k: RamadanKey) => void;
  rangeLabel: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const todayKey = toKey(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // hours shown: from the earliest Fajr in view to midnight
  const fajrs = days.map(d => times[toKey(d)]?.Fajr).filter(Boolean) as string[];
  const startHour = fajrs.length ? Math.max(0, Math.floor(Math.min(...fajrs.map(mins)) / 60)) : 4;
  const hours = Array.from({ length: 24 - startHour }, (_, i) => startHour + i);
  const top = (m: number) => (m - startHour * 60) * PX_PER_MIN + PAD;
  const height = (24 - startHour) * 60 * PX_PER_MIN + PAD * 2;

  // open on the current time (or the morning)
  const firstDay = toKey(days[0]);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const showsToday = days.some(d => toKey(d) === todayKey);
    el.scrollTop = Math.max(0, top(showsToday ? nowMin - 90 : startHour * 60 + 60));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstDay, startHour]);

  /** arrow keys move between blocks: ←/→ days, ↑/↓ prayers */
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const [di, pi] = (e.currentTarget.dataset.cell ?? '0-0').split('-').map(Number);
    const move: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const m = move[e.key];
    if (!m) return;
    e.preventDefault();
    const target = e.currentTarget.closest(`.${s.grid}`)?.querySelector<HTMLElement>(`[data-cell="${di + m[0]}-${pi + m[1]}"]`);
    target?.focus();
  };

  return (
    <div className={s.grid} style={{ ['--cols' as string]: days.length }}>
      {/* header row */}
      <div className={s.gridHead}>
        <div className={s.gridNav}>
          <button type="button" className={s.navBtn} onClick={onPrev} aria-label="Previous days">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button type="button" className={`${s.navBtn} ${s.navNext}`} onClick={onNext} aria-label="Next days">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
        {days.map(d => {
          const k = toKey(d);
          const h = hijri(d);
          const excused = extras.excused[k];
          const isToday = k === todayKey;
          return (
            <button
              key={k}
              type="button"
              className={`${s.dayHead} ${isToday ? s.dayHeadToday : ''}`}
              onClick={e => onDay(k, e.currentTarget)}
              aria-label={`${d.toDateString()}: day options`}
            >
              <span className={s.dayHeadMain}>
                <b>{WD[d.getDay()]} {d.getDate()}</b>
                {h && <small>{h.day} {h.name.split(' ')[0]}</small>}
              </span>
              <span className={s.dayTags}>
                {d.getDay() === 5 && <i className={s.tagJumuah}>Jumu’ah</i>}
                {extras.travel[k] && <i className={s.tagTravel}>Travel</i>}
                {excused && <i className={s.tagExcused}>{EXCUSE_LABEL[excused]}</i>}
                {(extras.notes[k] ?? '').trim() && <i className={s.tagNote} aria-label="Has a note">✎</i>}
              </span>
            </button>
          );
        })}
      </div>
      <p className={s.srOnly} aria-live="polite">{rangeLabel}</p>

      {/* optional Sunnah / Ramadan strip */}
      {(extras.showSunnah || days.some(isRamadan)) && (
        <div className={s.extraRow}>
          <div className={s.extraLabel}>{extras.showSunnah ? 'Sunnah' : 'Ramadan'}</div>
          {days.map(d => {
            const k = toKey(d);
            const future = k > todayKey;
            return (
              <div key={k} className={s.extraCell}>
                {extras.showSunnah &&
                  SUNNAH.map(x => {
                    const on = !!extras.sunnah[k]?.[x.key];
                    return (
                      <button key={x.key} type="button" disabled={future} aria-pressed={on} className={on ? s.chipOn : s.chip} onClick={() => onToggleSunnah(k, x.key)}>
                        {x.label}
                      </button>
                    );
                  })}
                {isRamadan(d) &&
                  (['fast', 'taraweeh'] as const).map(x => {
                    const on = !!extras.ramadan[k]?.[x];
                    return (
                      <button key={x} type="button" disabled={future} aria-pressed={on} className={on ? s.chipGold : s.chip} onClick={() => onToggleRamadan(k, x)}>
                        {x === 'fast' ? 'Fasting' : 'Taraweeh'}
                      </button>
                    );
                  })}
              </div>
            );
          })}
        </div>
      )}

      {/* body */}
      <div className={s.gridScroll} ref={scroller} tabIndex={-1}>
        <div className={s.gridBody} style={{ height }}>
          <div className={s.hours} aria-hidden="true">
            {hours.map(h => (
              <span key={h} style={{ top: top(h * 60) }}>
                {hourLabel(h)}
              </span>
            ))}
          </div>
          {days.map((d, di) => {
            const k = toKey(d);
            const t = times[k];
            const excused = extras.excused[k];
            return (
              <div key={k} className={`${s.col} ${excused ? s.colExcused : ''} ${k === todayKey ? s.colToday : ''}`}>
                {hours.map(h => (
                  <i key={h} className={s.hourLine} style={{ top: top(h * 60) }} />
                ))}
                {t ? (
                  PRAYERS.map((p, pi) => {
                    const w = windowOf(t, p.key);
                    const code = log[k]?.[p.key];
                    const startsAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(w.start / 60), w.start % 60);
                    const future = startsAt > now;
                    if (extras.hideUnlogged && !code && !future) return null;
                    const state = excused ? 'X' : future ? 'F' : code ?? 'N';
                    const dim = filter !== 'all' && code !== filter;
                    const name = d.getDay() === 5 && p.key === 'dhuhr' ? 'Jumu’ah' : p.label;
                    const note = (extras.prayerNotes[`${k}:${p.key}`] ?? '').trim();
                    const qasr = extras.travel[k] && QASR.has(p.key);
                    const h = (w.end - w.start) * PX_PER_MIN - 4;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        data-cell={`${di}-${pi}`}
                        data-key={`${k}:${p.key}`}
                        className={`${s.block} ${s['st' + state]} ${dim ? s.dim : ''} ${h < 60 ? s.blockShort : ''}`}
                        style={{ top: top(w.start) + 2, height: h }}
                        aria-disabled={future}
                        aria-label={`${name}, ${d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' })}, ${w.label}: ${excused ? `excused (${EXCUSE_LABEL[excused]})` : future ? 'not yet' : BLOCK_LABEL[code ?? 'none']}`}
                        onClick={e => !future && onBlock(k, p.key, e.currentTarget)}
                        onKeyDown={onKeyDown}
                      >
                        <span className={s.blockName}>
                          {name}
                          <span lang="ar" dir="rtl">{p.ar}</span>
                        </span>
                        <span className={s.blockTime}>{w.label}</span>
                        <span className={s.blockFoot}>
                          {!future && <em>{excused ? 'Excused' : BLOCK_LABEL[code ?? 'none']}</em>}
                          {qasr && <em className={s.qasr}>Qasr</em>}
                          {note && <em aria-label="Has a note">✎</em>}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <span className={s.colLoading} aria-hidden="true" />
                )}
                {k === todayKey && nowMin >= startHour * 60 && (
                  <i className={s.nowLine} style={{ top: top(nowMin) }} aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
