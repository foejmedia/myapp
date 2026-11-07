/** Sky phase and colours from the day's prayer times. */
import type { PrayerName, PrayerTimes } from './prayer';
import { SALAH } from './prayer';

export type Phase = 'night' | 'fajr' | 'morning' | 'midday' | 'asr' | 'maghrib';

export const SKY: Record<Phase, { top: string; bottom: string; theme: 'day' | 'night'; label: string }> = {
  night: { top: '#0b1030', bottom: '#27305f', theme: 'night', label: 'Night' },
  fajr: { top: '#2e3366', bottom: '#e6aea8', theme: 'night', label: 'Dawn' },
  morning: { top: '#b9dfe8', bottom: '#f6eddc', theme: 'day', label: 'Morning' },
  midday: { top: '#97cfe2', bottom: '#eef2e3', theme: 'day', label: 'Midday' },
  asr: { top: '#f0cf8f', bottom: '#f8ead0', theme: 'day', label: 'Afternoon' },
  maghrib: { top: '#14204f', bottom: '#4a5f97', theme: 'night', label: 'Dusk' },
};

export function phaseAt(now: Date, t: PrayerTimes): Phase {
  const n = now.getTime();
  if (n < t.fajr.getTime()) return 'night';
  if (n < t.sunrise.getTime()) return 'fajr';
  if (n < t.dhuhr.getTime()) return 'morning';
  if (n < t.asr.getTime()) return 'midday';
  if (n < t.maghrib.getTime()) return 'asr';
  if (n < t.isha.getTime()) return 'maghrib';
  return 'night';
}

/** Rough clock-based times, used for the sky only until the player sets a location. */
export function approximateTimes(date: Date): PrayerTimes {
  const at = (h: number, m: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
  return {
    fajr: at(5, 0), sunrise: at(6, 20), dhuhr: at(12, 20), asr: at(15, 40), maghrib: at(18, 10), isha: at(19, 30),
  };
}

/** The salah whose time began most recently today (null before Fajr). */
export function currentSalah(now: Date, t: PrayerTimes): { name: Exclude<PrayerName, 'sunrise'>; start: Date } | null {
  let found: { name: Exclude<PrayerName, 'sunrise'>; start: Date } | null = null;
  for (const name of SALAH) if (t[name].getTime() <= now.getTime()) found = { name, start: t[name] };
  return found;
}

export function nextSalah(now: Date, t: PrayerTimes): { name: Exclude<PrayerName, 'sunrise'>; start: Date } | null {
  for (const name of SALAH) if (t[name].getTime() > now.getTime()) return { name, start: t[name] };
  return null;
}

/** Default adhkar windows: morning Fajr–Dhuhr, evening Asr–Isha. */
export function adhkarWindows(now: Date, t: PrayerTimes) {
  const n = now.getTime();
  return {
    morning: n >= t.fajr.getTime() && n < t.dhuhr.getTime(),
    evening: n >= t.asr.getTime() && n < t.isha.getTime(),
  };
}
