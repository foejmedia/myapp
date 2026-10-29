/**
 * Nearby Mosques — shared data layer (server route + client).
 *
 * Source: OpenStreetMap via the Overpass API (no key, ODbL licence, attribution required).
 * Every field comes from a mapped OSM tag; nothing is inferred. OSM is community-mapped, so
 * all records carry `verification: 'community'`. A future provider of verified data (e.g. a
 * mosque-admin backend) can return the same `Mosque` shape with `verification: 'verified'`.
 */

export type FacilityKey = 'women' | 'wudu' | 'parking' | 'wheelchair' | 'toilets' | 'quran' | 'jumuah' | 'aircon';

export const FACILITIES: { key: FacilityKey; label: string; icon: string }[] = [
  { key: 'women', label: "Women's prayer area", icon: 'woman' },
  { key: 'wudu', label: 'Wudu facilities', icon: 'water_drop' },
  { key: 'parking', label: 'Parking', icon: 'local_parking' },
  { key: 'wheelchair', label: 'Wheelchair access', icon: 'accessible' },
  { key: 'toilets', label: 'Toilets', icon: 'wc' },
  { key: 'quran', label: 'Quran classes / madrasa', icon: 'menu_book' },
  { key: 'jumuah', label: "Jumu'ah prayer", icon: 'groups' },
  { key: 'aircon', label: 'Air conditioning', icon: 'ac_unit' },
];

export interface Mosque {
  /** OSM type initial + id: n123, w123, r123 */
  id: string;
  /** null when the map has no name recorded — never invented */
  name: string | null;
  nameAr: string | null;
  lat: number;
  lng: number;
  address: string | null;
  /** true when the address was reverse-geocoded from the position, not tagged on the mosque */
  addressApprox?: boolean;
  phone: string | null;
  website: string | null;
  facebook: string | null;
  email: string | null;
  image: string | null;
  openingHours: string | null;
  denomination: string | null;
  /** true = has it, false = mapped as not available; missing key = unknown */
  facilities: Partial<Record<FacilityKey, boolean>>;
  wheelchair: 'yes' | 'limited' | 'no' | null;
  verification: 'community' | 'verified';
  /** number of tags — a rough "how much is known" score for sorting */
  richness: number;
}

export interface NearbyResponse {
  mosques: Mosque[];
  /** mosques found before trimming to the nearest MAX_RESULTS */
  total: number;
  /** the source capped its answer, so the area may hold more than `total` */
  capped: boolean;
  /** the full map service was down; this is a smaller name-based search */
  partial?: boolean;
  /** served from an older copy because the source was unreachable */
  stale?: boolean;
  fetchedAt: string;
  source: string;
}

export const RADII_KM = [1, 5, 10, 25, 50] as const;
export const MAX_RESULTS = 300;
export const ATTRIBUTION = '© OpenStreetMap contributors (ODbL)';

// ---------- geometry ----------

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = Math.PI / 180;
  const h = Math.sin(((bLat - aLat) * r) / 2) ** 2
    + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(((bLng - aLng) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export const validCoord = (lat: unknown, lng: unknown): boolean =>
  typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)
  && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

export function formatDistance(km: number) {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** ~110 m precision: enough to search, and it keeps the user's exact position off our server */
export const coarse = (n: number) => Math.round(n * 1000) / 1000;

// ---------- OSM parsing ----------

export interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const YES = new Set(['yes', 'designated', 'separate', 'only']);
const NO = new Set(['no']);

/** Reads the first present tag as yes/no; returns undefined when unmapped or ambiguous */
function flag(tags: Record<string, string>, keys: string[], yes = YES): boolean | undefined {
  for (const k of keys) {
    const v = tags[k]?.toLowerCase();
    if (v == null) continue;
    if (yes.has(v)) return true;
    if (NO.has(v)) return false;
  }
  return undefined;
}

function httpUrl(v: string | undefined): string | null {
  if (!v) return null;
  const s = v.split(';')[0].trim();
  const url = /^https?:\/\//i.test(s) ? s : /^www\./i.test(s) ? `https://${s}` : null;
  try { return url ? new URL(url).toString() : null; } catch { return null; }
}

function facebookUrl(v: string | undefined) {
  if (!v) return null;
  return httpUrl(v) ?? (/^[\w.]+$/.test(v) ? `https://www.facebook.com/${v}` : null);
}

function imageUrl(tags: Record<string, string>): string | null {
  const commons = tags.wikimedia_commons;
  if (commons?.startsWith('File:')) {
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(commons.slice(5))}?width=800`;
  }
  const img = httpUrl(tags.image);
  // only direct image files; links to photo-sharing pages wouldn't render
  return img && (/\.(jpe?g|png|webp)(\?|$)/i.test(img) || /upload\.wikimedia\.org/.test(img)) ? img : null;
}

function address(tags: Record<string, string>): string | null {
  if (tags['addr:full']) return tags['addr:full'];
  const street = [tags['addr:housenumber'], tags['addr:street'] ?? tags['addr:place']].filter(Boolean).join(' ');
  const parts = [
    street,
    tags['addr:suburb'] ?? tags['addr:neighbourhood'],
    tags['addr:city'] ?? tags['addr:town'] ?? tags['addr:village'],
    tags['addr:postcode'],
  ].filter(Boolean);
  // a lone postcode or city isn't an address
  return street && parts.length ? parts.join(', ') : null;
}

export function parseMosque(el: OsmElement): Mosque | null {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
  if (!validCoord(lat, lng)) return null;

  const facilities: Mosque['facilities'] = {};
  const set = (k: FacilityKey, v: boolean | undefined) => { if (v !== undefined) facilities[k] = v; };

  const wheel = tags.wheelchair?.toLowerCase();
  const wheelchair = wheel === 'yes' || wheel === 'limited' || wheel === 'no' ? wheel : null;
  set('wheelchair', wheelchair ? wheelchair !== 'no' : undefined);
  set('women', flag(tags, ['female', 'women', 'prayer_room:female', 'women_section']));
  set('wudu', flag(tags, ['ablution', 'wudu', 'wudhu']));
  set('parking', flag(tags, ['parking'], new Set([...YES, 'surface', 'underground', 'multi-storey', 'street_side', 'lane'])));
  set('toilets', flag(tags, ['toilets']));
  set('quran', flag(tags, ['madrasa', 'quran_school', 'religious_education']));
  set('jumuah', flag(tags, ['jumuah', 'friday_prayer']));
  set('aircon', flag(tags, ['air_conditioning']));

  const name = tags.name?.trim() || tags['name:en']?.trim() || null;
  return {
    id: `${el.type[0]}${el.id}`,
    name,
    nameAr: tags['name:ar'] && tags['name:ar'] !== name ? tags['name:ar'] : null,
    lat: lat as number,
    lng: lng as number,
    address: address(tags),
    phone: (tags.phone ?? tags['contact:phone'])?.split(';')[0].trim() || null,
    website: httpUrl(tags.website ?? tags['contact:website']),
    facebook: facebookUrl(tags['contact:facebook'] ?? tags.facebook),
    email: (tags.email ?? tags['contact:email'])?.split(';')[0].trim() || null,
    image: imageUrl(tags),
    openingHours: tags.opening_hours || null,
    denomination: tags.denomination ? tags.denomination.replace(/_/g, ' ') : null,
    facilities,
    wheelchair,
    verification: 'community',
    richness: Object.keys(tags).length,
  };
}

const normName = (s: string | null) => (s ?? '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]/gu, '');

/**
 * Mosques are often mapped twice: a point plus the building outline. Same name within
 * 150 m, or an unnamed one within 40 m of another, is treated as one place; the record
 * with more tags wins.
 */
export function dedupe(list: Mosque[]): Mosque[] {
  const sorted = [...list].sort((a, b) => b.richness - a.richness);
  const kept: Mosque[] = [];
  for (const m of sorted) {
    const dup = kept.some(k => {
      const d = distanceKm(k.lat, k.lng, m.lat, m.lng);
      if (m.name && k.name) return d < 0.15 && normName(m.name) === normName(k.name);
      return d < 0.04;
    });
    if (!dup) kept.push(m);
  }
  return kept;
}

export const displayName = (m: Pick<Mosque, 'name'>) => m.name ?? 'Mosque (name not recorded)';

// ---------- links ----------

const osmType = (id: string) => ({ n: 'node', w: 'way', r: 'relation' })[id[0]] ?? 'node';
export const isMosqueId = (id: string) => /^[nwr]\d{1,12}$/.test(id);

export const links = {
  google: (m: Mosque) => `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`,
  /** Google Maps URLs: free, no key */
  googleView: (m: Mosque) => `https://www.google.com/maps/search/?api=1&query=${m.lat}%2C${m.lng}`,
  googleArea: (lat: number, lng: number) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`mosques near ${lat.toFixed(5)},${lng.toFixed(5)}`)}`,
  apple: (m: Mosque) => `https://maps.apple.com/?daddr=${m.lat},${m.lng}&q=${encodeURIComponent(displayName(m))}`,
  osmDirections: (m: Mosque) => `https://www.openstreetmap.org/directions?to=${m.lat}%2C${m.lng}`,
  osmView: (m: Mosque) => `https://www.openstreetmap.org/${osmType(m.id)}/${m.id.slice(1)}`,
  osmEdit: (m: Mosque) => `https://www.openstreetmap.org/edit?${osmType(m.id)}=${m.id.slice(1)}`,
  /** OSM notes reach local mappers, who fix the source every app reads from */
  report: (m: Mosque) => `https://www.openstreetmap.org/note/new#map=19/${m.lat}/${m.lng}`,
};
