/**
 * Question generators. The correct answer is always the data itself (a word's own meaning, the
 * real word missing from a real ayah, a surah's own name meaning); wrong options are other real
 * words, meanings or names. Options that would look alike (same letters without vowels, same
 * meaning text) are never offered together.
 */
import { CHAPTERS, chapter } from '../content/chapters';
import { DUAS, DUA_BY_ID } from '../content/duas';
import { VOCAB, VOCAB_BY_ID, type VocabWord } from '../content/vocabulary';
import { kindOf, refOf, vocabItem } from './items';
import { rng, shuffle } from './random';

/** Same normalisation as src/lib/quiz/content.ts (bareArabic / bareText). */
export const bareArabic = (s: string) =>
  s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿـ]/g, '')
    .replace(/[آأإٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/[٠-٩۰-۹\s]/g, '');
export const bareText = (s: string) => s.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^\p{L}\p{N}]/gu, '');

export type ChoiceQuestion = {
  kind: 'choice';
  id: string;
  itemId: string;
  prompt: string;
  arabic?: string;          // shown above the prompt
  translit?: string;
  audio?: string | null;
  options: string[];
  answer: number;
  arabicOptions?: boolean;
  explain?: string;
};

export type GapQuestion = {
  kind: 'gap';
  id: string;
  itemId: string;
  prompt: string;
  before: string;
  after: string;
  translation: string;
  ref: string;
  options: string[];
  answer: number;
};

export type MatchQuestion = {
  kind: 'match';
  id: string;
  pairs: { itemId: string; ar: string; en: string }[];
};

export type Question = ChoiceQuestion | GapQuestion | MatchQuestion;

/** Pick `n` distractors whose comparison key differs from the answer's and from each other. */
function distractors<T>(pool: T[], correct: T, key: (x: T) => string, n: number, seed: string): T[] {
  const seen = new Set([key(correct)]);
  const out: T[] = [];
  for (const x of shuffle(pool, seed)) {
    const k = key(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
    if (out.length === n) break;
  }
  return out;
}

function choice(
  base: Omit<ChoiceQuestion, 'options' | 'answer' | 'kind'>, correct: string, wrong: string[], seed: string,
): ChoiceQuestion | null {
  if (wrong.length < 2) return null;
  const options = shuffle([correct, ...wrong], `${seed}:o`);
  return { kind: 'choice', ...base, options, answer: options.indexOf(correct) };
}

/** "What does رَبِّكَ mean?" */
export function meaningQuestion(w: VocabWord, seed: string): ChoiceQuestion | null {
  const wrong = distractors(VOCAB, w, x => bareText(x.meaning), 3, seed).map(x => x.meaning);
  return choice(
    { id: `m:${w.id}:${seed}`, itemId: vocabItem(w.id), prompt: 'What does this word mean?', arabic: w.form, translit: w.translit ?? undefined, audio: w.audio, explain: `${w.form} (${w.translit}) means “${w.meaning}” in ${w.meaningAt.split(':').slice(0, 2).join(':')}.` },
    w.meaning, wrong, seed,
  );
}

/** "Which word means “the earth”?" */
export function formQuestion(w: VocabWord, seed: string): ChoiceQuestion | null {
  const wrong = distractors(VOCAB, w, x => bareArabic(x.form), 3, seed).map(x => x.form);
  return choice(
    { id: `f:${w.id}:${seed}`, itemId: vocabItem(w.id), prompt: `Which word means “${w.meaning}”?`, arabicOptions: true, explain: `“${w.meaning}” is ${w.form} (${w.translit}).` },
    w.form, wrong, seed,
  );
}

/** A real ayah with this word taken out; options are other vocabulary forms that do not occur in that ayah. */
export function gapQuestion(w: VocabWord, seed: string): GapQuestion | null {
  const ex = w.examples[0];
  if (!ex) return null;
  const correct = ex.words[ex.wordIndex];
  const inAyah = new Set(ex.words.map(bareArabic));
  const wrong = distractors(
    VOCAB.filter(x => !inAyah.has(bareArabic(x.form))), { form: correct } as VocabWord, x => bareArabic(x.form), 3, seed,
  ).map(x => x.form);
  if (wrong.length < 2) return null;
  const options = shuffle([correct, ...wrong], `${seed}:o`);
  return {
    kind: 'gap',
    id: `g:${w.id}:${seed}`,
    itemId: vocabItem(w.id),
    prompt: 'Which word completes the ayah?',
    before: ex.words.slice(0, ex.wordIndex).join(' '),
    after: ex.words.slice(ex.wordIndex + 1).join(' '),
    translation: ex.translation,
    ref: ex.key,
    options,
    answer: options.indexOf(correct),
  };
}

export function matchQuestion(words: VocabWord[], seed: string): MatchQuestion | null {
  const picked = distractors(words, { meaning: '\u0000', form: '\u0000' } as VocabWord, x => `${bareText(x.meaning)}|${bareArabic(x.form)}`, 5, seed);
  // also keep Arabic forms distinct
  const seenAr = new Set<string>();
  const pairs = picked.filter(w => !seenAr.has(bareArabic(w.form)) && seenAr.add(bareArabic(w.form)));
  if (pairs.length < 3) return null;
  return { kind: 'match', id: `x:${seed}`, pairs: pairs.map(w => ({ itemId: vocabItem(w.id), ar: w.form, en: w.meaning })) };
}

/** "When is this dua said?" — options are other duas' titles. */
export function duaQuestion(id: string, seed: string): ChoiceQuestion | null {
  const d = DUA_BY_ID[id];
  if (!d) return null;
  const wrong = distractors(DUAS, d, x => bareText(x.title), 3, seed).map(x => x.title);
  return choice({ id: `d:${id}:${seed}`, itemId: `d:${id}`, prompt: 'When is this dua said?', arabic: d.arabic, explain: `${d.title}. ${d.reference}.` }, d.title, wrong, seed);
}

/** "What does the name Al-Ikhlas mean?" — from Quran.com's chapter names. */
export function surahQuestion(n: number, seed: string): ChoiceQuestion | null {
  const c = chapter(n);
  if (!c) return null;
  const wrong = distractors(CHAPTERS, c, x => bareText(x.meaning), 3, seed).map(x => x.meaning);
  return choice(
    { id: `s:${n}:${seed}`, itemId: `s:${n}`, prompt: `What does the name “${c.nameSimple}” mean?`, arabic: c.nameArabic, explain: `Surah ${c.nameSimple} (${c.id}) means “${c.meaning}”.` },
    c.meaning, wrong, seed,
  );
}

/** The question used to check a daily lesson. */
export function lessonQuestion(itemId: string, seed: string): Question | null {
  const ref = refOf(itemId);
  switch (kindOf(itemId)) {
    case 'v': return VOCAB_BY_ID[ref] ? meaningQuestion(VOCAB_BY_ID[ref], seed) : null;
    case 'd': return duaQuestion(ref, seed);
    case 's': return surahQuestion(Number(ref), seed);
    default: return null;
  }
}

export type QuizMode = 'meaning' | 'reverse' | 'gap' | 'match' | 'mixed';

/**
 * A session of up to `n` questions about the words in `pool` (wrong options may come from the whole
 * vocabulary). An empty pool — nothing learned yet — falls back to the 40 most frequent words.
 */
export function buildSession(mode: QuizMode, pool: VocabWord[], n: number, seed: string): Question[] {
  const words = pool.length >= (mode === 'match' ? 3 : 1) ? pool : VOCAB.slice(0, 40);
  if (mode === 'match') {
    const out: Question[] = [];
    for (let i = 0; out.length < Math.max(1, Math.ceil(n / 5)) && i < 10; i++) {
      const q = matchQuestion(words, `${seed}:${i}`);
      if (q) out.push(q);
    }
    return out;
  }
  const r = rng(seed);
  const order = shuffle(words, seed);
  const out: Question[] = [];
  for (let i = 0; i < order.length && out.length < n; i++) {
    const w = order[i];
    const m = mode === 'mixed' ? (['meaning', 'reverse', 'gap'] as const)[Math.floor(r() * 3)] : mode;
    const q = m === 'meaning' ? meaningQuestion(w, `${seed}:${i}`) : m === 'reverse' ? formQuestion(w, `${seed}:${i}`) : gapQuestion(w, `${seed}:${i}`);
    if (q) out.push(q);
  }
  return out;
}

/** Today's challenge: the same five questions all day — 2 meanings, 1 reverse, 1 ayah gap, 1 match. */
export function dailyChallenge(day: string, learnedWords: VocabWord[]): Question[] {
  const words = learnedWords.length >= 8 ? learnedWords : VOCAB.slice(0, 60);
  const seed = `daily:${day}`;
  const order = shuffle(words, seed);
  const qs: (Question | null)[] = [
    meaningQuestion(order[0], `${seed}:0`),
    meaningQuestion(order[1], `${seed}:1`),
    formQuestion(order[2], `${seed}:2`),
    gapQuestion(order[3], `${seed}:3`) ?? meaningQuestion(order[3], `${seed}:3`),
    matchQuestion(order.slice(4), `${seed}:4`),
  ];
  return qs.filter((q): q is Question => !!q);
}

/** Points a question is worth (a match counts each pair). */
export const questionWeight = (q: Question) => (q.kind === 'match' ? q.pairs.length : 1);
