import { describe, expect, it } from 'vitest';
import demo from '../demo-content.json';
import { bareArabic, cleanTranslation, toSurah, ContentError, type Content, type Level } from '../content';
import {
  GENERATORS, MODES, answerText, buildSession, checkAnswer, makePool, reshuffle, rngFrom,
  type ArrangeQuestion, type McqQuestion, type Mode, type Question,
} from '../engine';

const content = demo as unknown as Content;
const pool = makePool(content);
const verse = (key: string) => pool.verses.find(v => v.key === key)!;
const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

/** Many questions per mode/level, to exercise the random paths */
function sample(mode: Mode, level: Level, n = 60): Question[] {
  const rng = rngFrom(`${mode}-${level}`);
  const out: Question[] = [];
  for (let i = 0; i < n; i++) {
    const q = GENERATORS[mode](pool, level, rng);
    if (q) out.push(q);
  }
  return out;
}

describe('question generation', () => {
  it.each(MODES.map(m => m.id))('%s produces questions at every level', mode => {
    for (const level of LEVELS) expect(sample(mode, level).length).toBeGreaterThan(0);
  });

  it('multiple-choice questions have four distinct options and one answer key among them', () => {
    for (const { id } of MODES) {
      for (const q of sample(id, 'intermediate').filter((x): x is McqQuestion => x.kind === 'mcq')) {
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options.map(o => o.id)).size).toBe(4);
        const keys = q.options.map(o => (o.lang === 'ar' ? bareArabic(o.text) : o.text.toLowerCase()));
        expect(new Set(keys).size).toBe(4);
        expect(q.options.filter(o => o.id === q.answerId)).toHaveLength(1);
      }
    }
  });

  it('complete: the answer is exactly the missing word(s) of the real ayah', () => {
    for (const q of sample('complete', 'advanced') as McqQuestion[]) {
      const v = verse(q.ref.surah + ':' + q.ref.ayah);
      const missing = v.words.filter((_, i) => q.stemAr![i] === null).map(w => w.ar).join(' ');
      expect(answerText(q)).toBe(missing);
      // the shown words are the ayah's own words, unchanged
      q.stemAr!.forEach((w, i) => { if (w !== null) expect(w).toBe(v.words[i].ar); });
    }
  });

  it('identify/listen: answer is the ayah’s surah, and no wrong option contains the same wording', () => {
    for (const q of [...sample('identify', 'beginner'), ...sample('listen', 'beginner')] as McqQuestion[]) {
      const v = verse(`${q.ref.surah}:${q.ref.ayah}`);
      expect(answerText(q).startsWith(pool.chapterById.get(v.surah)!.nameSimple)).toBe(true);
      const bare = bareArabic(v.words.map(w => w.ar).join(''));
      for (const o of q.options.filter(o => o.id !== q.answerId)) {
        const s = content.surahs.find(x => o.text.startsWith(x.nameSimple + ' ('))!;
        expect(s).toBeDefined();
        expect(s.verses.some(x => bareArabic(x.words.map(w => w.ar).join('')) === bare)).toBe(false);
      }
    }
  });

  it('listen: plays the matching ayah', () => {
    for (const q of sample('listen', 'beginner')) {
      const s = String(q.ref.surah).padStart(3, '0'), a = String(q.ref.ayah).padStart(3, '0');
      expect(q.audio).toBe(`https://verses.quran.com/Alafasy/mp3/${s}${a}.mp3`);
    }
  });

  it('continue: the answer is the real next ayah', () => {
    for (const q of sample('continue', 'intermediate') as McqQuestion[]) {
      const next = verse(`${q.ref.surah}:${q.ref.ayah}`);
      const prev = verse(`${q.ref.surah}:${q.ref.ayah! - 1}`);
      expect(q.stemAr!.join(' ')).toBe(prev.words.map(w => w.ar).join(' '));
      expect(answerText(q)).toBe(next.words.map(w => w.ar).join(' '));
    }
  });

  it('translation: the answer is the ayah’s own translation, with its source', () => {
    for (const q of sample('translation', 'beginner') as McqQuestion[]) {
      expect(answerText(q)).toBe(verse(`${q.ref.surah}:${q.ref.ayah}`).translation);
      expect(q.sources.join()).toContain('Saheeh International');
    }
  });

  it('vocab: the answer is the source meaning of that word', () => {
    for (const q of sample('vocab', 'advanced') as McqQuestion[]) {
      const v = verse(`${q.ref.surah}:${q.ref.ayah}`);
      const pair = q.stemAr ? { ar: q.stemAr[0]!, meaning: answerText(q) } : { ar: answerText(q), meaning: q.stemText!.text };
      expect(v.words.some(w => w.ar === pair.ar && w.meaning === pair.meaning)).toBe(true);
    }
  });

  it('arrange: segments joined in answer order rebuild the ayah exactly', () => {
    for (const q of sample('arrange', 'advanced') as ArrangeQuestion[]) {
      expect(q.answer.join(' ')).toBe(verse(`${q.ref.surah}:${q.ref.ayah}`).words.map(w => w.ar).join(' '));
      expect(q.segments.map(s => s.text).join('|')).not.toBe(q.answer.join('|'));
    }
  });

  it('knowledge: ayah counts come from the chapter data', () => {
    for (const q of sample('knowledge', 'beginner') as McqQuestion[]) {
      if (q.id.startsWith('knowledge:count:')) {
        expect(answerText(q)).toBe(String(pool.chapterById.get(q.ref.surah)!.versesCount));
      }
    }
  });

  it('sessions have no repeated questions and are reproducible from the seed', () => {
    const opts = { modes: MODES.map(m => m.id), level: 'beginner' as const, count: 20, seed: 'day-1' };
    const a = buildSession(content, opts);
    expect(a.length).toBe(20);
    expect(new Set(a.map(q => q.id)).size).toBe(a.length);
    expect(buildSession(content, opts).map(q => q.id)).toEqual(a.map(q => q.id));
    expect(buildSession(content, { ...opts, seed: 'day-2' }).map(q => q.id)).not.toEqual(a.map(q => q.id));
  });

  it('sessions stop short rather than repeat when content runs out', () => {
    const one: Content = { ...content, surahs: content.surahs.filter(s => s.id === 108) };
    const qs = buildSession(one, { modes: ['arrange'], level: 'beginner', count: 10, seed: 1 });
    expect(qs.length).toBeLessThanOrEqual(3);
    expect(new Set(qs.map(q => q.id)).size).toBe(qs.length);
  });

  it('excluded ids are not asked again', () => {
    const first = buildSession(content, { modes: ['translation'], level: 'beginner', count: 5, seed: 's' });
    const second = buildSession(content, { modes: ['translation'], level: 'beginner', count: 5, seed: 's', exclude: first.map(q => q.id) });
    expect(second.some(q => first.some(f => f.id === q.id))).toBe(false);
  });
});

describe('answer validation', () => {
  const [q] = buildSession(content, { modes: ['translation'], level: 'beginner', count: 1, seed: 'v' }) as McqQuestion[];
  const wrongId = q.options.find(o => o.id !== q.answerId)!.id;

  it('accepts the answer key', () => expect(checkAnswer(q, q.answerId)).toEqual({ valid: true, correct: true }));
  it('marks other options incorrect', () => expect(checkAnswer(q, wrongId)).toEqual({ valid: true, correct: false }));
  it('rejects unknown or malformed responses', () => {
    expect(checkAnswer(q, 'zz')).toEqual({ valid: false, correct: false });
    expect(checkAnswer(q, null)).toEqual({ valid: false, correct: false });
    expect(checkAnswer(q, [q.answerId])).toEqual({ valid: false, correct: false });
  });

  const arrange: ArrangeQuestion = {
    kind: 'arrange', id: 't', mode: 'arrange', level: 'beginner', prompt: '', explanation: '', sources: [],
    ref: { surah: 1, surahName: 'Al-Fatihah', ayah: 1 },
    answer: ['A', 'B', 'A'],
    segments: [{ id: 's0', text: 'A', lang: 'ar' }, { id: 's1', text: 'A', lang: 'ar' }, { id: 's2', text: 'B', lang: 'ar' }],
  };
  it('arrange: right order is correct, with identical segments interchangeable', () => {
    expect(checkAnswer(arrange, ['s0', 's2', 's1']).correct).toBe(true);
    expect(checkAnswer(arrange, ['s1', 's2', 's0']).correct).toBe(true);
    expect(checkAnswer(arrange, ['s0', 's1', 's2'])).toEqual({ valid: true, correct: false });
  });
  it('arrange: incomplete, repeated or foreign ids are invalid', () => {
    expect(checkAnswer(arrange, ['s0', 's2']).valid).toBe(false);
    expect(checkAnswer(arrange, ['s0', 's0', 's2']).valid).toBe(false);
    expect(checkAnswer(arrange, ['s0', 's2', 'x']).valid).toBe(false);
    expect(checkAnswer(arrange, 's0').valid).toBe(false);
  });

  it('reshuffle keeps the same answer key', () => {
    const r = reshuffle(q, rngFrom(9)) as McqQuestion;
    expect(answerText(r)).toBe(answerText(q));
    expect(checkAnswer(r, r.answerId).correct).toBe(true);
  });
});

describe('content checks', () => {
  const chapter = { id: 112, name_simple: 'Al-Ikhlas', name_arabic: 'الإخلاص', verses_count: 1, translated_name: { name: 'The Sincerity' } };
  const apiVerse = (key: string, n: number) => ({
    verse_key: key, verse_number: n, text_qpc_hafs: 'قُلۡ ١', juz_number: 30,
    words: [{ char_type_name: 'word', text_qpc_hafs: 'قُلۡ', translation: { text: 'Say', language_name: 'english' } },
      { char_type_name: 'end', text_qpc_hafs: '١' }],
    translations: [{ text: 'Say<sup foot_note=1>1</sup>', resource_id: 20 }],
  });

  it('keeps words only and strips footnote markup', () => {
    const s = toSurah(chapter, [apiVerse('112:1', 1)], 'en');
    expect(s.verses[0].words).toEqual([{ ar: 'قُلۡ', meaning: 'Say' }]);
    expect(s.verses[0].translation).toBe('Say');
    expect(cleanTranslation('a <i>b</i>&nbsp; c')).toBe('a b c');
  });
  it('rejects missing or out-of-sequence ayahs', () => {
    expect(() => toSurah({ ...chapter, verses_count: 2 }, [apiVerse('112:1', 1)], 'en')).toThrow(ContentError);
    expect(() => toSurah(chapter, [apiVerse('112:2', 2)], 'en')).toThrow(ContentError);
  });
  it('does not present English fallback meanings as Urdu', () => {
    const v = apiVerse('112:1', 1);
    v.translations[0].resource_id = 234;
    expect(toSurah(chapter, [v], 'ur').verses[0].words[0].meaning).toBeNull();
  });
});
