import { NextResponse } from 'next/server';
import { ayahAudio } from '@/learn1min/content/chapters';
import { DUA_BY_ID } from '@/learn1min/content/duas';

/**
 * GET /api/dua-audio/:id — download a dua's recitation as one MP3.
 * Only the recordings linked to our own duas are served (never an arbitrary URL):
 * Hisn al-Muslim for hadith duas, the ayah recitations (joined in order) for Qur'anic ones.
 */

/** Length of a leading ID3v2 tag, so joined files don't carry tags in the middle */
function id3Length(b: Uint8Array) {
  if (b.length < 10 || b[0] !== 0x49 || b[1] !== 0x44 || b[2] !== 0x33) return 0;
  const size = (b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9];
  return 10 + size + (b[5] & 0x10 ? 10 : 0);
}

const slug = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'dua';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dua = DUA_BY_ID[id];
  const urls = dua?.hisn ? [dua.hisn.url] : dua?.ayat.map(ayahAudio) ?? [];
  if (!dua || urls.length === 0) {
    return NextResponse.json({ error: 'No recording for this dua' }, { status: 404 });
  }

  try {
    const parts = await Promise.all(
      urls.map(async u => {
        const r = await fetch(u, { signal: AbortSignal.timeout(20000), next: { revalidate: 60 * 60 * 24 * 30 } } as RequestInit);
        if (!r.ok) throw new Error(`upstream ${r.status}`);
        return new Uint8Array(await r.arrayBuffer());
      }),
    );
    const trimmed = parts.map((p, i) => (i === 0 ? p : p.subarray(id3Length(p))));
    const body = new Uint8Array(trimmed.reduce((n, p) => n + p.length, 0));
    let at = 0;
    for (const p of trimmed) {
      body.set(p, at);
      at += p.length;
    }
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(body.length),
        'Content-Disposition': `attachment; filename="dua-${slug(dua.title)}.mp3"`,
        'Cache-Control': 'public, max-age=86400, s-maxage=2592000',
      },
    });
  } catch {
    return NextResponse.json({ error: 'The recording could not be fetched right now' }, { status: 502 });
  }
}
