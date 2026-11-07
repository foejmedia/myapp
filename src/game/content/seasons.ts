/**
 * Seasons of the garden. They change only the look and the suggested dhikr;
 * they never promise multiplied in-game rewards — the reward of those days is Allah's.
 * Pending scholar review like everything in content/.
 */
import type { Hijri } from '../lib/hijri';

export type Look = 'friday' | 'fullmoon' | 'ramadan' | 'lastTen' | 'dhulHijjah' | 'arafah' | 'eid';

export type Season = { id: Look; label: string; featured: string; ref?: string };

export function seasonsFor(date: Date, hijri: Hijri | null, afterMaghrib: boolean): Season[] {
  const out: Season[] = [];
  const dow = date.getDay();
  if (dow === 5 || (dow === 4 && afterMaghrib)) {
    out.push({ id: 'friday', label: "Jumu'ah", featured: 'Salawat on the Prophet ﷺ, and a reminder to read Surah al-Kahf.' });
  }
  if (!hijri) return out;
  const { day, month } = hijri;
  if (day >= 13 && day <= 15) out.push({ id: 'fullmoon', label: 'Ayyam al-Bid', featured: 'Evening adhkar under the full moon.' });
  if (month === 9) {
    out.push({ id: 'ramadan', label: 'Ramadan', featured: "Istighfar, and time with the Qur'an." });
    if (day >= 21 || (day === 20 && afterMaghrib)) {
      out.push({
        id: 'lastTen', label: 'The last ten nights',
        featured: "Allahumma innaka 'afuwwun… (the dua of the last ten nights).", ref: 'Tirmidhi 3513',
      });
    }
  }
  if (month === 12 && day <= 10) {
    if (day === 9) {
      out.push({
        id: 'arafah', label: 'The Day of Arafah',
        featured: 'La ilaha illallahu wahdahu la sharika lah…', ref: 'Tirmidhi 3585',
      });
    } else if (day < 10) {
      out.push({ id: 'dhulHijjah', label: 'The first ten days of Dhul Hijjah', featured: 'Takbir, tahlil and tahmid.' });
    }
  }
  if ((month === 10 && day === 1) || (month === 12 && day === 10)) {
    out.push({ id: 'eid', label: month === 10 ? 'Eid al-Fitr' : 'Eid al-Adha', featured: 'The Eid takbir.' });
  }
  return out;
}
