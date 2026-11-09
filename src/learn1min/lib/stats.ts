/** Everything the dashboard shows, derived from the learner's own saved data (no placeholder numbers). */
import { CHAPTERS } from '../content/chapters';
import type { UserData } from '../store/model';
import { addDays, streaks } from './dates';
import { LESSON_PATH, TOTALS, kindOf } from './items';
import { inLastWeek, isDue, isMastered, needsPractice, type Card } from './srs';

export function activeDays(d: UserData): string[] {
  const set = new Set([...Object.keys(d.learned), ...Object.entries(d.activity).filter(([, n]) => n > 0).map(([k]) => k)]);
  return [...set].sort();
}

export function computeStats(d: UserData, today: string) {
  const days = activeDays(d);
  const { current, best } = streaks(days, today);
  const cards = Object.entries(d.cards) as [string, Card][];
  const due = cards.filter(([, c]) => isDue(c, today)).map(([id]) => id);
  const mastered = cards.filter(([, c]) => isMastered(c)).map(([id]) => id);
  const practice = cards.filter(([, c]) => needsPractice(c)).map(([id]) => id);
  const weekly = cards.filter(([, c]) => inLastWeek(c, today)).map(([id]) => id);

  const knownDuas = new Set(Object.keys(d.known).filter(id => kindOf(id) === 'd'));
  const knownSurahs = new Set(Object.keys(d.known).filter(id => kindOf(id) === 's'));
  const ayatLearned = Object.values(d.ayat).reduce((n, list) => n + list.length, 0);
  const surahsStarted = Object.keys(d.ayat).length;
  const surahsCompleted = CHAPTERS.filter(c => (d.ayat[String(c.id)]?.length ?? 0) >= c.versesCount).length;

  const vocabLearned = cards.filter(([id]) => kindOf(id) === 'v').length;
  const lessonsDone = new Set(Object.values(d.learned).filter(id => LESSON_PATH.includes(id))).size;

  const results = d.quiz.history;
  const answered = results.reduce((n, r) => n + r.total, 0);
  const correct = results.reduce((n, r) => n + r.score, 0);

  // next 7 days of reviews (today includes overdue)
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i);
    return { day, count: cards.filter(([, c]) => (i === 0 ? c.due <= day : c.due === day)).length };
  });

  return {
    days,
    streak: current,
    bestStreak: best,
    totalDays: days.length,
    learnedToday: !!d.learned[today],
    activeToday: days.includes(today),
    vocab: { learned: vocabLearned, total: TOTALS.v, mastered: mastered.length, practice: practice.length },
    duas: { learned: knownDuas.size, total: TOTALS.d },
    surahs: { learned: knownSurahs.size, started: surahsStarted, completed: surahsCompleted, total: TOTALS.s, ayat: ayatLearned },
    lessons: { done: lessonsDone, total: LESSON_PATH.length },
    overall: (vocabLearned + knownDuas.size + knownSurahs.size) / (TOTALS.v + TOTALS.d + TOTALS.s),
    due, mastered, practice, weekly, forecast,
    quiz: {
      sessions: results.length,
      accuracy: answered ? correct / answered : null,
      dailyToday: d.quiz.daily[today] ?? null,
    },
    savedCount: Object.keys(d.saved).length,
  };
}

export type Stats = ReturnType<typeof computeStats>;
