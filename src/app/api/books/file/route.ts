import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** only IslamHouse's own file servers — this is not a general-purpose proxy */
const ALLOWED = /^https:\/\/([\w-]+\.)*islamhouse\.com\//i;
const TYPES: Record<string, string> = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', epub: 'application/epub+zip', doc: 'application/msword' };

function filename(name: string, url: string) {
  const ext = (url.match(/\.(\w{2,5})(?:$|\?)/)?.[1] ?? 'pdf').toLowerCase();
  const base = name.replace(/[\\/:*?"<>|\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || 'book';
  return { ascii: `${base.replace(/[^\x20-\x7e]/g, '_')}.${ext}`, utf8: `${base}.${ext}`, ext };
}

/**
 * GET /api/books/file?u=<IslamHouse file URL>[&dl=1&name=<title>]
 * Streams a book file from the same origin, passing Range requests through so the reader can
 * open large PDFs a piece at a time; with dl=1 the browser saves it under the book's title.
 */
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') ?? '';
  if (!ALLOWED.test(u)) return NextResponse.json({ error: 'Not allowed' }, { status: 400 });

  const range = req.headers.get('range');
  let upstream: Response;
  try {
    upstream = await fetch(u, { headers: range ? { Range: range } : {}, cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(60000) });
  } catch {
    return NextResponse.json({ error: 'The file could not be reached.' }, { status: 502 });
  }
  if (!ALLOWED.test(upstream.url || u)) return NextResponse.json({ error: 'Not allowed' }, { status: 400 });
  if (!upstream.ok || !upstream.body) return NextResponse.json({ error: 'File unavailable' }, { status: upstream.status === 404 ? 404 : 502 });

  const { ascii, utf8, ext } = filename(req.nextUrl.searchParams.get('name') ?? '', u);
  const headers = new Headers({
    'Content-Type': TYPES[ext] ?? upstream.headers.get('content-type') ?? 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=86400',
    'Content-Disposition': `${req.nextUrl.searchParams.get('dl') ? 'attachment' : 'inline'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(utf8)}`,
  });
  for (const h of ['content-length', 'content-range', 'last-modified', 'etag']) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
