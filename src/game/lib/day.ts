const pad = (n: number) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' in the player's own time zone. */
export function localDay(at: number | Date): string {
  const d = typeof at === 'number' ? new Date(at) : at;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local noon of a 'YYYY-MM-DD' key (noon avoids DST and calendar edge cases). */
export function dayKeyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export const DAY_MS = 864e5;
