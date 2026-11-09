import { describe, expect, it } from 'vitest';
import { buildAllLessons } from '../content/sources';
import { brief, surahOrder } from '../lib/lessons';
import {
  addDays, emptySaved, lessonForToday, lessonForTomorrow, migrate, monthGrid, streaks, weekStrip,
} from '../lib/progress';

const lessons = buildAllLessons();

describe('lesson path', () => {
  it('builds hundreds of unique lessons from the site content', () => {
    expect(lessons.length).toBeGreaterThan(200);
    expect(new Set(lessons.map(l => l.id)).size).toBe(lessons.length);
    expect(lessons.slice(0, 3).map(l => l.track)).toEqual(['word', 'dua', 'surah']);
  });

  it('every quiz has a single correct answer among distinct options', () => {
    for (const l of lessons) {
      const { options, answer } = l.quiz;
      expect(options.length, l.id).toBeGreaterThanOrEqual(2);
      expect(new Set(options).size, l.id).toBe(options.length);
      expect(answer, l.id).toBeGreaterThanOrEqual(0);
      expect(answer, l.id).toBeLessThan(options.length);
    }
  });

  it('surah facts match the quiz answers', () => {
    for (const l of lessons.filter(x => x.track === 'surah')) {
      const fact = (label: string) => l.facts!.find(f => f.label === label)!.value;
      const right = l.quiz.options[l.quiz.answer];
      if (l.quiz.prompt.startsWith('Where')) expect(right).toBe(fact('Revealed in'));
      else expect(right).toBe(fact('Ayat'));
    }
  });

  it('starts surahs with Al-Fatihah and the last three', () => {
    expect(surahOrder([114, 2, 1, 112, 113, 80]).slice(0, 5)).toEqual([1, 112, 113, 114, 80]);
  });

  it('keeps cards short', () => {
    expect(brief('One. Two two. Three three three.', 12)).toBe('One.');
    for (const l of lessons) if (l.note) expect(l.note.length, l.id).toBeLessThanOrEqual(400);
  });
});

describe('daily progress', () => {
  it('gives a new lesson each day and keeps today fixed once learned', () => {
    expect(lessonForToday(lessons, {}, '2026-11-09').id).toBe(lessons[0].id);
    const learned = { '2026-11-08': lessons[0].id };
    expect(lessonForToday(lessons, learned, '2026-11-09').id).toBe(lessons[1].id);
    expect(lessonForTomorrow(lessons, learned, '2026-11-09').id).toBe(lessons[2].id);
    expect(lessonForToday(lessons, { ...learned, '2026-11-09': lessons[5].id }, '2026-11-09').id).toBe(lessons[5].id);
  });

  it('counts current and best streaks', () => {
    const learned = { '2026-11-01': 'a', '2026-11-02': 'b', '2026-11-03': 'c', '2026-11-07': 'd', '2026-11-08': 'e' };
    expect(streaks(learned, '2026-11-09')).toEqual({ current: 2, best: 3 }); // today not done yet: still counts
    expect(streaks({ ...learned, '2026-11-09': 'f' }, '2026-11-09')).toEqual({ current: 3, best: 3 });
    expect(streaks(learned, '2026-11-11').current).toBe(0);
  });

  it('week strip and calendar', () => {
    const w = weekStrip({ '2026-11-09': 'x' }, '2026-11-09');
    expect(w).toHaveLength(7);
    expect(w[6]).toEqual({ key: '2026-11-09', done: true, isToday: true });
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    const weeks = monthGrid(2026, 10);
    expect(weeks[0][0].key).toBe('2026-11-01');
    expect(weeks.flat().filter(c => c.inMonth)).toHaveLength(30);
  });

  it('migrates saved data safely', () => {
    const s = { ...emptySaved(0), learned: { '2026-11-09': 'x', bad: 'y' }, saved: ['a', 'a', 3] };
    expect(migrate(s)).toEqual({ ...emptySaved(0), learned: { '2026-11-09': 'x' }, saved: ['a'] });
    expect(() => migrate({ version: 2 })).toThrow();
  });
});
