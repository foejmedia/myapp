import { NextRequest, NextResponse } from 'next/server';
import { isLang, type BooksResponse } from '@/lib/books/catalog';
import { loadLanguage } from '@/lib/books/source';

export const dynamic = 'force-dynamic';

const TTL_MS = 12 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; data: BooksResponse }>();
const inflight = new Map<string, Promise<BooksResponse>>();

/** GET /api/books?lang=en — the whole catalogue for one language */
export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get('lang') ?? 'en';
  if (!isLang(lang)) return NextResponse.json({ error: 'Unknown language' }, { status: 400 });

  const hit = cache.get(lang);
  if (hit && Date.now() - hit.at < TTL_MS) return respond(hit.data);

  try {
    let job = inflight.get(lang);
    if (!job) {
      job = loadLanguage(lang).then(books => {
        if (!books.length) throw new Error('empty catalogue');
        return { lang, books, fetchedAt: new Date().toISOString() };
      });
      inflight.set(lang, job);
      job.finally(() => inflight.delete(lang)).catch(() => {});
    }
    const data = await job;
    cache.set(lang, { at: Date.now(), data });
    return respond(data);
  } catch {
    // the library is down: serve the last copy we have, however old
    if (hit) return respond({ ...hit.data, stale: true }, 300);
    return NextResponse.json({ error: 'The library is unavailable right now.' }, { status: 503 });
  }
}

function respond(data: BooksResponse, maxAge = 3600) {
  return NextResponse.json(data, { headers: { 'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge * 6}` } });
}
