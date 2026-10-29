import { NextResponse } from 'next/server';
import { MAX_RESULTS, RADII_KM, coarse, dedupe, distanceKm, parseMosque, validCoord, type Mosque, type NearbyResponse } from '@/lib/mosques';
import { TtlCache, UpstreamError, nominatimMosques, overpass } from '@/lib/server/overpass';

export const dynamic = 'force-dynamic';
/** a busy Overpass instance can take most of a minute to answer */
export const maxDuration = 60;

/** Overpass is asked for at most this many; dense cities at 50 km can exceed it */
const FETCH_CAP = 3000;
interface Area { capped: boolean; mosques: Mosque[]; partial?: boolean; stale?: boolean }
const cache = new TtlCache<Area>(60 * 60 * 1000);
const partialCache = new TtlCache<Area>(10 * 60 * 1000);

/**
 * Searches snap to a grid of a tenth of the radius and fetch a 10% larger circle, so nearby
 * users and small map pans share one upstream query. Results are then cut to the exact circle.
 */
function snap(lat: number, lng: number, radius: number) {
  const step = (radius * 0.1) / 111;
  const s = (n: number) => Math.round(n / step) * step;
  return { lat: Number(s(lat).toFixed(5)), lng: Number(s(lng).toFixed(5)) };
}

/**
 * GET /api/mosques?lat=..&lng=..&radius=5
 * Coordinates are rounded to ~110 m before use and never logged or stored beyond the cache key.
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lat = coarse(Number(sp.get('lat'))), lng = coarse(Number(sp.get('lng')));
  const radius = Number(sp.get('radius'));
  if (!validCoord(lat, lng)) return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  if (!(RADII_KM as readonly number[]).includes(radius)) {
    return NextResponse.json({ error: `Radius must be one of ${RADII_KM.join(', ')} km` }, { status: 400 });
  }

  try {
    const cell = snap(lat, lng, radius);
    const key = `${cell.lat},${cell.lng},${radius}`;
    const hit = cache.get(key);
    const area = hit ?? await loadArea(key, cell, radius);
    const within = area.mosques
      .map(m => ({ m, d: distanceKm(lat, lng, m.lat, m.lng) }))
      .filter(x => x.d <= radius)
      .sort((a, b) => a.d - b.d);
    return respond({
      mosques: within.slice(0, MAX_RESULTS).map(x => x.m),
      total: within.length,
      capped: area.capped,
      partial: area.partial,
      stale: area.stale,
      fetchedAt: new Date().toISOString(),
      source: area.partial ? 'OpenStreetMap (Nominatim name search)' : 'OpenStreetMap (Overpass API)',
    }, hit ? 'HIT' : area.partial || area.stale ? 'FALLBACK' : 'MISS');
  } catch (e) {
    const busy = e instanceof UpstreamError;
    return NextResponse.json(
      { error: busy ? 'The map data service is busy. Please try again in a moment.' : 'Could not load mosques.' },
      { status: busy ? 503 : 500 },
    );
  }
}

const toMosques = (elements: Parameters<typeof parseMosque>[0][]) =>
  dedupe(elements.map(parseMosque).filter((m): m is Mosque => m != null));

/** Overpass first; if it's down, an expired copy; failing that, a partial name search */
async function loadArea(key: string, cell: { lat: number; lng: number }, radius: number): Promise<Area> {
  try {
    const { elements } = await overpass(`[out:json][timeout:25];
nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${Math.round(radius * 1100)},${cell.lat},${cell.lng});
out tags center qt ${FETCH_CAP};`);
    const area = { mosques: toMosques(elements), capped: elements.length >= FETCH_CAP };
    cache.set(key, area);
    return area;
  } catch (e) {
    const old = cache.get(key, true);
    if (old) return { ...old, stale: true };
    const partial = partialCache.get(key);
    if (partial) return partial;
    try {
      const area = { mosques: toMosques(await nominatimMosques(cell.lat, cell.lng, radius * 1.1)), capped: false, partial: true };
      partialCache.set(key, area);
      return area;
    } catch {
      throw e;
    }
  }
}

function respond(data: NearbyResponse, cacheState: 'HIT' | 'MISS' | 'FALLBACK') {
  // partial/stale answers shouldn't sit in shared caches once the full source is back
  const fresh = !data.partial && !data.stale;
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': fresh ? 'public, max-age=600, s-maxage=3600' : 'public, max-age=60, s-maxage=60',
      'X-Cache': cacheState,
    },
  });
}
