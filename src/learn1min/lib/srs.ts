/**
 * Spaced repetition (SM-2 family). Each learned word becomes a card that comes back
 * for revision after 1 day, then ~6, then growing intervals; mistakes bring it back sooner.
 */
import { addDays, daysBetween } from './dates';

export type Grade = 0 | 1 | 2 | 3; // again · hard · good · easy
export const GRADE_LABEL: Record<Grade, string> = { 0: 'Again', 1: 'Hard', 2: 'Good', 3: 'Easy' };

export type Card = {
  ease: number;     // 1.3 .. 3.0
  interval: number; // days until the next review
  reps: number;     // successful reviews in a row
  lapses: number;   // times forgotten
  due: string;      // day key
  last: string | null;
  added: string;
  history: { day: string; grade: Grade }[];
};

export const MASTERED_DAYS = 21;
const MIN_EASE = 1.3;
const MAX_EASE = 3;

export const newCard = (today: string): Card => ({
  ease: 2.5, interval: 0, reps: 0, lapses: 0, due: today, last: null, added: today, history: [],
});

export function review(card: Card, grade: Grade, today: string): Card {
  let { ease, interval, reps, lapses } = card;
  if (grade === 0) {
    reps = 0;
    lapses += 1;
    interval = 1;
    ease = Math.max(MIN_EASE, ease - 0.2);
  } else {
    reps += 1;
    if (reps === 1) interval = grade === 3 ? 3 : 1;
    else if (reps === 2) interval = grade === 1 ? 3 : grade === 2 ? 6 : 8;
    else interval = Math.max(interval + 1, Math.round(interval * (grade === 1 ? 1.2 : grade === 2 ? ease : ease * 1.3)));
    ease = Math.min(MAX_EASE, Math.max(MIN_EASE, ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0)));
  }
  return {
    ...card,
    ease: Math.round(ease * 100) / 100,
    interval,
    reps,
    lapses,
    due: addDays(today, interval),
    last: today,
    history: [...card.history, { day: today, grade }].slice(-20),
  };
}

/** When the next review would be for each grade (for showing "1d · 6d · 9d" on the buttons). */
export const preview = (card: Card, today: string) =>
  ([0, 1, 2, 3] as Grade[]).map(g => review(card, g, today).interval);

export const isDue = (c: Card, today: string) => c.due <= today;
export const isMastered = (c: Card) => c.interval >= MASTERED_DAYS;
export const needsPractice = (c: Card) => !isMastered(c) && (c.lapses > 0 || c.ease < 2.2);

export type Difficulty = 'easy' | 'medium' | 'hard';
export const difficulty = (c: Card): Difficulty => (c.ease >= 2.5 ? 'easy' : c.ease >= 2.0 ? 'medium' : 'hard');

/** Cards studied or added in the last seven days — the weekly revision set. */
export const inLastWeek = (c: Card, today: string) => daysBetween(c.last ?? c.added, today) <= 7;

export type CardStatus = 'new' | 'learning' | 'mastered';
export const status = (c: Card): CardStatus => (c.reps === 0 && !c.last ? 'new' : isMastered(c) ? 'mastered' : 'learning');
