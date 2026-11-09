/**
 * Turns the site's own content (duas, surah introductions) and the word list into
 * one-minute lessons: a short "learn" card and one question. Pure; runs at build time.
 */
import type { QuranWord } from '../content/words';
import { shuffle } from './random';

export type Track = 'word' | 'dua' | 'surah';

export type Lesson = {
  id: string;
  track: Track;
  title: string;
  arabic?: string;
  transliteration?: string;
  meaning: string;
  note?: string;           // e.g. the surah overview
  example?: { arabic: string; meaning: string; ref: string };
  ref?: string;
  facts?: { label: string; value: string }[];
  quiz: { prompt: string; options: string[]; answer: number; arabicOptions?: boolean };
};

export type DuaInput = {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
  category: string;
};

export type SurahInput = {
  number: number;
  name: string;
  englishName: string;
  revelationType: string;
  numberOfAyahs: number;
  overview: string;
};

export const TRACK_LABEL: Record<Track, string> = { word: 'Word of the Qur’an', dua: 'Dua', surah: 'Surah' };

/** Correct answer plus up to `n` distinct distractors, in a stable shuffled order. */
function quiz(prompt: string, correct: string, pool: string[], seed: string, n = 3, arabicOptions = false): Lesson['quiz'] {
  const wrong = shuffle([...new Set(pool.filter(p => p && p !== correct))], seed).slice(0, n);
  const options = shuffle([correct, ...wrong], `${seed}:order`);
  return { prompt, options, answer: options.indexOf(correct), ...(arabicOptions ? { arabicOptions } : {}) };
}

/** First one or two sentences, so the card stays a one-minute read. */
export function brief(text: string, max = 260): string {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  let out = '';
  for (const s of sentences) {
    if ((out + s).length > max && out) break;
    out += s;
  }
  return out.trim();
}

export function wordLessons(words: QuranWord[]): Lesson[] {
  return words.map((w, i) => ({
    id: `word-${w.id}`,
    track: 'word' as const,
    title: w.transliteration,
    arabic: w.arabic,
    transliteration: w.transliteration,
    meaning: w.meaning,
    example: w.example,
    ref: w.example?.ref,
    quiz:
      i % 2 === 0
        ? quiz(`What does ${w.transliteration} mean?`, w.meaning, words.map(x => x.meaning), `w${w.id}`)
        : quiz(`Which word means “${w.meaning.toLowerCase()}”?`, w.arabic, words.map(x => x.arabic), `w${w.id}`, 3, true),
  }));
}

export function duaLessons(duas: DuaInput[]): Lesson[] {
  const seen = new Set<string>();
  const unique = duas.filter(d => d.arabic && !seen.has(d.arabic) && seen.add(d.arabic));
  return unique.map((d, i) => ({
    id: `dua-${d.id}`,
    track: 'dua' as const,
    title: d.title,
    arabic: d.arabic,
    transliteration: d.transliteration,
    meaning: d.translation,
    ref: d.reference,
    quiz:
      i % 2 === 0
        ? quiz('When is this dua said?', d.title, unique.map(x => x.title), `d${d.id}`)
        : quiz('What does this dua mean?', d.translation, unique.map(x => x.translation), `d${d.id}`, 2),
  }));
}

/** Al-Fatihah, the last three, then Juz 'Amma, then the rest in order. */
export function surahOrder(numbers: number[]): number[] {
  const set = new Set(numbers);
  const first = [1, 112, 113, 114].filter(n => set.has(n));
  const amma = numbers.filter(n => n >= 78 && !first.includes(n)).sort((a, b) => a - b);
  const rest = numbers.filter(n => n < 78 && !first.includes(n)).sort((a, b) => a - b);
  return [...first, ...amma, ...rest];
}

export function surahLessons(surahs: SurahInput[]): Lesson[] {
  const byNum = new Map(surahs.map(s => [s.number, s]));
  return surahOrder(surahs.map(s => s.number)).map((n, i) => {
    const s = byNum.get(n)!;
    const makki = /mak/i.test(s.revelationType);
    const place = makki ? 'Makkah' : 'Madinah';
    const near = [s.numberOfAyahs + 3, s.numberOfAyahs - 2, s.numberOfAyahs + 7, s.numberOfAyahs * 2].filter(x => x > 2);
    return {
      id: `surah-${n}`,
      track: 'surah' as const,
      title: `Surah ${s.englishName}`,
      arabic: s.name,
      meaning: `Surah ${n} of the Qur’an`,
      note: brief(s.overview),
      facts: [
        { label: 'Surah', value: String(n) },
        { label: 'Ayat', value: String(s.numberOfAyahs) },
        { label: 'Revealed in', value: place },
      ],
      quiz:
        i % 2 === 0
          ? { prompt: `Where was Surah ${s.englishName} revealed?`, options: ['Makkah', 'Madinah'], answer: makki ? 0 : 1 }
          : quiz(`How many ayat does Surah ${s.englishName} have?`, String(s.numberOfAyahs), near.map(String), `s${n}`),
    };
  });
}

/** Interleave the tracks so every day brings something different: word, dua, surah, word… */
export function interleave(...tracks: Lesson[][]): Lesson[] {
  const out: Lesson[] = [];
  const max = Math.max(...tracks.map(t => t.length));
  for (let i = 0; i < max; i++) for (const t of tracks) if (t[i]) out.push(t[i]);
  return out;
}
