/**
 * Quran Quiz — verified content model.
 *
 * Every question is built from this data and nothing else: Arabic text, word meanings,
 * translations and surah metadata all come from the Quran.com API v4 (the same source the
 * Read Quran pages use). Answer keys are the data itself — the real next ayah, the real
 * missing word — and wrong options are other real ayahs, words, translations or surahs.
 */

export type Lang = 'en' | 'ur' | 'hi';
export type Level = 'beginner' | 'intermediate' | 'advanced';

export const LANGS: { id: Lang; label: string; translationId: number; translation: string }[] = [
  { id: 'en', label: 'English', translationId: 20, translation: 'Saheeh International' },
  { id: 'ur', label: 'اردو', translationId: 234, translation: 'Fatah Muhammad Jalandhari' },
  { id: 'hi', label: 'हिन्दी', translationId: 122, translation: 'Maulana Azizul Haque al-Umari' },
];
export const langInfo = (l: Lang) => LANGS.find(x => x.id === l)!;

export const SOURCES = {
  text: 'Quran.com API v4 — Uthmani Hafs text (King Fahd Complex)',
  words: 'Quran.com word-by-word meanings',
  audio: 'Recitation: Mishary Rashid Alafasy (Quran.com audio CDN)',
};

/**
 * Surahs per level. Beginner: short, familiar surahs of Juz ʿAmma. Intermediate: the rest of
 * Juz ʿAmma plus Al-Mulk. Advanced: longer surahs commonly memorised and recited.
 */
export const LEVEL_SURAHS: Record<Level, number[]> = {
  beginner: [1, 93, 94, 95, 97, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114],
  intermediate: [67, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 96, 98],
  advanced: [18, 19, 32, 36, 50, 55, 56, 57, 59, 62, 64, 71, 72, 73, 74, 75, 76, 77],
};

export interface Chapter {
  id: number;
  nameSimple: string;
  nameArabic: string;
  /** English meaning of the name, as given by Quran.com */
  meaning: string;
  versesCount: number;
}

export interface Word {
  ar: string;
  /** word-by-word meaning in the content language; null when the source has none */
  meaning: string | null;
}

export interface Verse {
  key: string;
  surah: number;
  ayah: number;
  /** full ayah in Uthmani Hafs script, including the ayah-number glyph */
  ar: string;
  /** the ayah's words only (no ayah-number glyph) */
  words: Word[];
  translation: string;
  juz: number;
}

export interface Surah extends Chapter {
  verses: Verse[];
}

export interface Content {
  lang: Lang;
  translationSource: string;
  /** all 114 chapters' metadata (for knowledge questions and surah-name options) */
  chapters: Chapter[];
  /** the surahs loaded in full for this session */
  surahs: Surah[];
  /** true for the bundled offline snapshot */
  demo?: boolean;
}

// ---------- normalising Quran.com responses (server route + demo snapshot script) ----------

export interface ApiChapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  translated_name: { name: string };
}

export interface ApiVerse {
  verse_key: string;
  verse_number: number;
  text_qpc_hafs: string;
  juz_number: number;
  words: { char_type_name: string; text_qpc_hafs: string; translation?: { text?: string; language_name?: string } }[];
  translations?: { text: string; resource_id: number }[];
}

const LANG_NAME: Record<Lang, string> = { en: 'english', ur: 'urdu', hi: 'hindi' };

export const toChapter = (c: ApiChapter): Chapter => ({
  id: c.id, nameSimple: c.name_simple, nameArabic: c.name_arabic, meaning: c.translated_name.name, versesCount: c.verses_count,
});

/** Translation HTML carries footnote markers (<sup foot_note=…>1</sup>); keep only the text */
export function cleanTranslation(html: string) {
  return html
    .replace(/<sup[^>]*>.*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export class ContentError extends Error {}

/** Converts and checks one surah. Throws if anything is missing or out of sequence. */
export function toSurah(chapter: ApiChapter, verses: ApiVerse[], lang: Lang): Surah {
  const translationId = langInfo(lang).translationId;
  if (verses.length !== chapter.verses_count) {
    throw new ContentError(`Surah ${chapter.id}: expected ${chapter.verses_count} ayahs, got ${verses.length}`);
  }
  const out: Verse[] = verses.map((v, i) => {
    const ayah = i + 1;
    if (v.verse_number !== ayah || v.verse_key !== `${chapter.id}:${ayah}`) {
      throw new ContentError(`Surah ${chapter.id}: ayah ${ayah} out of sequence (${v.verse_key})`);
    }
    const words = v.words
      .filter(w => w.char_type_name === 'word')
      .map(w => ({
        ar: w.text_qpc_hafs,
        // the source falls back to English when a meaning is missing; don't present that as Urdu/Hindi
        meaning: w.translation?.text && w.translation.language_name === LANG_NAME[lang] ? w.translation.text.trim() : null,
      }));
    const tr = v.translations?.find(t => t.resource_id === translationId);
    if (!v.text_qpc_hafs || !words.length || !tr?.text) {
      throw new ContentError(`Ayah ${v.verse_key}: missing text, words or translation`);
    }
    return {
      key: v.verse_key, surah: chapter.id, ayah, ar: v.text_qpc_hafs.trim(), words,
      translation: cleanTranslation(tr.text), juz: v.juz_number,
    };
  });
  return { ...toChapter(chapter), verses: out };
}

export const audioUrl = (v: Pick<Verse, 'surah' | 'ayah'>) =>
  `https://verses.quran.com/Alafasy/mp3/${String(v.surah).padStart(3, '0')}${String(v.ayah).padStart(3, '0')}.mp3`;

/** Arabic compared without diacritics, Quranic marks or alef variants — so two options never differ only in vowels */
export function bareArabic(s: string) {
  return s
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿـ]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/[٠-٩۰-۹\s]/g, '');
}

export const bareText = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
