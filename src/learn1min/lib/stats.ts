/** Everything the dashboard shows, derived from the learner's own saved data (no placeholder numbers). */
import { CHAPTERS } from '../content/chapters';
import type { UserData } from '../store/model';
import { addDays, keyToDate, lastSevenDays, streaks } from './dates';
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
    week: weekNumbers(d, today, days),
  };
}

export type Stats = ReturnType<typeof computeStats>;

/** Activity per day for the last 7 days, the 7 before that, and active days since Monday. */
function weekNumbers(d: UserData, today: string, days: string[]) {
  const count = (day: string) => d.activity[day] ?? (d.learned[day] ? 1 : 0);
  const last7 = lastSevenDays(today).map(day => ({ day, count: count(day) }));
  const prev7Total = Array.from({ length: 7 }, (_, i) => count(addDays(today, -7 - i))).reduce((a, b) => a + b, 0);
  const sinceMonday = (keyToDate(today).getDay() + 6) % 7; // 0 on Monday
  const active = new Set(days);
  const activeThisWeek = Array.from({ length: sinceMonday + 1 }, (_, i) => addDays(today, -i)).filter(k => active.has(k)).length;
  const total = last7.reduce((a, b) => a + b.count, 0);
  return { last7, total, prev7Total, activeThisWeek, goal: 5 };
}
