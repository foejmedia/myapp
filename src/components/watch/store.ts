'use client';
import type { Video } from '@/lib/videos/catalog';

/** What's kept per video: enough to show its card even after it leaves the channel's feed */
export type Snap = Pick<Video, 'id' | 'title' | 'channel' | 'row' | 'short'>;
export interface Progress { t: number; d: number; at: number; v: Snap }

const PROGRESS_KEY = 'watch-progress';
const LIST_KEY = 'watch-list';
const MAX_PROGRESS = 60;

const read = <T,>(key: string, fallback: T): T => {
  try { return (JSON.parse(localStorage.getItem(key) ?? 'null') as T) ?? fallback; } catch { return fallback; }
};
const write = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* full or blocked */ } };

export const snap = (v: Snap): Snap => ({ id: v.id, title: v.title, channel: v.channel, row: v.row, short: v.short });

export const readProgress = () => read<Record<string, Progress>>(PROGRESS_KEY, {});

export function saveProgress(v: Snap, t: number, d: number) {
  const all = readProgress();
  // finished: drop it, so it leaves "Continue watching"
  if (d > 0 && t >= d - 20) delete all[v.id];
  else all[v.id] = { t, d, at: Date.now(), v: snap(v) };
  const ids = Object.keys(all).sort((a, b) => all[b].at - all[a].at);
  for (const id of ids.slice(MAX_PROGRESS)) delete all[id];
  write(PROGRESS_KEY, all);
}

/** Where to start: the saved position, unless it's just the first seconds or the very end */
export function resumeAt(id: string) {
  const p = readProgress()[id];
  return p && p.t > 10 && p.t < p.d - 20 ? Math.floor(p.t) : 0;
}

export const readList = () => read<Snap[]>(LIST_KEY, []);

export function toggleList(v: Snap): Snap[] {
  const list = readList();
  const next = list.some(x => x.id === v.id) ? list.filter(x => x.id !== v.id) : [snap(v), ...list];
  write(LIST_KEY, next);
  return next;
}
