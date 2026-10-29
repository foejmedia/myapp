import { NextResponse } from 'next/server';
import { loadChapters } from '@/lib/quiz/source';

export const dynamic = 'force-dynamic';

/** GET /api/quiz/chapters — names and ayah counts of all 114 surahs */
export async function GET() {
  try {
    const chapters = await loadChapters();
    return NextResponse.json({ chapters }, { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800' } });
  } catch {
    return NextResponse.json({ error: 'Surah list is unavailable right now.' }, { status: 502 });
  }
}
