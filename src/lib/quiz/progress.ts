/**
 * Quran Quiz — learning progress, kept in localStorage. Pure update functions + load/save.
 * It records what to practise next; it isn't a score of anyone's faith.
 */
import type { Lang, Level } from './content';
import type { Mode, Question, SessionKind } from './engine';

const KEY = 'quran-quiz-v1';
const MAX_SESSIONS = 40;
const MAX_REVISION = 150;
/** answered correctly this many times in a row → leaves the revision list */
export const MASTERED_STREAK = 2;

export interface Tally { answered: number; correct: number }

export interface RevisionItem {
  question: Question;
  misses: number;
  /** correct answers in a row since the last miss */
  streak: number;
  lastSeen: number;
}

export interface SessionRecord {
  at: number;
  kind: SessionKind;
  level: Level;
  total: number;
  correct: number;
}

export interface Prefs { level: Level | 'auto'; lang: Lang; count: number }

export interface Progress {
  v: 1;
  total: Tally;
  byMode: Partial<Record<Mode, Tally>>;
  byLevel: Partial<Record<Level, Tally>>;
  sessions: SessionRecord[];
  revision: Record<string, RevisionItem>;
  /** YYYY-MM-DD → first result that day */
  daily: Record<string, { correct: number; total: number }>;
  prefs: Prefs;
}

export const emptyProgress = (): Progress => ({
  v: 1,
  total: { answered: 0, correct: 0 },
  byMode: {},
  byLevel: {},
  sessions: [],
  revision: {},
  daily: {},
  prefs: { level: 'auto', lang: 'en', count: 10 },
});

const add = (t: Tally | undefined, correct: boolean): Tally => ({
  answered: (t?.answered ?? 0) + 1,
  correct: (t?.correct ?? 0) + (correct ? 1 : 0),
});

export function recordAnswer(p: Progress, q: Question, correct: boolean, now = Date.now()): Progress {
  const revision = { ...p.revision };
  const prev = revision[q.id];
  if (!correct) {
    revision[q.id] = { question: q, misses: (prev?.misses ?? 0) + 1, streak: 0, lastSeen: now };
  } else if (prev) {
    const streak = prev.streak + 1;
    if (streak >= MASTERED_STREAK) delete revision[q.id];
    else revision[q.id] = { ...prev, streak, lastSeen: now };
  }
  // keep the list bounded: drop the longest-untouched items first
  const keys = Object.keys(revision);
  if (keys.length > MAX_REVISION) {
    keys.sort((a, b) => revision[a].lastSeen - revision[b].lastSeen)
      .slice(0, keys.length - MAX_REVISION)
      .forEach(k => delete revision[k]);
  }
  return {
    ...p,
    total: add(p.total, correct),
    byMode: { ...p.byMode, [q.mode]: add(p.byMode[q.mode], correct) },
    byLevel: { ...p.byLevel, [q.level]: add(p.byLevel[q.level], correct) },
    revision,
  };
}

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function recordSession(p: Progress, s: SessionRecord): Progress {
  const day = dayKey(new Date(s.at));
  return {
    ...p,
    sessions: [s, ...p.sessions].slice(0, MAX_SESSIONS),
    daily: s.kind === 'daily' && !p.daily[day] ? { ...p.daily, [day]: { correct: s.correct, total: s.total } } : p.daily,
  };
}

/** Most-missed first, then the ones not seen for longest */
export function revisionQueue(p: Progress, limit: number): Question[] {
  return Object.values(p.revision)
    .sort((a, b) => b.misses - a.misses || a.lastSeen - b.lastSeen)
    .slice(0, limit)
    .map(r => r.question);
}

export const accuracy = (t?: Tally) => (t && t.answered ? t.correct / t.answered : null);

/** Categories with enough answers and under 70% correct, weakest first */
export function weakModes(p: Progress, minAnswers = 5): Mode[] {
  return (Object.entries(p.byMode) as [Mode, Tally][])
    .filter(([, t]) => t.answered >= minAnswers && accuracy(t)! < 0.7)
    .sort((a, b) => accuracy(a[1])! - accuracy(b[1])!)
    .map(([m]) => m);
}

const ORDER: Level[] = ['beginner', 'intermediate', 'advanced'];

/**
 * The personalised path: start at beginner, move up after 30+ answers at ≥ 80% on the current
 * level, step back after 20+ answers under 50%.
 */
export function suggestLevel(p: Progress): { level: Level; reason: string } {
  let level: Level = 'beginner';
  for (const l of ORDER) if (p.byLevel[l]?.answered) level = l;
  const t = p.byLevel[level];
  const acc = accuracy(t);
  const i = ORDER.indexOf(level);
  if (t && acc != null && t.answered >= 30 && acc >= 0.8 && i < 2) {
    return { level: ORDER[i + 1], reason: `You're answering ${Math.round(acc * 100)}% correctly at ${level} — ready for the next level.` };
  }
  if (t && acc != null && t.answered >= 20 && acc < 0.5 && i > 0) {
    return { level: ORDER[i - 1], reason: `Some extra practice at ${ORDER[i - 1]} will help before continuing.` };
  }
  return { level, reason: t ? `Continuing at ${level}.` : 'A good place to start.' };
}

/** Questions to use for a session at this level */
export const resolveLevel = (p: Progress): Level => (p.prefs.level === 'auto' ? suggestLevel(p).level : p.prefs.level);

// ---------- storage ----------

export function parseProgress(raw: string | null): Progress {
  try {
    const data = JSON.parse(raw ?? 'null');
    if (!data || data.v !== 1 || typeof data.total?.answered !== 'number') return emptyProgress();
    const base = emptyProgress();
    return { ...base, ...data, prefs: { ...base.prefs, ...data.prefs } };
  } catch {
    return emptyProgress();
  }
}

export function loadProgress(): Progress {
  try { return parseProgress(localStorage.getItem(KEY)); } catch { return emptyProgress(); }
}

export function saveProgress(p: Progress) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage full or blocked: progress just isn't kept */ }
}

export function clearProgress() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
