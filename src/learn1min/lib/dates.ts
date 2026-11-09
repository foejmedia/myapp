/** Local calendar days as 'YYYY-MM-DD' keys, streaks and calendar grids. */

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

export const daysBetween = (a: string, b: string) => Math.round((keyToDate(b).getTime() - keyToDate(a).getTime()) / 864e5);

export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Current run of active days (counting from today, or yesterday if today has no activity yet) and the best run ever. */
export function streaks(activeDays: Iterable<string>, today: string) {
  const set = new Set(activeDays);
  const days = [...set].sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const k of days) {
    run = prev && addDays(prev, 1) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  let current = 0;
  let k = set.has(today) ? today : addDays(today, -1);
  while (set.has(k)) {
    current++;
    k = addDays(k, -1);
  }
  return { current, best };
}

/** The seven days ending today, oldest first. */
export function lastSevenDays(today: string) {
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
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
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
}

export const greeting = (hour: number) =>
  hour < 5 ? 'Peaceful night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
