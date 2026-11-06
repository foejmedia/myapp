import { NextResponse } from 'next/server';
import { type CatalogResponse, type Video } from '@/lib/videos/catalog';
import { loadAll, order } from '@/lib/videos/source';
import snapshot from '@/lib/videos/snapshot.json';

export const dynamic = 'force-dynamic';

const TTL_MS = 3 * 60 * 60 * 1000;
/** when some channels came from the bundled snapshot, retry YouTube sooner */
const PARTIAL_TTL_MS = 10 * 60 * 1000;
let cache: { at: number; ttl: number; data: CatalogResponse } | null = null;

const bundled = (snapshot as { videos: Video[] }).videos;

/** GET /api/videos — the latest uploads of every catalogue channel, newest first */
export async function GET() {
  if (cache && Date.now() - cache.at < cache.ttl) return respond(cache.data, cache.ttl);

  const live = await loadAll();
  // channels YouTube didn't answer for fall back to the bundled snapshot of their public videos
  const fill = new Set(live.missing.map(c => c.id));
  const fromSnapshot = bundled.filter(v => fill.has(v.channelId));
  const covered = new Set(fromSnapshot.map(v => v.channelId));
  const missing = live.missing.filter(c => !covered.has(c.id)).map(c => c.name);

  const videos = order([...live.videos, ...fromSnapshot]);
  if (!videos.length) return NextResponse.json({ error: 'Videos are unavailable right now.' }, { status: 503 });

  const data: CatalogResponse = { videos, fetchedAt: new Date().toISOString(), missing };
  const ttl = live.missing.length ? PARTIAL_TTL_MS : TTL_MS;
  cache = { at: Date.now(), ttl, data };
  return respond(data, ttl);
}

function respond(data: CatalogResponse, ttl: number) {
  const s = Math.round(ttl / 1000);
  return NextResponse.json(data, { headers: { 'Cache-Control': `public, max-age=${Math.min(s, 1800)}, s-maxage=${s}` } });
}
