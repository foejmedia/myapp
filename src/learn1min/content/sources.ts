/**
 * Server-only: gathers the site's existing duas and surah introductions and builds
 * the lesson path. Imported by the page (a server component) so the large source
 * files never reach the browser; only the compact lessons do.
 */
import surahIntroductions from '@/data/surahIntroductions';
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
import { duaLessons, interleave, surahLessons, wordLessons, type DuaInput, type Lesson, type SurahInput } from '../lib/lessons';
import { WORDS } from './words';

// Everyday duas first, then the rest.
const DUA_FILES: { duas: DuaInput[] }[] = [
  daily, morningEvening, salah, protection, forgiveness, rabbana, family, success, health, anxiety, travel, quran, ramadan,
];

export function buildAllLessons(): Lesson[] {
  const duas = DUA_FILES.flatMap(f => f.duas);
  const surahs: SurahInput[] = Object.values(surahIntroductions).map(s => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    revelationType: s.revelationType,
    numberOfAyahs: s.numberOfAyahs,
    overview: s.overview,
  }));
  return interleave(wordLessons(WORDS), duaLessons(duas), surahLessons(surahs));
}
