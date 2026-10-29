import { NextResponse } from 'next/server';
import { isMosqueId, parseMosque, type Mosque } from '@/lib/mosques';
import { TtlCache, USER_AGENT, UpstreamError, nominatimLookup, overpass } from '@/lib/server/overpass';
import type { OsmElement } from '@/lib/mosques';

export const dynamic = 'force-dynamic';
/** a busy Overpass instance can take most of a minute to answer */
export const maxDuration = 60;

const cache = new TtlCache<Mosque>(6 * 60 * 60 * 1000, 500);
const TYPE = { n: 'node', w: 'way', r: 'rel' } as const;

/** Nominatim: one lookup per mosque page, cached, within its 1 request/second policy */
async function reverseAddress(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=0`,
      { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' }, next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { display_name?: string };
    return json.display_name ?? null;
  } catch {
    return null;
  }
}

/** Nominatim answers single lookups fast; Overpass is the fallback */
async function loadElement(id: string): Promise<OsmElement | undefined> {
  try {
    return await nominatimLookup(id);
  } catch {
    const type = TYPE[id[0] as keyof typeof TYPE];
    const { elements } = await overpass(`[out:json][timeout:20];${type}(${id.slice(1)});out tags center;`);
    const el = elements[0];
    // the id may come from a shared link; only serve places mapped as mosques
    return el?.tags?.amenity === 'place_of_worship' && el.tags.religion === 'muslim' ? el : undefined;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isMosqueId(id)) return NextResponse.json({ error: 'Invalid mosque id' }, { status: 400 });

  const hit = cache.get(id);
  if (hit) return respond(hit);

  try {
    const el = await loadElement(id);
    if (!el) {
      return NextResponse.json({ error: 'This place is not listed as a mosque on the map.' }, { status: 404 });
    }
    const mosque = parseMosque(el);
    if (!mosque) return NextResponse.json({ error: 'This mosque has no valid map position.' }, { status: 404 });
    if (!mosque.address) {
      const approx = await reverseAddress(mosque.lat, mosque.lng);
      if (approx) Object.assign(mosque, { address: approx, addressApprox: true });
    }
    cache.set(id, mosque);
    return respond(mosque);
  } catch (e) {
    const busy = e instanceof UpstreamError;
    return NextResponse.json(
      { error: busy ? 'The map data service is busy. Please try again in a moment.' : 'Could not load this mosque.' },
      { status: busy ? 503 : 500 },
    );
  }
}

function respond(m: Mosque) {
  return NextResponse.json(m, { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=21600' } });
}
