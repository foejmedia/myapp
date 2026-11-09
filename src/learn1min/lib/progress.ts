/** Saved progress for Learn in 1 Minute (its own localStorage key) and the numbers shown from it. */
import type { Lesson } from './lessons';

export const STORAGE_KEY = 'learn-1-min:v1';

export type Saved = {
  version: 1;
  createdAt: string;
  learned: Record<string, string>; // 'YYYY-MM-DD' -> lesson id learned that day
  saved: string[];                 // lesson ids bookmarked to the notebook
  reviews: number;                 // quick-review questions answered correctly
};

export const emptySaved = (now = Date.now()): Saved => ({
  version: 1, createdAt: new Date(now).toISOString(), learned: {}, saved: [], reviews: 0,
});

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function migrate(raw: unknown): Saved {
  if (!isObj(raw) || raw.version !== 1) throw new Error('Not a Learn in 1 Minute save');
  const learned: Record<string, string> = {};
  if (isObj(raw.learned)) for (const [k, v] of Object.entries(raw.learned)) if (DAY_RE.test(k) && typeof v === 'string') learned[k] = v;
  return {
    version: 1,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date(0).toISOString(),
    learned,
    saved: Array.isArray(raw.saved) ? [...new Set(raw.saved.filter((x): x is string => typeof x === 'string'))] : [],
    reviews: typeof raw.reviews === 'number' && raw.reviews >= 0 ? Math.floor(raw.reviews) : 0,
  };
}

export function load(): Saved | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? migrate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function save(s: Saved): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

/* ---------- days ---------- */

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const keyToDate = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};
export const addDays = (k: string, n: number) => {
  const d = keyToDate(k);
  d.setDate(d.getDate() + n);
  return dayKey(d);
};

/* ---------- lessons ---------- */

/** Today's lesson: the one learned today, else the next new one along the path. */
export function lessonForToday(lessons: Lesson[], learned: Record<string, string>, today: string): Lesson {
  const done = learned[today];
  if (done) {
    const hit = lessons.find(l => l.id === done);
    if (hit) return hit;
  }
  const seen = new Set(Object.values(learned));
  return lessons.find(l => !seen.has(l.id)) ?? lessons[Object.keys(learned).length % lessons.length];
}

/** Tomorrow's lesson, assuming today's is learned. */
export function lessonForTomorrow(lessons: Lesson[], learned: Record<string, string>, today: string): Lesson {
  const t = lessonForToday(lessons, learned, today);
  return lessonForToday(lessons, { ...learned, [today]: t.id }, addDays(today, 1));
}

/* ---------- streaks and stats ---------- */

export function streaks(learned: Record<string, string>, today: string) {
  const days = Object.keys(learned).sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const k of days) {
    run = prev && addDays(prev, 1) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  // Current streak counts back from today, or from yesterday if today is not done yet.
  let current = 0;
  let k = learned[today] ? today : addDays(today, -1);
  while (learned[k]) {
    current++;
    k = addDays(k, -1);
  }
  return { current, best };
}

/** The last seven days, oldest first. */
export function weekStrip(learned: Record<string, string>, today: string) {
  return Array.from({ length: 7 }, (_, i) => {
    const key = addDays(today, i - 6);
    return { key, done: !!learned[key], isToday: key === today };
  });
}

export type Cell = { key: string; day: number; inMonth: boolean };

/** Weeks (Sunday first) covering a month; month is 0-based. */
export function monthGrid(year: number, month: number): Cell[][] {
  const first = new Date(year, month, 1, 12);
  const d = new Date(year, month, 1 - first.getDay(), 12);
  const weeks: Cell[][] = [];
  do {
    const week: Cell[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({ key: dayKey(d), day: d.getDate(), inMonth: d.getMonth() === month });
      d.setDate(d.getDate() + 1);
    }
    weeks.push(week);
  } while (d.getMonth() === month);
  return weeks;
}

export function msUntilTomorrow(now: Date): number {
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return t.getTime() - now.getTime();
}
