import type { OsmElement } from '@/lib/mosques';

/**
 * Server-side Overpass client. Public instances ask for an identifying User-Agent,
 * modest request rates and caching, so every query goes through here.
 */

/** Public instances queue requests when busy, so the main one gets a long wait and the mirror a shorter one */
const ENDPOINTS = [
  { url: 'https://overpass-api.de/api/interpreter', timeoutMs: 30000 },
  { url: 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', timeoutMs: 12000 },
];
export const USER_AGENT = 'LearnQuran-NearbyMosques/1.0 (+https://quraniclearn.com)';

export class UpstreamError extends Error {}

/** After a failure an instance is skipped for a while, so fallbacks answer at once instead of after a timeout */
const COOLDOWN_MS = 90 * 1000;
const downUntil = new Map<string, number>();

export async function overpass(query: string): Promise<{ elements: OsmElement[] }> {
  let last: unknown;
  for (const { url, timeoutMs } of ENDPOINTS) {
    if ((downUntil.get(url) ?? 0) > Date.now()) continue;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
        cache: 'no-store',
      });
      // 429/504 mean this instance is busy; try the next one
      if (!res.ok) throw new UpstreamError(`Overpass ${res.status}`);
      return await res.json();
    } catch (e) {
      last = e;
      downUntil.set(url, Date.now() + COOLDOWN_MS);
    } finally {
      clearTimeout(timer);
    }
  }
  throw last instanceof UpstreamError ? last : new UpstreamError('Map data service unreachable');
}

/** Small TTL cache shared by requests on this server instance */
export class TtlCache<T> {
  private map = new Map<string, { at: number; value: T }>();
  constructor(private ttlMs: number, private max = 300) {}
  /** `stale` also returns expired entries — better than nothing when the source is down */
  get(key: string, stale = false) {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    return stale || Date.now() - hit.at <= this.ttlMs ? hit.value : undefined;
  }
  set(key: string, value: T) {
    if (this.map.size >= this.max) this.map.delete(this.map.keys().next().value!);
    this.map.set(key, { at: Date.now(), value });
  }
}

interface NominatimHit {
  osm_type: 'node' | 'way' | 'relation';
  osm_id: number;
  lat: string;
  lon: string;
  name?: string;
  category?: string;
  type?: string;
  extratags?: Record<string, string> | null;
  address?: Record<string, string>;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** A Nominatim hit as an OSM element, or null unless it's mapped as a mosque */
function fromNominatim(h: NominatimHit): OsmElement | null {
  const tags = h.extratags ?? {};
  if (h.category !== 'amenity' || h.type !== 'place_of_worship' || tags.religion !== 'muslim') return null;
  // Nominatim fills address parts from the surroundings; a house number only comes from a mapped
  // address, so without one the address is left out rather than presented as recorded
  const a = h.address?.house_number ? h.address : {};
  const addr: Record<string, string> = {};
  if (a.house_number) addr['addr:housenumber'] = a.house_number;
  if (a.road) addr['addr:street'] = a.road;
  if (a.suburb) addr['addr:suburb'] = a.suburb;
  const city = a.city ?? a.town ?? a.village;
  if (city) addr['addr:city'] = city;
  if (a.postcode) addr['addr:postcode'] = a.postcode;
  return {
    type: h.osm_type, id: h.osm_id, lat: Number(h.lat), lon: Number(h.lon),
    // mapped addr:* tags win over the reverse-geocoded parts
    tags: { ...addr, ...tags, ...(h.name ? { name: h.name } : {}), amenity: 'place_of_worship', religion: 'muslim' },
  };
}

/** One mosque by id. `undefined` = not found / not a mosque. */
export async function nominatimLookup(id: string): Promise<OsmElement | undefined> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/lookup?osm_ids=${id[0].toUpperCase()}${id.slice(1)}&format=jsonv2&extratags=1&addressdetails=1`,
    { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' }, cache: 'no-store', signal: AbortSignal.timeout(10000) },
  );
  if (!res.ok) throw new UpstreamError(`Nominatim ${res.status}`);
  const [hit] = (await res.json()) as NominatimHit[];
  return hit ? fromNominatim(hit) ?? undefined : undefined;
}

/**
 * Fallback when every Overpass instance is down: Nominatim name search for "mosque" and
 * "masjid" inside the search box. It finds only places whose name contains those words, so
 * callers must flag the result as partial. Two requests, spaced to honour Nominatim's
 * 1 request/second policy.
 */
export async function nominatimMosques(lat: number, lng: number, radiusKm: number): Promise<OsmElement[]> {
  const dLat = radiusKm / 111, dLng = radiusKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  const box = [lng - dLng, lat + dLat, lng + dLng, lat - dLat].map(n => n.toFixed(4)).join(',');
  const out = new Map<string, OsmElement>();
  for (const [i, q] of ['mosque', 'masjid'].entries()) {
    if (i) await sleep(1100);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=jsonv2&viewbox=${box}&bounded=1&limit=50&extratags=1&addressdetails=1`,
      { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' }, cache: 'no-store', signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) throw new UpstreamError(`Nominatim ${res.status}`);
    for (const h of (await res.json()) as NominatimHit[]) {
      const el = fromNominatim(h);
      if (el) out.set(`${el.type}${el.id}`, el);
    }
  }
  return [...out.values()];
}
