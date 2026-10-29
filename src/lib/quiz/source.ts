/**
 * Server-side loader for quiz content from the Quran.com API v4.
 * Used by /api/quiz/* and by scripts/build-quiz-demo.ts (the offline demo snapshot).
 */
import {
  ContentError, langInfo, toChapter, toSurah,
  type ApiChapter, type ApiVerse, type Chapter, type Content, type Lang, type Surah,
} from './content';

const API = 'https://api.quran.com/api/v4';
/** Quran text doesn't change; a week of caching keeps us light on the upstream API */
const REVALIDATE = 7 * 24 * 60 * 60;

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: REVALIDATE }, signal: AbortSignal.timeout(15000) } as RequestInit);
  if (!res.ok) throw new ContentError(`Quran.com responded ${res.status}`);
  return res.json() as Promise<T>;
}

export async function loadApiChapters(): Promise<ApiChapter[]> {
  const { chapters } = await get<{ chapters: ApiChapter[] }>(`${API}/chapters?language=en`);
  if (chapters?.length !== 114) throw new ContentError('Incomplete chapter list');
  return chapters;
}

export async function loadChapters(): Promise<Chapter[]> {
  return (await loadApiChapters()).map(toChapter);
}

async function loadSurah(chapter: ApiChapter, lang: Lang): Promise<Surah> {
  const { translationId } = langInfo(lang);
  const verses: ApiVerse[] = [];
  for (let page = 1; page <= 10; page++) {
    const data = await get<{ verses: ApiVerse[]; pagination: { next_page: number | null } }>(
      `${API}/verses/by_chapter/${chapter.id}?language=${lang}&words=true&translations=${translationId}` +
      `&fields=text_qpc_hafs,juz_number&word_fields=text_qpc_hafs,char_type_name&per_page=300&page=${page}`,
    );
    verses.push(...data.verses);
    if (!data.pagination?.next_page) break;
  }
  return toSurah(chapter, verses, lang);
}

export async function loadContent(surahIds: number[], lang: Lang): Promise<Content> {
  const apiChapters = await loadApiChapters();
  const surahs = await Promise.all(surahIds.map(id => loadSurah(apiChapters[id - 1], lang)));
  return {
    lang,
    translationSource: langInfo(lang).translation,
    chapters: apiChapters.map(toChapter),
    surahs,
  };
}
