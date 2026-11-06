import { NextResponse } from 'next/server';
import {
  fromMp3Quran, fromRadioBrowser, mergeStations,
  type LiveResponse, type LiveStation, type Mp3QuranRadio, type RbStation,
} from '@/lib/radio/live';

export const dynamic = 'force-dynamic';

const UA = 'LearnQuran-LiveRadio/1.0 (+https://quraniclearn.com)';
/** Used when the server list can't be fetched; Radio Browser's mirrors change over time */
const RB_FALLBACK = ['https://de1.api.radio-browser.info', 'https://de2.api.radio-browser.info'];
/** several searches, since stations are tagged and named inconsistently */
const RB_QUERIES = ['tag=quran', 'tag=koran', 'tag=coran', 'name=quran', 'name=القرآن', 'name=قرآن'];

const TTL_MS = 60 * 60 * 1000;
let cache: { at: number; data: LiveResponse } | null = null;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store', signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return res.json() as Promise<T>;
}

async function mp3quran(): Promise<LiveStation[]> {
  const [en, ar] = await Promise.all([
    getJson<{ radios: Mp3QuranRadio[] }>('https://www.mp3quran.net/api/v3/radios?language=eng'),
    getJson<{ radios: Mp3QuranRadio[] }>('https://www.mp3quran.net/api/v3/radios?language=ar').catch(() => ({ radios: [] })),
  ]);
  return fromMp3Quran(en.radios ?? [], ar.radios ?? []);
}

/** Current mirrors, from Radio Browser's own discovery endpoint (as it asks clients to do) */
async function rbMirrors(): Promise<string[]> {
  try {
    const list = await getJson<{ name: string }[]>('https://all.api.radio-browser.info/json/servers');
    const names = [...new Set(list.map(s => s.name))].sort(() => Math.random() - 0.5);
    if (names.length) return names.map(n => `https://${n}`);
  } catch { /* fall through */ }
  return RB_FALLBACK;
}

async function radioBrowser(): Promise<LiveStation[]> {
  let lastError: unknown = new Error('no Radio Browser mirror answered');
  for (const base of await rbMirrors()) {
    const results = await Promise.allSettled(RB_QUERIES.map(q =>
      getJson<RbStation[]>(`${base}/json/stations/search?${q}&hidebroken=true&order=clickcount&reverse=true&limit=500`)));
    // the main "quran" tag search carries most stations; the others only add stragglers
    if (results[0].status === 'rejected') { lastError = results[0].reason; continue; }
    const lists = results.flatMap(r => (r.status === 'fulfilled' ? [r.value] : []));
    const byId = new Map(lists.flat().map(s => [s.stationuuid, s]));
    return fromRadioBrowser([...byId.values()]);
  }
  throw lastError;
}

/** GET /api/radio/live — every Quran-related live stream we can reach */
export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) return respond(cache.data);

  const [mq, rb] = await Promise.allSettled([mp3quran(), radioBrowser()]);
  const missing = [mq.status === 'rejected' ? 'MP3Quran' : null, rb.status === 'rejected' ? 'Radio Browser' : null]
    .filter((s): s is string => !!s);
  const stations = mergeStations(mq.status === 'fulfilled' ? mq.value : [], rb.status === 'fulfilled' ? rb.value : []);

  if (!stations.length) {
    // both sources down: an older list beats an error
    if (cache) return respond({ ...cache.data, missing });
    return NextResponse.json({ error: 'Live radio directories are unreachable right now.' }, { status: 503 });
  }
  const data: LiveResponse = { stations, fetchedAt: new Date().toISOString(), missing };
  // a partial result is served but not cached, so the missing source is retried next time
  if (!missing.length) cache = { at: Date.now(), data };
  return respond(data);
}

function respond(data: LiveResponse) {
  const full = !data.missing.length;
  return NextResponse.json(data, {
    headers: { 'Cache-Control': full ? 'public, max-age=900, s-maxage=3600' : 'public, max-age=60, s-maxage=60' },
  });
}
