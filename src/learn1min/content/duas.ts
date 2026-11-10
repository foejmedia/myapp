/**
 * Daily duas from the site's own collection (public/data/duas). Text and references are used
 * exactly as stored there. Audio:
 *  - Qur'anic duas: the recitation of those ayat (Alafasy).
 *  - Hadith duas: the Hisn al-Muslim recording, linked only when the Arabic text matches
 *    (see scripts/build-dua-audio.mjs → data/dua-audio.json). Others have no recording.
 */
import hisnAudio from '../data/dua-audio.json';
import categoriesFile from '../../../public/data/duas/categories.json';
import anxiety from '../../../public/data/duas/anxiety.json';
import daily from '../../../public/data/duas/daily.json';
import family from '../../../public/data/duas/family.json';
import forgiveness from '../../../public/data/duas/forgiveness.json';
import health from '../../../public/data/duas/health.json';
import morningEvening from '../../../public/data/duas/morning-evening.json';
import protection from '../../../public/data/duas/protection.json';
import quran from '../../../public/data/duas/quran.json';
import rabbana from '../../../public/data/duas/rabbana.json';
import ramadan from '../../../public/data/duas/ramadan.json';
import salah from '../../../public/data/duas/salah.json';
import success from '../../../public/data/duas/success.json';
import travel from '../../../public/data/duas/travel.json';

export type Dua = {
  id: string;
  category: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
  source: string;            // "Quran" | "Hadith"
  /** ayah keys this dua is taken from, when it is a Qur'anic dua */
  ayat: string[];
  /** Hisn al-Muslim recording for a hadith dua; `longer`: the recording is the full dua, which goes on past this text */
  hisn: { url: string; longer: boolean } | null;
};

type RawDua = Omit<Dua, 'ayat' | 'hisn'>;
const HISN = hisnAudio as Record<string, { url: string; hisnId: number; longer?: boolean }>;
type RawCategory = { id: string; title: string; description: string };

// Everyday duas first.
const FILES: { duas: RawDua[] }[] = [
  daily, morningEvening, salah, protection, forgiveness, rabbana, family, success, health, anxiety, travel, quran, ramadan,
];

/** "Surah Ta-Ha 20:25-26" -> ["20:25", "20:26"]; non-Qur'anic references give []. */
export function ayatFromReference(ref: string): string[] {
  const m = ref.match(/(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/);
  if (!m) return [];
  const s = Number(m[1]);
  const a = Number(m[2]);
  const b = m[3] ? Number(m[3]) : a;
  if (s < 1 || s > 114 || b < a || b - a > 10) return [];
  return Array.from({ length: b - a + 1 }, (_, i) => `${s}:${a + i}`);
}

const seen = new Set<string>();
export const DUAS: Dua[] = FILES.flatMap(f => f.duas)
  .filter(d => d.arabic && !seen.has(d.arabic) && seen.add(d.arabic))
  .map(d => {
    const h = d.source === 'Quran' ? undefined : HISN[d.id];
    return {
      ...d,
      ayat: d.source === 'Quran' ? ayatFromReference(d.reference) : [],
      hisn: h ? { url: h.url, longer: !!h.longer } : null,
    };
  });

/** True when the dua has any recording to play or download. */
export const hasDuaAudio = (d: Dua) => d.ayat.length > 0 || !!d.hisn;
/** Same-origin download link: the server joins the recording(s) into one MP3. */
export const duaDownloadHref = (d: Dua) => `/api/dua-audio/${encodeURIComponent(d.id)}`;

export const DUA_BY_ID: Record<string, Dua> = Object.fromEntries(DUAS.map(d => [d.id, d]));

export const DUA_CATEGORIES: { id: string; title: string; description: string; count: number }[] = (
  categoriesFile.categories as RawCategory[]
)
  .map(c => ({ id: c.id, title: c.title, description: c.description, count: DUAS.filter(d => d.category === c.id).length }))
  .filter(c => c.count > 0);
