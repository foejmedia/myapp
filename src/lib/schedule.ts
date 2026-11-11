/**
 * My Schedule — a personal planner built around the five prayers.
 * Activities are either at a fixed clock time, or anchored to a prayer ("15 min after Fajr")
 * so they follow the prayer times as they shift through the year.
 * Everything is stored in this browser (localStorage).
 */
import type { DayWindows } from './prayerTimes';

/* ---------- dates ---------- */

const pad = (n: number) => String(n).padStart(2, '0');
export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromKey = (k: string) => new Date(`${k}T00:00:00`);
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Weeks start on Monday */
export const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
export const sameDay = (a: Date, b: Date) => toKey(a) === toKey(b);

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};
export const fromMin = (m: number) => {
  const c = Math.max(0, Math.min(24 * 60 - 1, Math.round(m)));
  return `${pad(Math.floor(c / 60))}:${pad(c % 60)}`;
};
/** 330 → "5:30 AM" (compact: "5:30" when the meridiem is shown elsewhere) */
export function clock(m: number, compact = false) {
  const c = ((Math.round(m) % 1440) + 1440) % 1440;
  const h = Math.floor(c / 60);
  const mm = c % 60;
  const t = `${h % 12 || 12}${mm ? `:${pad(mm)}` : ''}`;
  return compact ? t : `${t} ${h < 12 ? 'AM' : 'PM'}`;
}
export const span = (start: number, end: number) => {
  const sameHalf = start < 720 === end < 720;
  return `${clock(start, sameHalf)} – ${clock(end)}`;
};

/** Short Hijri month names for tight spaces */
export const HIJRI_SHORT = ['Muh', 'Saf', 'Rab I', 'Rab II', 'Jum I', 'Jum II', 'Raj', 'Shaʿb', 'Ram', 'Shaw', 'Dhul-Q', 'Dhul-H'];

/* ---------- prayers ---------- */

export const ANCHORS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
export type Anchor = (typeof ANCHORS)[number];
export const ANCHOR_AR: Record<Anchor, string> = {
  Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء',
};
/** Used only until the real times for the user's location have loaded */
export const FALLBACK_TIMES: DayWindows = {
  Fajr: '05:00', Sunrise: '06:20', Dhuhr: '12:30', Asr: '15:45', Maghrib: '18:15', Isha: '19:40',
};

/* ---------- categories ---------- */

export const CATS = [
  { key: 'salah', label: 'Salah', hint: 'Sunnah, nafl, Taraweeh' },
  { key: 'quran', label: 'Quran', hint: 'Tilawah, Hifz, revision' },
  { key: 'study', label: 'Study', hint: 'Tafseer, Fiqh, classes' },
  { key: 'dhikr', label: 'Dhikr & Dua', hint: 'Adhkar, dua, reflection' },
  { key: 'fast', label: 'Fasting', hint: 'Suhoor, iftar' },
  { key: 'life', label: 'Personal', hint: 'Family, work, rest' },
] as const;
export type Cat = (typeof CATS)[number]['key'];
export const catLabel = (c: Cat) => CATS.find(x => x.key === c)?.label ?? c;

/* ---------- activities ---------- */

export type Repeat = 'none' | 'daily' | 'weekdays' | 'weekly';
export const REPEAT_LABEL: Record<Repeat, string> = {
  none: 'Does not repeat',
  daily: 'Every day',
  weekdays: 'Mon – Fri',
  weekly: 'Every week',
};

export type When =
  | { kind: 'at'; start: string; end: string } // "HH:MM"
  | { kind: 'prayer'; anchor: Anchor; offset: number; duration: number }; // minutes; offset < 0 = before

export interface Activity {
  id: string;
  title: string;
  cat: Cat;
  /** first (or only) day, YYYY-MM-DD */
  date: string;
  repeat: Repeat;
  when: When;
  note?: string;
  /** days removed from a repeating activity */
  skip?: string[];
}

export interface Occurrence {
  a: Activity;
  day: string;
  start: number;
  end: number;
  done: boolean;
}

export function occursOn(a: Activity, day: string) {
  if (day < a.date || a.skip?.includes(day)) return false;
  if (a.repeat === 'none') return day === a.date;
  if (a.repeat === 'daily') return true;
  const wd = fromKey(day).getDay();
  if (a.repeat === 'weekdays') return wd >= 1 && wd <= 5;
  return wd === fromKey(a.date).getDay();
}

/** Minutes after midnight for an activity on a day with these prayer times */
export function resolve(when: When, t: DayWindows | undefined) {
  if (when.kind === 'at') {
    const start = toMin(when.start);
    return { start, end: Math.max(toMin(when.end), start + 15) };
  }
  const base = toMin((t ?? FALLBACK_TIMES)[when.anchor]);
  const start = Math.max(0, base + when.offset);
  return { start, end: Math.min(24 * 60, start + Math.max(10, when.duration)) };
}

export function whenLabel(when: When) {
  if (when.kind === 'at') return '';
  const { anchor, offset } = when;
  if (!offset) return `At ${anchor}`;
  return `${Math.abs(offset)} min ${offset < 0 ? 'before' : 'after'} ${anchor}`;
}

/** Compact form for small blocks: "Isha +15m", "Fajr −45m", "Maghrib" */
export function whenShort(when: When) {
  if (when.kind === 'at') return '';
  const { anchor, offset } = when;
  return offset ? `${anchor} ${offset < 0 ? '−' : '+'}${Math.abs(offset)}m` : anchor;
}

export const doneId = (id: string, day: string) => `${id}@${day}`;

export function occurrencesOn(items: Activity[], day: string, t: DayWindows | undefined, done: Record<string, 1>): Occurrence[] {
  return items
    .filter(a => occursOn(a, day))
    .map(a => ({ a, day, ...resolve(a.when, t), done: !!done[doneId(a.id, day)] }))
    .sort((x, y) => x.start - y.start || y.end - x.end);
}

/** Side-by-side columns for overlapping blocks (one day) */
export function layoutDay(list: Occurrence[]) {
  const out: { o: Occurrence; col: number; cols: number }[] = [];
  let group: { o: Occurrence; col: number }[] = [];
  let groupEnd = -1;
  const flush = () => {
    const cols = Math.max(1, ...group.map(g => g.col + 1));
    group.forEach(g => out.push({ ...g, cols }));
    group = [];
  };
  for (const o of list) {
    if (o.start >= groupEnd && group.length) flush();
    const used = new Set(group.filter(g => g.o.end > o.start).map(g => g.col));
    let col = 0;
    while (used.has(col)) col++;
    group.push({ o, col });
    groupEnd = Math.max(groupEnd, o.end);
  }
  if (group.length) flush();
  return out;
}

/* ---------- ready-made activities ---------- */

export interface Template { title: string; cat: Cat; when: When; repeat: Repeat; ramadan?: boolean }

export const TEMPLATES: Template[] = [
  { title: 'Suhoor', cat: 'fast', when: { kind: 'prayer', anchor: 'Fajr', offset: -45, duration: 30 }, repeat: 'daily', ramadan: true },
  { title: 'Quran after Fajr', cat: 'quran', when: { kind: 'prayer', anchor: 'Fajr', offset: 20, duration: 30 }, repeat: 'daily' },
  { title: 'Morning adhkar', cat: 'dhikr', when: { kind: 'prayer', anchor: 'Fajr', offset: 50, duration: 15 }, repeat: 'daily' },
  { title: 'Duha prayer', cat: 'salah', when: { kind: 'prayer', anchor: 'Sunrise', offset: 20, duration: 15 }, repeat: 'daily' },
  { title: 'Evening adhkar', cat: 'dhikr', when: { kind: 'prayer', anchor: 'Asr', offset: 20, duration: 15 }, repeat: 'daily' },
  { title: 'Iftar', cat: 'fast', when: { kind: 'prayer', anchor: 'Maghrib', offset: 0, duration: 30 }, repeat: 'daily', ramadan: true },
  { title: 'Taraweeh', cat: 'salah', when: { kind: 'prayer', anchor: 'Isha', offset: 15, duration: 90 }, repeat: 'daily', ramadan: true },
  { title: 'Tafseer study', cat: 'study', when: { kind: 'at', start: '21:30', end: '22:15' }, repeat: 'weekdays' },
];

/* ---------- storage ---------- */

export const STORE_KEY = 'my-schedule-v1';
export interface Store { items: Activity[]; done: Record<string, 1> }

export function loadStore(): Store {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null') as Store | null;
    if (raw && Array.isArray(raw.items)) return { items: raw.items, done: raw.done ?? {} };
  } catch {
    /* unreadable: start fresh */
  }
  return { items: [], done: {} };
}
export function saveStore(s: Store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked: keeps working for this visit */
  }
}
export const newId = () => Math.random().toString(36).slice(2, 10);
