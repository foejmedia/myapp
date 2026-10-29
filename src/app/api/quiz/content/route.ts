import { NextResponse } from 'next/server';
import { ContentError, LANGS, type Lang } from '@/lib/quiz/content';
import { loadContent } from '@/lib/quiz/source';

export const dynamic = 'force-dynamic';

const MAX_SURAHS = 8;

/** GET /api/quiz/content?surahs=1,112,113&lang=en — verified quiz content for those surahs */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lang = (sp.get('lang') ?? 'en') as Lang;
  const ids = [...new Set((sp.get('surahs') ?? '').split(',').map(Number))];

  if (!LANGS.some(l => l.id === lang)) return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
  if (!ids.length || ids.length > MAX_SURAHS || ids.some(n => !Number.isInteger(n) || n < 1 || n > 114)) {
    return NextResponse.json({ error: `Give 1–${MAX_SURAHS} surah numbers between 1 and 114` }, { status: 400 });
  }

  try {
    const content = await loadContent(ids, lang);
    return NextResponse.json(content, { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800' } });
  } catch (e) {
    // never serve partial or unchecked Quran text
    const msg = e instanceof ContentError ? e.message : 'Quran content service unreachable';
    console.error('[quiz] content load failed:', msg);
    return NextResponse.json({ error: 'Quran content is unavailable right now.' }, { status: 502 });
  }
}
