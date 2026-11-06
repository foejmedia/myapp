import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/geocode?lat=..&lng=.. → { area: "Anjanapura, Bengaluru" }
 *
 * Google's keyless map only searches by place name, so a GPS position is turned into the
 * name of its area with the Google Geocoding API. Needs GOOGLE_MAPS_API_KEY (server-only,
 * "Geocoding API" enabled). Coordinates are rounded to ~110 m and not stored.
 */
const KEY = process.env.GOOGLE_MAPS_API_KEY;
const AREA_TYPES = ['sublocality_level_1', 'sublocality', 'neighborhood', 'sublocality_level_2'];

interface Component { long_name: string; types: string[] }

export async function GET(req: Request) {
  if (!KEY) return NextResponse.json({ error: 'Location lookup is not set up' }, { status: 501 });

  const sp = new URL(req.url).searchParams;
  const lat = Math.round(Number(sp.get('lat')) * 1000) / 1000;
  const lng = Math.round(Number(sp.get('lng')) * 1000) / 1000;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=en&key=${KEY}`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) } as RequestInit,
    );
    const json = (await res.json()) as { status: string; results: { address_components: Component[] }[] };
    if (json.status !== 'OK' || !json.results.length) throw new Error(json.status);

    const parts = json.results.flatMap(r => r.address_components);
    const find = (types: string[]) => types.map(t => parts.find(c => c.types.includes(t))?.long_name).find(Boolean);
    const area = find(AREA_TYPES);
    const city = find(['locality', 'postal_town', 'administrative_area_level_2']);
    const name = [area, city].filter((v, i, a) => v && a.indexOf(v) === i).join(', ');
    if (!name) throw new Error('no area');
    return NextResponse.json({ area: name }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
  } catch {
    return NextResponse.json({ error: 'Could not find the name of your area' }, { status: 502 });
  }
}
