/** Achievements and milestones, computed from real progress. Nothing is awarded that wasn't done. */
import type { UserData } from '../store/model';
import type { Stats } from './stats';

export type Achievement = { id: string; title: string; desc: string; target: number; value: (s: Stats, d: UserData) => number };

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-lesson', title: 'First lesson', desc: 'Complete your first daily lesson', target: 1, value: s => s.lessons.done },
  { id: 'streak-3', title: '3-day streak', desc: 'Learn three days in a row', target: 3, value: s => s.bestStreak },
  { id: 'words-10', title: '10 Qur’an words', desc: 'Add 10 words to your revision', target: 10, value: s => s.vocab.learned },
  { id: 'duas-5', title: '5 duas learned', desc: 'Learn five daily duas', target: 5, value: s => s.duas.learned },
  { id: 'ayat-10', title: '10 ayat learned', desc: 'Mark ten ayat as learned', target: 10, value: s => s.surahs.ayat },
  {
    id: 'perfect-challenge', title: 'Perfect challenge', desc: 'Score full marks in a daily challenge', target: 1,
    value: (_, d) => (Object.values(d.quiz.daily).some(r => r.total > 0 && r.score === r.total) ? 1 : 0),
  },
  { id: 'streak-7', title: '7-day streak', desc: 'Learn every day for a week', target: 7, value: s => s.bestStreak },
  { id: 'mastered-10', title: '10 words mastered', desc: 'Remember 10 words for 3 weeks or more', target: 10, value: s => s.vocab.mastered },
  { id: 'surah-1', title: 'First complete surah', desc: 'Learn every ayah of a surah', target: 1, value: s => s.surahs.completed },
  { id: 'words-50', title: '50 Qur’an words', desc: 'Add 50 words to your revision', target: 50, value: s => s.vocab.learned },
  { id: 'streak-30', title: '30-day streak', desc: 'Learn every day for a month', target: 30, value: s => s.bestStreak },
  { id: 'words-all', title: 'Every word in the list', desc: 'Learn all 160 most frequent words', target: 160, value: s => s.vocab.learned },
];

export function achievements(s: Stats, d: UserData) {
  const all = ACHIEVEMENTS.map(a => {
    const v = a.value(s, d);
    return { ...a, current: Math.min(v, a.target), earned: v >= a.target, ratio: Math.min(1, v / a.target) };
  });
  const earned = all.filter(a => a.earned);
  // next milestone: the unearned one closest to completion (ties keep list order)
  const next = all.filter(a => !a.earned).sort((a, b) => b.ratio - a.ratio)[0] ?? null;
  return { all, earned, latest: earned[earned.length - 1] ?? null, next };
}
