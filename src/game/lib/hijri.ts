/** Hijri date via Intl's Umm al-Qura calendar, plus the player's ±2 day sighting adjustment. */

export const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani", 'Jumada al-Ula', 'Jumada al-Akhirah',
  'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhul Qa'dah", 'Dhul Hijjah',
];

export type Hijri = { day: number; month: number; year: number; monthName: string };

let fmt: Intl.DateTimeFormat | null | undefined;

export function toHijri(date: Date, offsetDays = 0): Hijri | null {
  try {
    if (fmt === undefined) {
      fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' });
    }
    if (!fmt) return null;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offsetDays, 12);
    const parts = fmt.formatToParts(d);
    const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value ?? '', 10);
    const day = get('day');
    const month = get('month');
    const year = get('year') || get('relatedYear');
    if (!day || !month || !year) return null;
    return { day, month, year, monthName: HIJRI_MONTHS[month - 1] ?? '' };
  } catch {
    fmt = null;
    return null;
  }
}

export const formatHijri = (h: Hijri) => `${h.day} ${h.monthName} ${h.year} AH`;
