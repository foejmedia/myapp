import { describe, expect, it } from 'vitest';
import { CHAPTERS, SURAH_ORDER } from '../content/chapters';
import { DUAS, ayatFromReference } from '../content/duas';
import { VOCAB } from '../content/vocabulary';
import { addDays, monthGrid, streaks } from '../lib/dates';
import { LESSON_PATH, describe as describeItem, lessonForToday, lessonForTomorrow, wordOfTheDay } from '../lib/items';
import {
  bareArabic, bareText, buildSession, dailyChallenge, duaQuestion, formQuestion, gapQuestion, lessonQuestion,
  matchQuestion, meaningQuestion, surahQuestion, type Question,
} from '../lib/quiz';
import { MASTERED_DAYS, isDue, isMastered, needsPractice, newCard, review } from '../lib/srs';
import { apply, emptyData, migrate } from '../store/model';

const DAY = '2026-11-10';

describe('verified data', () => {
  it('vocabulary is complete and every example contains its word', () => {
    expect(VOCAB.length).toBeGreaterThanOrEqual(150);
    expect(new Set(VOCAB.map(w => w.id)).size).toBe(VOCAB.length);
    for (const w of VOCAB) {
      expect(w.root.length, w.id).toBeGreaterThan(0);
      expect(w.occurrences, w.id).toBeGreaterThan(0);
      expect(w.meaning, w.id).toBeTruthy();
      expect(w.examples.length, w.id).toBeGreaterThan(0);
      for (const ex of w.examples) {
        expect(ex.translation, w.id).toBeTruthy();
        expect(ex.words[ex.wordIndex], `${w.id} ${ex.key}`).toBeTruthy();
      }
      // the displayed form is the word at its meaning location
      const [s, a, i] = w.meaningAt.split(':').map(Number);
      const ex = w.examples.find(e => e.key === `${s}:${a}`);
      expect(ex && bareArabic(ex.words[i - 1]), w.id).toBe(bareArabic(w.form));
    }
  });

  it('vocabulary is ordered by frequency', () => {
    for (let i = 1; i < VOCAB.length; i++) expect(VOCAB[i - 1].occurrences).toBeGreaterThanOrEqual(VOCAB[i].occurrences);
  });

  it('114 chapters with names and meanings; learning order covers all once', () => {
    expect(CHAPTERS).toHaveLength(114);
    expect(new Set(SURAH_ORDER).size).toBe(114);
    expect(SURAH_ORDER.slice(0, 4)).toEqual([1, 112, 113, 114]);
  });

  it('duas are unique and Qur’anic references map to ayat', () => {
    expect(new Set(DUAS.map(d => d.arabic)).size).toBe(DUAS.length);
    expect(ayatFromReference('Surah Ta-Ha 20:25-26')).toEqual(['20:25', '20:26']);
    expect(ayatFromReference('Sahih Muslim')).toEqual([]);
    for (const d of DUAS) if (d.source === 'Quran') expect(d.ayat.length, d.id).toBeGreaterThan(0);
  });
});

describe('questions', () => {
  const check = (q: Question | null) => {
    expect(q).not.toBeNull();
    if (!q || q.kind === 'match') return;
    expect(q.answer).toBeGreaterThanOrEqual(0);
    expect(new Set(q.options).size).toBe(q.options.length);
  };

  it('meaning and reverse questions use the word’s own data and distinct options', () => {
    for (const w of VOCAB) {
      const m = meaningQuestion(w, 's');
      check(m);
      expect(m!.options[m!.answer]).toBe(w.meaning);
      expect(new Set(m!.options.map(bareText)).size).toBe(m!.options.length);
      const f = formQuestion(w, 's');
      check(f);
      expect(f!.options[f!.answer]).toBe(w.form);
      expect(new Set(f!.options.map(bareArabic)).size).toBe(f!.options.length);
    }
  });

  it('gap questions remove the real word and never offer a word already in the ayah', () => {
    for (const w of VOCAB) {
      const g = gapQuestion(w, 's');
      if (!g) continue;
      const ex = w.examples[0];
      expect(g.options[g.answer]).toBe(ex.words[ex.wordIndex]);
      const inAyah = new Set(ex.words.map(bareArabic));
      g.options.forEach((o, i) => i !== g.answer && expect(inAyah.has(bareArabic(o))).toBe(false));
    }
  });

  it('dua, surah and match questions', () => {
    for (const d of DUAS) check(duaQuestion(d.id, 's'));
    for (const c of CHAPTERS) {
      const q = surahQuestion(c.id, 's');
      check(q);
      expect(q!.options[q!.answer]).toBe(c.meaning);
    }
    const m = matchQuestion(VOCAB.slice(0, 20), 's');
    expect(m!.pairs.length).toBe(5);
    expect(new Set(m!.pairs.map(p => bareArabic(p.ar))).size).toBe(5);
  });

  it('every lesson has a check question; sessions and the daily challenge are reproducible', () => {
    for (const id of LESSON_PATH) expect(lessonQuestion(id, 's'), id).not.toBeNull();
    expect(buildSession('mixed', VOCAB, 10, 'x')).toEqual(buildSession('mixed', VOCAB, 10, 'x'));
    expect(buildSession('meaning', VOCAB, 10, 'x')).toHaveLength(10);
    const daily = dailyChallenge(DAY, []);
    expect(daily).toHaveLength(5);
    expect(dailyChallenge(DAY, [])).toEqual(daily);
  });
});

describe('spaced repetition', () => {
  it('intervals grow with good answers and reset on a lapse', () => {
    let c = review(newCard(DAY), 2, DAY);
    expect(c.interval).toBe(1);
    expect(c.due).toBe(addDays(DAY, 1));
    c = review(c, 2, c.due);
    expect(c.interval).toBe(6);
    c = review(c, 2, c.due);
    expect(c.interval).toBe(15);
    c = review(c, 3, c.due);
    expect(isMastered(c)).toBe(c.interval >= MASTERED_DAYS);
    const lapsed = review(c, 0, c.due);
    expect(lapsed.interval).toBe(1);
    expect(lapsed.lapses).toBe(1);
    expect(needsPractice(lapsed)).toBe(true);
    expect(lapsed.ease).toBeLessThan(c.ease);
  });

  it('due cards', () => {
    const c = review(newCard(DAY), 2, DAY);
    expect(isDue(c, DAY)).toBe(false);
    expect(isDue(c, addDays(DAY, 1))).toBe(true);
  });
});

describe('daily path and progress', () => {
  it('interleaves words, duas and surahs and moves forward each day', () => {
    expect(LESSON_PATH.slice(0, 3).map(id => id[0])).toEqual(['v', 'd', 's']);
    expect(new Set(LESSON_PATH).size).toBe(LESSON_PATH.length);
    expect(lessonForToday({}, DAY)).toBe(LESSON_PATH[0]);
    const learned = { [addDays(DAY, -1)]: LESSON_PATH[0] };
    expect(lessonForToday(learned, DAY)).toBe(LESSON_PATH[1]);
    expect(lessonForTomorrow(learned, DAY)).toBe(LESSON_PATH[2]);
    expect(describeItem(LESSON_PATH[2])?.href).toMatch(/^\/learn-1-min\/surahs\/\d+$/);
    expect(wordOfTheDay(DAY)).toBe(wordOfTheDay(DAY));
    expect(wordOfTheDay(DAY)).not.toBe(wordOfTheDay(addDays(DAY, 1)));
  });

  it('completing a lesson records the day, activity and a revision card', () => {
    let d = apply(emptyData(), { type: 'completeLesson', itemId: LESSON_PATH[0], day: DAY });
    d = apply(d, { type: 'completeLesson', itemId: LESSON_PATH[1], day: DAY }); // second time same day: ignored
    expect(d.learned).toEqual({ [DAY]: LESSON_PATH[0] });
    expect(d.activity[DAY]).toBe(1);
    expect(d.cards[LESSON_PATH[0]].due).toBe(addDays(DAY, 1));
  });

  it('saves, notes, ayat and quiz results', () => {
    let d = emptyData();
    d = apply(d, { type: 'toggleSave', itemId: 'd:daily-1', at: 't' });
    d = apply(d, { type: 'setNote', itemId: 'd:daily-1', text: '  before meals ', at: 't' });
    d = apply(d, { type: 'toggleAyah', surah: 112, ayah: 2, day: DAY });
    d = apply(d, { type: 'toggleAyah', surah: 112, ayah: 1, day: DAY });
    d = apply(d, { type: 'quiz', result: { at: 't', day: DAY, mode: 'daily', score: 4, total: 5 }, daily: true });
    d = apply(d, { type: 'quiz', result: { at: 't', day: DAY, mode: 'daily', score: 5, total: 5 }, daily: true });
    expect(d.saved['d:daily-1']).toBe('t');
    expect(d.notes['d:daily-1'].text).toBe('before meals');
    expect(d.ayat['112']).toEqual([1, 2]);
    expect(d.quiz.daily[DAY]).toEqual({ score: 4, total: 5 }); // first attempt counts
    expect(d.quiz.history).toHaveLength(2);
    d = apply(d, { type: 'toggleSave', itemId: 'd:daily-1', at: 't' });
    d = apply(d, { type: 'setNote', itemId: 'd:daily-1', text: '', at: 't' });
    expect(d.saved).toEqual({});
    expect(d.notes).toEqual({});
  });

  it('streaks and calendar', () => {
    const days = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-08', '2026-11-09'];
    expect(streaks(days, DAY)).toEqual({ current: 2, best: 3 });
    expect(streaks(days, '2026-11-12').current).toBe(0);
    expect(monthGrid(2026, 10).flat().filter(c => c.inMonth)).toHaveLength(30);
  });
});

describe('storage migration', () => {
  it('round-trips v2 and drops unknown items', () => {
    let d = apply(emptyData(), { type: 'completeLesson', itemId: LESSON_PATH[0], day: DAY });
    d = apply(d, { type: 'toggleSave', itemId: 'v:v3', at: 't' });
    expect(migrate(JSON.parse(JSON.stringify(d)))).toEqual(d);
    const dirty = { ...d, saved: { ...d.saved, 'v:nope': 't' }, cards: { ...d.cards, 'x:1': d.cards[LESSON_PATH[0]] } };
    expect(migrate(dirty).saved).toEqual(d.saved);
    expect(migrate(dirty).cards).toEqual(d.cards);
  });

  it('upgrades the first release (v1) keeping learned days and saved duas', () => {
    const v1 = {
      version: 1, createdAt: '2026-11-01T00:00:00.000Z', reviews: 2,
      learned: { '2026-11-08': 'word-rabb', '2026-11-09': 'dua-daily-1', '2026-11-10': 'surah-112' },
      saved: ['dua-daily-1', 'word-rabb'],
    };
    const d = migrate(v1);
    expect(Object.keys(d.learned)).toHaveLength(3);
    expect(d.learned['2026-11-09']).toBe('d:daily-1');
    expect(d.learned['2026-11-10']).toBe('s:112');
    expect(Object.keys(d.saved)).toEqual(['d:daily-1']);
    expect(streaks(Object.keys(d.activity), DAY).current).toBe(3);
  });

  it('rejects foreign data', () => {
    expect(() => migrate({ version: 9 })).toThrow();
    expect(() => migrate('x')).toThrow();
  });
});
