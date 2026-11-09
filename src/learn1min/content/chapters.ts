/** The 114 surahs (names, meanings, ayah counts) — snapshot of the Quran.com API v4 chapter list. */
import data from '../data/chapters.json';

export type ChapterInfo = { id: number; nameSimple: string; nameArabic: string; meaning: string; versesCount: number };

export const CHAPTERS: ChapterInfo[] = data.chapters;
export const chapter = (id: number): ChapterInfo | undefined => CHAPTERS[id - 1];

/** Learning order: Al-Fatihah, the last three, the rest of Juz 'Amma, then from Al-Baqarah on. */
export const SURAH_ORDER: number[] = (() => {
  const first = [1, 112, 113, 114];
  const amma = CHAPTERS.map(c => c.id).filter(n => n >= 78 && !first.includes(n));
  const rest = CHAPTERS.map(c => c.id).filter(n => n > 1 && n < 78);
  return [...first, ...amma, ...rest];
})();

/** Recitation of one ayah (Mishary Rashid Alafasy, Quran.com audio CDN) — same source as the Quiz. */
export const ayahAudio = (key: string) => {
  const [s, a] = key.split(':').map(Number);
  return `https://verses.quran.com/Alafasy/mp3/${String(s).padStart(3, '0')}${String(a).padStart(3, '0')}.mp3`;
};
