/**
 * Noorani Qaida tracker — one progress document per learner profile.
 * Pure: no React or storage here (see useQaidaTracker).
 */
import { DAY_RE, addDays, streaks } from '@/learn1min/lib/dates';

export type QaidaProgress = {
  v: 1;
  startedAt: string;
  /** lesson id -> item ids the learner has listened to */
  heard: Record<string, string[]>;
  /** lesson id -> day the lesson was completed */
  done: Record<string, string>;
  /** last lesson opened */
  last: { lesson: number; at: string } | null;
  /** day -> number of practice actions */
  activity: Record<string, number>;
};

export type LessonInfo = { id: number; title: string; total: number };

export const emptyProgress = (now = new Date()): QaidaProgress => ({
  v: 1,
  startedAt: now.toISOString(),
  heard: {},
  done: {},
  last: null,
  activity: {},
});

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Validate anything read from storage; unknown shapes become an empty document. */
export function migrate(raw: unknown): QaidaProgress {
  if (!isObj(raw) || raw.v !== 1) return emptyProgress();
  const out = emptyProgress(new Date(typeof raw.startedAt === 'string' ? raw.startedAt : Date.now()));
  if (isObj(raw.heard))
    for (const [k, v] of Object.entries(raw.heard))
      if (/^\d+$/.test(k) && Array.isArray(v)) out.heard[k] = [...new Set(v.filter((x): x is string => typeof x === 'string'))];
  if (isObj(raw.done))
    for (const [k, v] of Object.entries(raw.done)) if (/^\d+$/.test(k) && typeof v === 'string' && DAY_RE.test(v)) out.done[k] = v;
  if (isObj(raw.activity))
    for (const [k, v] of Object.entries(raw.activity)) if (DAY_RE.test(k) && typeof v === 'number' && v > 0) out.activity[k] = v;
  if (isObj(raw.last) && typeof raw.last.lesson === 'number' && typeof raw.last.at === 'string')
    out.last = { lesson: raw.last.lesson, at: raw.last.at };
  return out;
}

const bump = (p: QaidaProgress, day: string): QaidaProgress['activity'] => ({ ...p.activity, [day]: (p.activity[day] ?? 0) + 1 });

/** Record that an item was listened to. Completes the lesson once every item has been heard. */
export function markHeard(p: QaidaProgress, lesson: number, itemId: string, total: number, day: string): QaidaProgress {
  const key = String(lesson);
  const list = p.heard[key] ?? [];
  if (list.includes(itemId)) return p;
  const heard = [...list, itemId];
  const done = !p.done[key] && total > 0 && heard.length >= total ? { ...p.done, [key]: day } : p.done;
  return { ...p, heard: { ...p.heard, [key]: heard }, done, activity: bump(p, day) };
}

export function setDone(p: QaidaProgress, lesson: number, done: boolean, day: string): QaidaProgress {
  const key = String(lesson);
  if (!!p.done[key] === done) return p;
  const next = { ...p.done };
  if (done) next[key] = day;
  else delete next[key];
  return { ...p, done: next, activity: done ? bump(p, day) : p.activity };
}

export function openLesson(p: QaidaProgress, lesson: number, at: Date): QaidaProgress {
  return { ...p, last: { lesson, at: at.toISOString() } };
}

export function resetLesson(p: QaidaProgress, lesson: number): QaidaProgress {
  const key = String(lesson);
  const heard = { ...p.heard };
  const done = { ...p.done };
  delete heard[key];
  delete done[key];
  return { ...p, heard, done };
}

/** 0–1 for one lesson. Completed lessons count as full. */
export function lessonPct(p: QaidaProgress, lesson: LessonInfo): number {
  if (p.done[String(lesson.id)]) return 1;
  if (!lesson.total) return 0;
  return Math.min(1, (p.heard[String(lesson.id)]?.length ?? 0) / lesson.total);
}

export function summary(p: QaidaProgress, lessons: LessonInfo[], today: string) {
  const totalItems = lessons.reduce((a, l) => a + l.total, 0);
  const practised = lessons.reduce((a, l) => a + Math.round(lessonPct(p, l) * l.total), 0);
  const completed = lessons.filter(l => p.done[String(l.id)]).length;
  const { current, best } = streaks(Object.keys(p.activity), today);
  // next lesson: the last opened one if unfinished, else the first unfinished one
  const lastOpen = p.last && lessons.find(l => l.id === p.last!.lesson && !p.done[String(l.id)]);
  const next = lastOpen || lessons.find(l => !p.done[String(l.id)]) || null;
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    return { day, count: p.activity[day] ?? 0 };
  });
  return {
    totalItems,
    practised,
    completed,
    pct: totalItems ? practised / totalItems : 0,
    streak: current,
    bestStreak: best,
    next,
    week,
    today: p.activity[today] ?? 0,
  };
}

/** localStorage key prefix; one document per learner profile (device-only). */
export const STORAGE_PREFIX = 'lq:progress:';
