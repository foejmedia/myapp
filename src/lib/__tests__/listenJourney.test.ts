import { describe, expect, it } from 'vitest';
import { ayahHeard, emptyJourney, journeySummary, migrate, nextUp, resumeAyah, setPosition, setSurahDone } from '../listenJourney';

const surahs = [
  { number: 1, ayahs: 7 },
  { number: 2, ayahs: 286 },
  { number: 3, ayahs: 200 },
];

describe('listen journey', () => {
  it('starts at surah 1, ayah 1', () => {
    expect(nextUp(emptyJourney(), surahs)).toEqual({ surah: surahs[0], ayah: 1 });
  });

  it('resumes at the exact ayah where listening stopped', () => {
    let j = setPosition(emptyJourney(), 2, 45, 'en', new Date());
    j = ayahHeard(j, 2, 44, 286, '2026-11-15');
    expect(nextUp(j, surahs)).toEqual({ surah: surahs[1], ayah: 45 });
    expect(resumeAyah(j, surahs[1])).toBe(45);
  });

  it('finishing the last ayah completes the surah and moves on in order', () => {
    let j = emptyJourney();
    for (let a = 1; a <= 7; a++) {
      j = setPosition(j, 1, a, 'en', new Date());
      j = ayahHeard(j, 1, a, 7, '2026-11-15');
    }
    expect(j.done['1']).toBe('2026-11-15');
    expect(nextUp(j, surahs)?.surah.number).toBe(2);
    const s = journeySummary(j, surahs, '2026-11-15');
    expect(s.surahsDone).toBe(1);
    expect(s.ayahsHeard).toBe(7);
    expect(s.todayAyahs).toBe(7);
    expect(s.streak).toBe(1);
  });

  it('after a finished surah, continues with the next unfinished one after it', () => {
    let j = setSurahDone(emptyJourney(), 2, true, 286, '2026-11-15');
    j = setPosition(j, 2, 286, 'en', new Date());
    expect(nextUp(j, surahs)?.surah.number).toBe(3);
    j = setSurahDone(j, 3, true, 200, '2026-11-15');
    expect(nextUp(j, surahs)?.surah.number).toBe(1); // wraps to the first unfinished
    j = setSurahDone(j, 1, true, 7, '2026-11-15');
    expect(nextUp(j, surahs)).toBeNull();
  });

  it('ignores corrupt stored data', () => {
    expect(migrate('nope')).toEqual(emptyJourney());
    const m = migrate({ v: 1, pos: { surah: 999, ayah: 1, lang: 'en', at: 'x' }, heard: { '2': 10, '200': 3, '3': -1 }, done: {}, activity: {} });
    expect(m.pos).toBeNull();
    expect(m.heard).toEqual({ '2': 10 });
  });
});
