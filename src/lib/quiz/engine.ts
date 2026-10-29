/**
 * Quran Quiz — question engine. Pure functions: content + seed in, questions out.
 *
 * Rules every generator follows:
 * - the correct option is taken from the source data, never composed;
 * - wrong options are other real ayahs / words / translations / surahs from the same data;
 * - a question is skipped (null) when it could be ambiguous, e.g. an ayah whose wording
 *   also appears in a surah offered as a wrong option, or two options that differ only in vowels.
 */
import {
  SOURCES, audioUrl, bareArabic, bareText, type Chapter, type Content, type Lang, type Level, type Surah, type Verse,
} from './content';

export type Mode = 'complete' | 'identify' | 'continue' | 'memorise' | 'vocab' | 'translation' | 'listen' | 'arrange' | 'knowledge';
export type SessionKind = Mode | 'mixed' | 'daily' | 'revision';

export const MODES: { id: Mode; title: string; blurb: string; icon: string }[] = [
  { id: 'complete', title: 'Complete the Ayah', blurb: 'Choose the missing word', icon: 'edit_note' },
  { id: 'identify', title: 'Identify the Surah', blurb: 'Which surah is this ayah from?', icon: 'menu_book' },
  { id: 'continue', title: 'Continue the Ayah', blurb: 'Choose the ayah that comes next', icon: 'redo' },
  { id: 'memorise', title: 'Memorisation', blurb: 'Recall how an ayah ends', icon: 'psychology' },
  { id: 'vocab', title: 'Vocabulary', blurb: 'Match words with their meanings', icon: 'translate' },
  { id: 'translation', title: 'Translation', blurb: 'Choose the correct translation', icon: 'subtitles' },
  { id: 'listen', title: 'Listen & Identify', blurb: 'Hear a recitation, name the surah', icon: 'headphones' },
  { id: 'arrange', title: 'Arrange the Ayah', blurb: 'Put the parts in order', icon: 'reorder' },
  { id: 'knowledge', title: 'Quran Knowledge', blurb: 'Surahs, ayah counts and structure', icon: 'auto_stories' },
];
export const modeTitle = (m: Mode) => MODES.find(x => x.id === m)?.title ?? m;
export const sessionTitle = (k: SessionKind) =>
  k === 'mixed' ? 'Mixed practice' : k === 'daily' ? 'Daily Quran Challenge' : k === 'revision' ? 'Revision' : modeTitle(k);

/** Text with a language, so the UI can pick direction and font */
export interface Option { id: string; text: string; lang: Lang | 'ar' }

export interface Ref { surah: number; surahName: string; ayah: number | null }

interface Base {
  /** stable across sessions: used to prevent repeats and to track revision */
  id: string;
  mode: Mode;
  level: Level;
  prompt: string;
  /** Arabic words of the stem; null marks a blank */
  stemAr?: (string | null)[];
  stemText?: Option;
  audio?: string;
  ref: Ref;
  explanation: string;
  /** the full ayah, shown after answering */
  context?: { ar: string; translation: string; key: string };
  sources: string[];
}

export interface McqQuestion extends Base { kind: 'mcq'; options: Option[]; answerId: string }
export interface ArrangeQuestion extends Base { kind: 'arrange'; segments: Option[]; /** correct order, as segment texts */ answer: string[] }
export type Question = McqQuestion | ArrangeQuestion;
export type Response = string | string[];

// ---------- randomness ----------

export type Rng = () => number;

/** mulberry32 — small, fast, seedable */
export function rngFrom(seed: string | number): Rng {
  let h = typeof seed === 'number' ? seed >>> 0 : 2166136261;
  if (typeof seed === 'string') for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  return () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(list: readonly T[], rng: Rng): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const pick = <T,>(list: readonly T[], rng: Rng): T | undefined => list[Math.floor(rng() * list.length)];

/** Up to `n` items whose key differs from `taken` and from each other */
function distinct<T>(candidates: readonly T[], n: number, key: (t: T) => string, taken: string[], rng: Rng): T[] {
  const seen = new Set(taken);
  const out: T[] = [];
  for (const c of shuffle(candidates, rng)) {
    const k = key(c);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(c);
    if (out.length === n) break;
  }
  return out;
}

// ---------- pool ----------

const LEVEL_RULES: Record<Level, { minWords: number; maxWords: number; segments: number; sameSurah: boolean; blanks: number; minLetters: number }> = {
  beginner: { minWords: 3, maxWords: 16, segments: 3, sameSurah: false, blanks: 1, minLetters: 2 },
  intermediate: { minWords: 4, maxWords: 28, segments: 4, sameSurah: true, blanks: 1, minLetters: 3 },
  advanced: { minWords: 5, maxWords: 45, segments: 6, sameSurah: true, blanks: 2, minLetters: 3 },
};

export interface Pool {
  content: Content;
  verses: Verse[];
  surahById: Map<number, Surah>;
  chapterById: Map<number, Chapter>;
  /** bare ayah text → surahs it appears in (within the loaded surahs) */
  textSurahs: Map<string, Set<number>>;
}

export function makePool(content: Content): Pool {
  const verses = content.surahs.flatMap(s => s.verses);
  const textSurahs = new Map<string, Set<number>>();
  for (const v of verses) {
    const k = bareArabic(v.words.map(w => w.ar).join(''));
    if (!textSurahs.has(k)) textSurahs.set(k, new Set());
    textSurahs.get(k)!.add(v.surah);
  }
  return {
    content,
    verses,
    surahById: new Map(content.surahs.map(s => [s.id, s])),
    chapterById: new Map(content.chapters.map(c => [c.id, c])),
    textSurahs,
  };
}

const bareVerse = (v: Verse) => bareArabic(v.words.map(w => w.ar).join(''));
const joinWords = (v: Verse, from = 0, to = v.words.length) => v.words.slice(from, to).map(w => w.ar).join(' ');

function surahName(pool: Pool, id: number) {
  const c = pool.chapterById.get(id);
  return c ? c.nameSimple : `Surah ${id}`;
}
const refOf = (pool: Pool, v: Verse): Ref => ({ surah: v.surah, surahName: surahName(pool, v.surah), ayah: v.ayah });
const contextOf = (v: Verse) => ({ ar: v.ar, translation: v.translation, key: v.key });
const label = (pool: Pool, v: Verse) => `Surah ${surahName(pool, v.surah)} ${v.key}`;

function sizedVerses(pool: Pool, level: Level) {
  const r = LEVEL_RULES[level];
  return pool.verses.filter(v => v.words.length >= r.minWords && v.words.length <= r.maxWords);
}

/** Final shuffle; ids are position-free so the answer can't be guessed from them */
function mcq(base: Omit<McqQuestion, 'kind' | 'options' | 'answerId'>, correct: Omit<Option, 'id'>, wrong: Omit<Option, 'id'>[], rng: Rng): McqQuestion {
  const tagged = [{ ...correct, ok: true }, ...wrong.map(w => ({ ...w, ok: false }))];
  const ids = shuffle(['a', 'b', 'c', 'd', 'e', 'f'].slice(0, tagged.length), rng);
  const options = shuffle(tagged.map((o, i) => ({ id: ids[i], text: o.text, lang: o.lang, ok: o.ok })), rng);
  return {
    ...base,
    kind: 'mcq',
    options: options.map(({ id, text, lang }) => ({ id, text, lang })),
    answerId: options.find(o => o.ok)!.id,
  };
}

// ---------- generators ----------

type Gen = (pool: Pool, level: Level, rng: Rng) => Question | null;

const complete: Gen = (pool, level, rng) => {
  const r = LEVEL_RULES[level];
  const v = pick(sizedVerses(pool, level), rng);
  if (!v) return null;
  const blanks = Math.min(r.blanks, v.words.length - 2);
  // beginners get the last word, which is easiest to recall; others any position
  const start = level === 'beginner' ? v.words.length - blanks : Math.floor(rng() * (v.words.length - blanks + 1));
  const answer = joinWords(v, start, start + blanks);
  const answerBare = bareArabic(answer);
  if (answerBare.length < r.minLetters) return null;

  // wrong options: equally long runs of words from other ayahs
  const pieces = pool.verses
    .filter(o => o.key !== v.key && o.words.length >= blanks)
    .map(o => { const s = Math.floor(rng() * (o.words.length - blanks + 1)); return joinWords(o, s, s + blanks); })
    .filter(t => bareArabic(t).length >= r.minLetters);
  const wrong = distinct(pieces, 3, bareArabic, [answerBare], rng);
  if (wrong.length < 3) return null;

  return mcq({
    id: `complete:${v.key}`, mode: 'complete', level,
    prompt: blanks > 1 ? 'Choose the missing words' : 'Choose the missing word',
    stemAr: v.words.map((w, i) => (i >= start && i < start + blanks ? null : w.ar)),
    ref: refOf(pool, v), context: contextOf(v), sources: [SOURCES.text],
    explanation: `The complete ayah is ${label(pool, v)}.`,
  }, { text: answer, lang: 'ar' }, wrong.map(text => ({ text, lang: 'ar' as const })), rng);
};

/** An ayah usable for "which surah": its wording must appear in one loaded surah only */
function uniqueVerse(pool: Pool, level: Level, rng: Rng) {
  const candidates = sizedVerses(pool, level).filter(v => pool.textSurahs.get(bareVerse(v))!.size === 1);
  return pick(candidates, rng);
}

function surahOptions(pool: Pool, v: Verse, rng: Rng) {
  // only surahs loaded in full, so we can be sure the ayah isn't also in them
  const others = pool.content.surahs.filter(s => s.id !== v.surah && !s.verses.some(o => bareVerse(o) === bareVerse(v)));
  return distinct(others, 3, s => String(s.id), [], rng);
}

const surahText = (pool: Pool, id: number) => {
  const c = pool.chapterById.get(id);
  return c ? `${c.nameSimple} (${c.meaning})` : `Surah ${id}`;
};

const identify: Gen = (pool, level, rng) => {
  const v = uniqueVerse(pool, level, rng);
  if (!v) return null;
  const wrong = surahOptions(pool, v, rng);
  if (wrong.length < 3) return null;
  return mcq({
    id: `identify:${v.key}`, mode: 'identify', level,
    prompt: 'Which surah is this ayah from?',
    stemAr: v.words.map(w => w.ar),
    // beginners get the translation as a hint
    stemText: level === 'beginner' ? { id: 't', text: v.translation, lang: pool.content.lang } : undefined,
    ref: refOf(pool, v), context: contextOf(v), sources: [SOURCES.text],
    explanation: `This is ayah ${v.ayah} of Surah ${surahName(pool, v.surah)} (surah ${v.surah}).`,
  }, { text: surahText(pool, v.surah), lang: 'en' }, wrong.map(s => ({ text: surahText(pool, s.id), lang: 'en' as const })), rng);
};

const listen: Gen = (pool, level, rng) => {
  const v = uniqueVerse(pool, level, rng);
  if (!v) return null;
  const wrong = surahOptions(pool, v, rng);
  if (wrong.length < 3) return null;
  return mcq({
    id: `listen:${v.key}`, mode: 'listen', level,
    prompt: 'Listen to the recitation. Which surah is it from?',
    audio: audioUrl(v),
    ref: refOf(pool, v), context: contextOf(v), sources: [SOURCES.audio, SOURCES.text],
    explanation: `You heard ayah ${v.ayah} of Surah ${surahName(pool, v.surah)} (surah ${v.surah}).`,
  }, { text: surahText(pool, v.surah), lang: 'en' }, wrong.map(s => ({ text: surahText(pool, s.id), lang: 'en' as const })), rng);
};

const cont: Gen = (pool, level, rng) => {
  const r = LEVEL_RULES[level];
  const candidates = pool.content.surahs.flatMap(s => s.verses.slice(0, -1).map((v, i) => ({ s, v, next: s.verses[i + 1] })))
    .filter(({ next }) => next.words.length <= r.maxWords + 8);
  const c = pick(candidates, rng);
  if (!c) return null;
  const { s, v, next } = c;
  // a refrain repeated in the surah has more than one possible "next" — skip it
  const repeats = s.verses.filter(o => bareVerse(o) === bareVerse(v));
  if (repeats.some(o => o.ayah < s.verses.length && bareVerse(s.verses[o.ayah]) !== bareVerse(next))) return null;

  const from = r.sameSurah && s.verses.length >= 6 ? s.verses : pool.verses;
  const wrongVerses = distinct(from.filter(o => o.key !== next.key && o.key !== v.key && o.words.length <= r.maxWords + 8), 3, bareVerse, [bareVerse(next)], rng);
  if (wrongVerses.length < 3) return null;
  return mcq({
    id: `continue:${v.key}`, mode: 'continue', level,
    prompt: 'Which ayah comes next?',
    stemAr: v.words.map(w => w.ar),
    ref: refOf(pool, next), context: contextOf(next), sources: [SOURCES.text],
    explanation: `Ayah ${next.ayah} follows ayah ${v.ayah} in Surah ${surahName(pool, s.id)}.`,
  }, { text: joinWords(next), lang: 'ar' }, wrongVerses.map(o => ({ text: joinWords(o), lang: 'ar' as const })), rng);
};

const memorise: Gen = (pool, level, rng) => {
  const r = LEVEL_RULES[level];
  const v = pick(sizedVerses(pool, level).filter(x => x.words.length >= Math.max(4, r.minWords)), rng);
  if (!v) return null;
  const cut = Math.ceil(v.words.length / 2);
  const ending = joinWords(v, cut);
  const from = r.sameSurah ? pool.surahById.get(v.surah)!.verses : pool.verses;
  const endings = from.filter(o => o.key !== v.key && o.words.length >= 4).map(o => joinWords(o, Math.ceil(o.words.length / 2)));
  const wrong = distinct(endings, 3, bareArabic, [bareArabic(ending)], rng);
  if (wrong.length < 3) return null;
  return mcq({
    id: `memorise:${v.key}`, mode: 'memorise', level,
    prompt: 'Recall the rest of this ayah',
    stemAr: [...v.words.slice(0, cut).map(w => w.ar), null],
    ref: refOf(pool, v), context: contextOf(v), sources: [SOURCES.text],
    explanation: `This is how ayah ${v.ayah} of Surah ${surahName(pool, v.surah)} ends.`,
  }, { text: ending, lang: 'ar' }, wrong.map(text => ({ text, lang: 'ar' as const })), rng);
};

const meaningKey = (m: string) => bareText(m.replace(/\([^)]*\)/g, ''));

const vocab: Gen = (pool, level, rng) => {
  const r = LEVEL_RULES[level];
  const lang = pool.content.lang;
  const words = pool.verses.flatMap(v => v.words.map(w => ({ v, w })))
    .filter(({ w }) => w.meaning && meaningKey(w.meaning).length >= 2 && bareArabic(w.ar).length >= r.minLetters);
  const target = pick(words, rng);
  if (!target) return null;
  const { v, w } = target;
  const meaning = w.meaning!;
  // advanced sometimes asks the other way: meaning → Arabic word
  const reverse = level === 'advanced' && rng() < 0.5;
  const wrong = distinct(
    words.filter(x => bareArabic(x.w.ar) !== bareArabic(w.ar)),
    3,
    x => (reverse ? bareArabic(x.w.ar) : meaningKey(x.w.meaning!)),
    [reverse ? bareArabic(w.ar) : meaningKey(meaning)],
    rng,
  );
  if (wrong.length < 3) return null;
  // two words sharing a meaning would make a "wrong" option right
  if (reverse && wrong.some(x => meaningKey(x.w.meaning!) === meaningKey(meaning))) return null;

  const base = {
    id: `vocab:${v.key}:${bareArabic(w.ar)}`, mode: 'vocab' as const, level,
    ref: refOf(pool, v), context: contextOf(v), sources: [SOURCES.words, SOURCES.text],
    explanation: `In ${label(pool, v)}, “${w.ar}” is translated “${meaning}”. Word meanings depend on context.`,
  };
  return reverse
    ? mcq({ ...base, prompt: 'Which Arabic word has this meaning?', stemText: { id: 'm', text: meaning, lang } },
      { text: w.ar, lang: 'ar' }, wrong.map(x => ({ text: x.w.ar, lang: 'ar' as const })), rng)
    : mcq({ ...base, prompt: 'What does this word mean?', stemAr: [w.ar] },
      { text: meaning, lang }, wrong.map(x => ({ text: x.w.meaning!, lang })), rng);
};

const translation: Gen = (pool, level, rng) => {
  const r = LEVEL_RULES[level];
  const v = pick(sizedVerses(pool, level), rng);
  if (!v) return null;
  const from = r.sameSurah && pool.surahById.get(v.surah)!.verses.length >= 6 ? pool.surahById.get(v.surah)!.verses : pool.verses;
  const wrong = distinct(from.filter(o => o.key !== v.key), 3, o => bareText(o.translation), [bareText(v.translation)], rng);
  if (wrong.length < 3) return null;
  return mcq({
    id: `translation:${v.key}`, mode: 'translation', level,
    prompt: 'Choose the correct translation',
    stemAr: v.words.map(w => w.ar),
    ref: refOf(pool, v), context: contextOf(v), sources: [SOURCES.text, `Translation: ${pool.content.translationSource}`],
    explanation: `${pool.content.translationSource}'s translation of ${label(pool, v)}.`,
  }, { text: v.translation, lang: pool.content.lang }, wrong.map(o => ({ text: o.translation, lang: pool.content.lang })), rng);
};

const arrange: Gen = (pool, level, rng) => {
  const n = LEVEL_RULES[level].segments;
  const v = pick(sizedVerses(pool, level).filter(x => x.words.length >= n), rng);
  if (!v) return null;
  const answer: string[] = [];
  for (let i = 0; i < n; i++) {
    answer.push(joinWords(v, Math.round((i * v.words.length) / n), Math.round(((i + 1) * v.words.length) / n)));
  }
  if (new Set(answer).size === 1) return null;
  let order = shuffle(answer.map((_, i) => i), rng);
  for (let tries = 0; order.every((x, i) => x === i) && tries < 5; tries++) order = shuffle(order, rng);
  if (order.map(i => answer[i]).join('|') === answer.join('|')) return null;
  return {
    kind: 'arrange',
    id: `arrange:${v.key}`, mode: 'arrange', level,
    prompt: 'Tap the parts in the correct order',
    segments: order.map((i, pos) => ({ id: `s${pos}`, text: answer[i], lang: 'ar' as const })),
    answer,
    ref: refOf(pool, v), context: contextOf(v), sources: [SOURCES.text],
    explanation: `This is the order of ${label(pool, v)}.`,
  };
};

type KnowledgeKind = 'count' | 'meaning' | 'number' | 'juz' | 'ayahNumber';
const KNOWLEDGE: Record<Level, KnowledgeKind[]> = {
  beginner: ['count', 'meaning', 'ayahNumber'],
  intermediate: ['count', 'meaning', 'number', 'ayahNumber'],
  advanced: ['count', 'number', 'juz', 'ayahNumber', 'meaning'],
};

const knowledge: Gen = (pool, level, rng) => {
  const kind = pick(KNOWLEDGE[level], rng)!;
  const s = pick(pool.content.surahs, rng);
  if (!s) return null;
  const chapters = pool.content.chapters;
  const ref: Ref = { surah: s.id, surahName: s.nameSimple, ayah: null };
  const base = { id: `knowledge:${kind}:${s.id}`, mode: 'knowledge' as const, level, ref, sources: [SOURCES.text] };
  const opt = (text: string | number) => ({ text: String(text), lang: 'en' as const });

  if (kind === 'count') {
    const wrong = distinct(chapters.filter(c => c.id !== s.id), 3, c => String(c.versesCount), [String(s.versesCount)], rng);
    if (wrong.length < 3) return null;
    return mcq({ ...base, prompt: `How many ayahs are in Surah ${s.nameSimple}?`, explanation: `Surah ${s.nameSimple} (surah ${s.id}) has ${s.versesCount} ayahs.` },
      opt(s.versesCount), wrong.map(c => opt(c.versesCount)), rng);
  }
  if (kind === 'meaning') {
    const wrong = distinct(chapters.filter(c => c.id !== s.id), 3, c => bareText(c.meaning), [bareText(s.meaning)], rng);
    if (wrong.length < 3) return null;
    return mcq({ ...base, prompt: `Which surah's name means “${s.meaning}”?`, explanation: `${s.nameSimple} (${s.nameArabic}) is translated “${s.meaning}”.` },
      opt(s.nameSimple), wrong.map(c => opt(c.nameSimple)), rng);
  }
  if (kind === 'number') {
    const wrong = distinct(chapters.filter(c => c.id !== s.id && Math.abs(c.id - s.id) <= 12), 3, c => String(c.id), [String(s.id)], rng);
    if (wrong.length < 3) return null;
    return mcq({ ...base, prompt: `What is the position of Surah ${s.nameSimple} in the Quran?`, explanation: `Surah ${s.nameSimple} is surah number ${s.id} of 114.` },
      opt(s.id), wrong.map(c => opt(c.id)), rng);
  }
  if (kind === 'juz') {
    const juz = s.verses[0].juz;
    const nums = Array.from({ length: 30 }, (_, i) => i + 1).filter(j => j !== juz && Math.abs(j - juz) <= 6);
    const wrong = distinct(nums, 3, String, [], rng);
    if (wrong.length < 3) return null;
    return mcq({ ...base, prompt: `In which juz does Surah ${s.nameSimple} begin?`, explanation: `Surah ${s.nameSimple} begins in juz ${juz}.` },
      opt(juz), wrong.map(opt), rng);
  }
  // ayahNumber: which ayah of the surah is this?
  if (s.verses.length < 4) return null;
  const v = pick(s.verses.filter(x => s.verses.filter(o => bareVerse(o) === bareVerse(x)).length === 1 && x.words.length >= 3), rng);
  if (!v) return null;
  const wrong = distinct(s.verses.filter(o => o.ayah !== v.ayah), 3, o => String(o.ayah), [], rng);
  if (wrong.length < 3) return null;
  return mcq({
    ...base, id: `knowledge:ayahNumber:${v.key}`, ref: refOf(pool, v), context: contextOf(v),
    prompt: `Which ayah of Surah ${s.nameSimple} is this?`, stemAr: v.words.map(w => w.ar),
    explanation: `This is ayah ${v.ayah} of Surah ${s.nameSimple}.`,
  }, opt(v.ayah), wrong.map(o => opt(o.ayah)), rng);
};

export const GENERATORS: Record<Mode, Gen> = {
  complete, identify, continue: cont, memorise, vocab, translation, listen, arrange, knowledge,
};

// ---------- sessions ----------

export interface BuildOptions {
  modes: Mode[];
  level: Level;
  count: number;
  seed: string | number;
  /** question ids to leave out (e.g. already asked today) */
  exclude?: Iterable<string>;
}

/** Up to `count` questions, no repeated ids, modes interleaved. Fewer when the content runs out. */
export function buildSession(content: Content, { modes, level, count, seed, exclude = [] }: BuildOptions): Question[] {
  const pool = makePool(content);
  const rng = rngFrom(seed);
  const seen = new Set(exclude);
  const out: Question[] = [];
  const exhausted = new Set<Mode>();
  let turn = 0;
  for (let attempts = 0; out.length < count && attempts < count * 40 && exhausted.size < modes.length; attempts++) {
    const mode = modes[turn % modes.length];
    turn++;
    if (exhausted.has(mode)) continue;
    let q: Question | null = null;
    for (let i = 0; i < 25 && !q; i++) {
      const c = GENERATORS[mode](pool, level, rng);
      if (c && !seen.has(c.id)) q = c;
    }
    if (!q) { exhausted.add(mode); continue; }
    seen.add(q.id);
    out.push(q);
  }
  return out;
}

/** Same question, options in a new order — for retries and revision */
export function reshuffle(q: Question, rng: Rng): Question {
  if (q.kind === 'mcq') return { ...q, options: shuffle(q.options, rng) };
  let segments = shuffle(q.segments, rng);
  for (let i = 0; i < 5 && segments.map(s => s.text).join('|') === q.answer.join('|'); i++) segments = shuffle(segments, rng);
  return { ...q, segments };
}

// ---------- answers ----------

export interface Verdict { valid: boolean; correct: boolean }

/** Checks a response against the answer key. Malformed responses are invalid, never correct. */
export function checkAnswer(q: Question, response: Response | null | undefined): Verdict {
  if (q.kind === 'mcq') {
    if (typeof response !== 'string' || !q.options.some(o => o.id === response)) return { valid: false, correct: false };
    return { valid: true, correct: response === q.answerId };
  }
  if (!Array.isArray(response) || response.length !== q.segments.length) return { valid: false, correct: false };
  const byId = new Map(q.segments.map(s => [s.id, s.text]));
  if (new Set(response).size !== response.length || response.some(id => !byId.has(id))) return { valid: false, correct: false };
  // compare texts, so identical segments can go in either slot
  return { valid: true, correct: response.map(id => byId.get(id)).join('\u0001') === q.answer.join('\u0001') };
}

/** The correct answer as display text */
export function answerText(q: Question): string {
  return q.kind === 'mcq' ? q.options.find(o => o.id === q.answerId)!.text : q.answer.join(' ');
}

// ---------- level choice ----------

/** Surahs for a session: a focus surah plus others to draw wrong options from */
export function chooseSurahs(level: Level, levelSurahs: Record<Level, number[]>, rng: Rng, focus?: number | null): number[] {
  const list = levelSurahs[level];
  const n = level === 'beginner' ? 6 : 4;
  if (focus) return [focus, ...shuffle(list.filter(id => id !== focus), rng).slice(0, 3)];
  return shuffle(list, rng).slice(0, n);
}
