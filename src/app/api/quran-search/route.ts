import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
  }

  const encoded = encodeURIComponent(q);
  const url = `https://api.alquran.cloud/v1/search/${encoded}/all/en.sahih`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    // alquran.cloud answers 404 when nothing matches: that's an empty result, not a failure
    if (res.status === 404) {
      return NextResponse.json({ code: 200, status: 'OK', data: { count: 0, matches: [] } });
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream API error' }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
  }
}
