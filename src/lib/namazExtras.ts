/**
 * Everything the Namaz Tracker keeps besides the prayer log itself.
 * Stored under its own key so the log ("namaz-tracker-v2") stays exactly as before.
 */
import { PRAYERS, type Code, type Log, type PrayerKey } from './namaz';

export const LOG_KEY = 'namaz-tracker-v2';
const LEGACY_KEY = 'namaz-tracker-v1';
export const EXTRAS_KEY = 'namaz-tracker-extras-v1';

export type ExcuseReason = 'illness' | 'travel' | 'menstruation' | 'other';
export const EXCUSE_LABEL: Record<ExcuseReason, string> = {
  illness: 'Illness',
  travel: 'Travel',
  menstruation: 'Menstruation',
  other: 'Other reason',
};

export type SunnahKey = 'tahajjud' | 'duha' | 'witr';
export const SUNNAH: { key: SunnahKey; label: string }[] = [
  { key: 'tahajjud', label: 'Tahajjud' },
  { key: 'duha', label: 'Duha' },
  { key: 'witr', label: 'Witr' },
];
export type RamadanKey = 'fast' | 'taraweeh';

export interface Extras {
  /** day → reflection */
  notes: Record<string, string>;
  /** "day:prayer" → short note */
  prayerNotes: Record<string, string>;
  /** excused days are not counted as missed or owed */
  excused: Record<string, ExcuseReason>;
  /** days on a journey (qasr) */
  travel: Record<string, true>;
  sunnah: Record<string, Partial<Record<SunnahKey, true>>>;
  ramadan: Record<string, Partial<Record<RamadanKey, true>>>;
  /** qaza owed from before tracking started, per prayer */
  backlog: Partial<Record<PrayerKey, number>>;
  /** extra prayers to make up per day (0 = no plan) */
  qazaPlan: number;
  goal: { prayer: PrayerKey; days: number };
  showSunnah: boolean;
  hideUnlogged: boolean;
  travelMode: boolean;
}

export const DEFAULT_EXTRAS: Extras = {
  notes: {},
  prayerNotes: {},
  excused: {},
  travel: {},
  sunnah: {},
  ramadan: {},
  backlog: {},
  qazaPlan: 0,
  goal: { prayer: 'fajr', days: 5 },
  showSunnah: false,
  hideUnlogged: false,
  travelMode: false,
};

const LEGACY: Record<string, Code> = { done: 'O', missed: 'M', qaza: 'Q' };

export function loadLog(): Log {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (raw) return JSON.parse(raw);
    const old = localStorage.getItem(LEGACY_KEY);
    if (!old) return {};
    const out: Log = {};
    for (const [day, entry] of Object.entries(JSON.parse(old) as Record<string, Record<string, string>>)) {
      const d: Log[string] = {};
      for (const [p, s] of Object.entries(entry)) if (LEGACY[s]) d[p as PrayerKey] = LEGACY[s];
      if (Object.keys(d).length) out[day] = d;
    }
    return out;
  } catch {
    return {};
  }
}

export function loadExtras(): Extras {
  try {
    const raw = JSON.parse(localStorage.getItem(EXTRAS_KEY) || 'null');
    return raw ? { ...DEFAULT_EXTRAS, ...raw, goal: { ...DEFAULT_EXTRAS.goal, ...raw.goal } } : { ...DEFAULT_EXTRAS };
  } catch {
    return { ...DEFAULT_EXTRAS };
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the page keeps working for this visit */
  }
}

/* ---------- Hijri ---------- */

export const HIJRI_MONTHS = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah'];
let hijriFmt: Intl.DateTimeFormat | null = null;
export function hijri(d: Date): { day: number; month: number; name: string; year: string } | null {
  try {
    hijriFmt ??= new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' });
    const parts = hijriFmt.formatToParts(d);
    const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
    const month = parseInt(get('month'), 10) - 1;
    return { day: parseInt(get('day'), 10), month, name: HIJRI_MONTHS[month], year: get('year').replace(/\D/g, '') };
  } catch {
    return null;
  }
}
export const isRamadan = (d: Date) => hijri(d)?.month === 8;

/* ---------- qaza ---------- */

export interface QazaItem { day: string; p: PrayerKey }

/** Missed prayers still owed (excused days don't count), oldest first */
export function owedFromLog(log: Log, extras: Extras): QazaItem[] {
  const out: QazaItem[] = [];
  Object.keys(log).sort().forEach(day => {
    if (extras.excused[day]) return;
    PRAYERS.forEach(({ key }) => {
      if (log[day][key] === 'M') out.push({ day, p: key });
    });
  });
  return out;
}

export function owedByPrayer(log: Log, extras: Extras): Record<PrayerKey, number> {
  const counts = Object.fromEntries(PRAYERS.map(p => [p.key, extras.backlog[p.key] ?? 0])) as Record<PrayerKey, number>;
  owedFromLog(log, extras).forEach(({ p }) => counts[p]++);
  return counts;
}

/* ---------- backup ---------- */

export function exportData(log: Log, extras: Extras) {
  return JSON.stringify({ app: 'learn-quran-namaz', version: 1, exportedAt: new Date().toISOString(), log, extras }, null, 2);
}

const CODES = new Set(['J', 'O', 'L', 'Q', 'M']);
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Validates an exported file; throws a readable message when it isn't one */
export function parseBackup(text: string): { log: Log; extras: Extras } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not a Namaz Tracker backup.');
  }
  const d = data as { log?: unknown; extras?: unknown };
  if (!d || typeof d !== 'object' || !d.log || typeof d.log !== 'object') throw new Error('This file is not a Namaz Tracker backup.');
  const log: Log = {};
  for (const [day, entry] of Object.entries(d.log as Record<string, Record<string, string>>)) {
    if (!DAY_RE.test(day) || !entry || typeof entry !== 'object') continue;
    const clean: Log[string] = {};
    for (const { key } of PRAYERS) if (CODES.has(entry[key])) clean[key] = entry[key] as Code;
    if (Object.keys(clean).length) log[day] = clean;
  }
  const extras = { ...DEFAULT_EXTRAS, ...(typeof d.extras === 'object' && d.extras ? (d.extras as Partial<Extras>) : {}) };
  return { log, extras };
}
