/**
 * The learner's saved progress (one document per profile) and every change to it.
 * Pure: no storage or React here, so the same model works with any backend.
 */
import { DAY_RE } from '../lib/dates';
import { exists } from '../lib/items';
import { newCard, review, type Card, type Grade } from '../lib/srs';

export type QuizResult = { at: string; day: string; mode: string; score: number; total: number };

export type UserData = {
  version: 2;
  createdAt: string;
  /** day -> item id of the daily lesson completed that day */
  learned: Record<string, string>;
  /** spaced-repetition cards, keyed by item id ('v:…') */
  cards: Record<string, Card>;
  /** items marked as learned outside the daily lesson (duas, surahs), item id -> day */
  known: Record<string, string>;
  /** notebook: item id -> ISO time saved */
  saved: Record<string, string>;
  /** personal notes: item id -> note */
  notes: Record<string, { text: string; updatedAt: string }>;
  /** surah number -> ayah numbers marked learned */
  ayat: Record<string, number[]>;
  quiz: { history: QuizResult[]; daily: Record<string, { score: number; total: number }> };
  /** day -> number of learning actions (drives streaks and the activity calendar) */
  activity: Record<string, number>;
};

export const emptyData = (now = new Date()): UserData => ({
  version: 2,
  createdAt: now.toISOString(),
  learned: {}, cards: {}, known: {}, saved: {}, notes: {}, ayat: {},
  quiz: { history: [], daily: {} },
  activity: {},
});

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === 'string';
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function pickRecord<T>(v: unknown, ok: (k: string, x: unknown) => x is T): Record<string, T> {
  const out: Record<string, T> = {};
  if (isObj(v)) for (const [k, x] of Object.entries(v)) if (ok(k, x)) out[k] = x;
  return out;
}

const isCard = (x: unknown): x is Card =>
  isObj(x) && num(x.ease) && num(x.interval) && num(x.reps) && num(x.lapses) && str(x.due) && str(x.added) && Array.isArray(x.history);

/** v1 (the first Learn in 1 Minute release) -> v2. Learned days are kept so streaks survive. */
function fromV1(raw: Record<string, unknown>): UserData {
  const d = emptyData(new Date(str(raw.createdAt) ? raw.createdAt : 0));
  const learned = pickRecord<string>(raw.learned, (k, x): x is string => DAY_RE.test(k) && str(x));
  for (const [day, id] of Object.entries(learned)) {
    // old ids: 'dua-<id>', 'surah-<n>', 'word-<x>' (the old hand-written word list no longer exists)
    const mapped = id.startsWith('dua-') ? `d:${id.slice(4)}` : id.startsWith('surah-') ? `s:${id.slice(6)}` : null;
    d.learned[day] = mapped && exists(mapped) ? mapped : `legacy:${id}`;
    d.activity[day] = (d.activity[day] ?? 0) + 1;
  }
  if (Array.isArray(raw.saved)) {
    for (const id of raw.saved) {
      if (!str(id)) continue;
      const mapped = id.startsWith('dua-') ? `d:${id.slice(4)}` : id.startsWith('surah-') ? `s:${id.slice(6)}` : null;
      if (mapped && exists(mapped)) d.saved[mapped] = d.createdAt;
    }
  }
  return d;
}

/** Validate any stored document and bring it to the current version. Throws on foreign data. */
export function migrate(raw: unknown): UserData {
  if (!isObj(raw)) throw new Error('Not a progress document');
  if (raw.version === 1) return fromV1(raw);
  if (raw.version !== 2) throw new Error(`Unsupported progress version ${String(raw.version)}`);
  const quiz = isObj(raw.quiz) ? raw.quiz : {};
  return {
    version: 2,
    createdAt: str(raw.createdAt) ? raw.createdAt : new Date(0).toISOString(),
    learned: pickRecord<string>(raw.learned, (k, x): x is string => DAY_RE.test(k) && str(x)),
    cards: pickRecord<Card>(raw.cards, (k, x): x is Card => exists(k) && isCard(x)),
    known: pickRecord<string>(raw.known, (k, x): x is string => exists(k) && str(x)),
    saved: pickRecord<string>(raw.saved, (k, x): x is string => exists(k) && str(x)),
    notes: pickRecord<{ text: string; updatedAt: string }>(
      raw.notes, (k, x): x is { text: string; updatedAt: string } => exists(k) && isObj(x) && str(x.text) && str(x.updatedAt),
    ),
    ayat: pickRecord<number[]>(raw.ayat, (k, x): x is number[] => /^\d{1,3}$/.test(k) && Array.isArray(x) && x.every(num)),
    quiz: {
      history: Array.isArray(quiz.history)
        ? (quiz.history as unknown[]).filter((h): h is QuizResult => isObj(h) && str(h.at) && str(h.day) && str(h.mode) && num(h.score) && num(h.total)).slice(-200)
        : [],
      daily: pickRecord<{ score: number; total: number }>(
        quiz.daily, (k, x): x is { score: number; total: number } => DAY_RE.test(k) && isObj(x) && num(x.score) && num(x.total),
      ),
    },
    activity: pickRecord<number>(raw.activity, (k, x): x is number => DAY_RE.test(k) && num(x) && x >= 0),
  };
}

export type Action =
  | { type: 'completeLesson'; itemId: string; day: string }
  | { type: 'grade'; itemId: string; grade: Grade; day: string }
  | { type: 'addCard'; itemId: string; day: string }
  | { type: 'setKnown'; itemId: string; known: boolean; day: string }
  | { type: 'toggleSave'; itemId: string; at: string }
  | { type: 'setNote'; itemId: string; text: string; at: string }
  | { type: 'toggleAyah'; surah: number; ayah: number; day: string }
  | { type: 'quiz'; result: QuizResult; daily: boolean };

const bump = (a: UserData['activity'], day: string) => ({ ...a, [day]: (a[day] ?? 0) + 1 });

export function apply(d: UserData, a: Action): UserData {
  switch (a.type) {
    case 'completeLesson': {
      if (d.learned[a.day]) return d; // one lesson per day; reviewing again changes nothing
      const next: UserData = { ...d, learned: { ...d.learned, [a.day]: a.itemId }, activity: bump(d.activity, a.day) };
      // a learned word joins spaced repetition; it comes back tomorrow
      if (a.itemId.startsWith('v:') && !d.cards[a.itemId]) next.cards = { ...d.cards, [a.itemId]: review(newCard(a.day), 2, a.day) };
      if (!a.itemId.startsWith('v:')) next.known = { ...d.known, [a.itemId]: d.known[a.itemId] ?? a.day };
      return next;
    }
    case 'grade': {
      const card = d.cards[a.itemId] ?? newCard(a.day);
      return { ...d, cards: { ...d.cards, [a.itemId]: review(card, a.grade, a.day) }, activity: bump(d.activity, a.day) };
    }
    case 'addCard':
      return d.cards[a.itemId] ? d : { ...d, cards: { ...d.cards, [a.itemId]: newCard(a.day) } };
    case 'setKnown': {
      const known = { ...d.known };
      if (a.known) known[a.itemId] = known[a.itemId] ?? a.day;
      else delete known[a.itemId];
      return { ...d, known, activity: a.known ? bump(d.activity, a.day) : d.activity };
    }
    case 'toggleSave': {
      const saved = { ...d.saved };
      if (saved[a.itemId]) delete saved[a.itemId];
      else saved[a.itemId] = a.at;
      return { ...d, saved };
    }
    case 'setNote': {
      const notes = { ...d.notes };
      const text = a.text.trim().slice(0, 2000);
      if (text) notes[a.itemId] = { text, updatedAt: a.at };
      else delete notes[a.itemId];
      return { ...d, notes };
    }
    case 'toggleAyah': {
      const key = String(a.surah);
      const list = d.ayat[key] ?? [];
      const has = list.includes(a.ayah);
      const nextList = has ? list.filter(x => x !== a.ayah) : [...list, a.ayah].sort((x, y) => x - y);
      const ayat = { ...d.ayat, [key]: nextList };
      if (!nextList.length) delete ayat[key];
      return { ...d, ayat, activity: has ? d.activity : bump(d.activity, a.day) };
    }
    case 'quiz': {
      const history = [...d.quiz.history, a.result].slice(-200);
      const daily = a.daily && !d.quiz.daily[a.result.day]
        ? { ...d.quiz.daily, [a.result.day]: { score: a.result.score, total: a.result.total } }
        : d.quiz.daily;
      return { ...d, quiz: { history, daily }, activity: bump(d.activity, a.result.day) };
    }
    default:
      return d;
  }
}
