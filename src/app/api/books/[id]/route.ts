import { NextRequest, NextResponse } from 'next/server';
import { isLang } from '@/lib/books/catalog';
import { loadBook } from '@/lib/books/source';

export const dynamic = 'force-dynamic';

/** GET /api/books/:id?lang=en — one book with its full description */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = req.nextUrl.searchParams.get('lang') ?? 'en';
  if (!/^\d{1,10}$/.test(id) || !isLang(lang)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const book = await loadBook(Number(id), lang);
    if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(book, { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch {
    return NextResponse.json({ error: 'The library is unavailable right now.' }, { status: 503 });
  }
}
