/**
 * Server-side access to IslamHouse's public API (no sign-up; the key below is IslamHouse's
 * public API key — set ISLAMHOUSE_API_KEY to use your own).
 */
import { normalize, normalizeDetail, type Book, type BookDetail, type RawItem } from './catalog';

const KEY = process.env.ISLAMHOUSE_API_KEY || 'paV29H2gm56kvLPy';
const BASE = `https://api3.islamhouse.com/v3/${KEY}/main`;
const PER_PAGE = 50; // the API's maximum
const MAX_PAGES = 30;

interface ListPage { data?: RawItem[]; links?: { pages_number?: number } }

async function json<T>(url: string): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return (await res.json()) as T;
    } catch (e) { last = e; }
  }
  throw last;
}

const page = (lang: string, n: number) => json<ListPage>(`${BASE}/books/${lang}/${lang}/${n}/${PER_PAGE}/json`);

/** every book IslamHouse lists for a language, newest first, de-duplicated */
export async function loadLanguage(lang: string): Promise<Book[]> {
  const first = await page(lang, 1);
  const pages = Math.min(first.links?.pages_number ?? 1, MAX_PAGES);
  const rest: ListPage[] = [];
  // a few pages at a time — kind to the API
  for (let n = 2; n <= pages; n += 6) {
    const batch = await Promise.allSettled(Array.from({ length: Math.min(6, pages - n + 1) }, (_, i) => page(lang, n + i)));
    batch.forEach(r => { if (r.status === 'fulfilled') rest.push(r.value); });
  }
  const seen = new Set<number>();
  return [first, ...rest].flatMap(p => p.data ?? []).flatMap(raw => {
    const b = normalize(raw, lang);
    if (!b || seen.has(b.id)) return [];
    seen.add(b.id);
    // the list only needs a teaser — the book's page loads the full text
    const description = b.description.length > 260 ? `${b.description.slice(0, 260).replace(/\s+\S*$/, '')}…` : b.description;
    return [{ ...b, description }];
  }).sort((a, z) => z.added - a.added);
}

export async function loadBook(id: number, lang: string): Promise<BookDetail | null> {
  return normalizeDetail(await json<RawItem>(`${BASE}/get-item/${id}/${lang}/json`), lang);
}
