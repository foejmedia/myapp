'use client';
import { coarse, type Mosque, type NearbyResponse } from '@/lib/mosques';

export interface LatLng { lat: number; lng: number }
export interface Origin extends LatLng {
  label: string;
  /** gps = the user's position; place = a searched place; map = the area the user panned to */
  kind: 'gps' | 'place' | 'map';
}
export interface Place extends LatLng { label: string; detail: string }

/**
 * In-memory only: survives client-side navigation (list → details → back) but not a reload,
 * so the user's precise position is never written to storage.
 */
export const session: {
  origin: Origin | null;
  userPos: LatLng | null;
  radius: number;
  data: NearbyResponse | null;
  dataKey: string;
} = { origin: null, userPos: null, radius: 5, data: null, dataKey: '' };

export class LocationError extends Error {
  constructor(message: string, public denied = false) { super(message); }
}

export function locate(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return reject(new LocationError('This browser can’t detect your location. Search for a place instead.'));
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new LocationError('Location access is blocked. You can allow it from the lock icon in the address bar, or search for a place instead.', true));
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          reject(new LocationError('Your location is unavailable — location services may be turned off on this device.'));
        } else {
          reject(new LocationError('Finding your location took too long. Try again, or search for a place.'));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2 * 60 * 1000 },
    );
  });
}

/** Already granted? Then the intro screen can be skipped. Never prompts. */
export async function locationGranted() {
  try {
    const p = await navigator.permissions?.query({ name: 'geolocation' as PermissionName });
    return p?.state === 'granted';
  } catch {
    return false;
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Something went wrong. Please try again.');
  return json as T;
}

export const nearbyKey = (o: LatLng, radius: number) => `${coarse(o.lat)},${coarse(o.lng)},${radius}`;

export function fetchNearby(o: LatLng, radius: number, signal?: AbortSignal) {
  return getJson<NearbyResponse>(`/api/mosques?lat=${coarse(o.lat)}&lng=${coarse(o.lng)}&radius=${radius}`, signal);
}

export function fetchMosque(id: string, signal?: AbortSignal) {
  return getJson<Mosque>(`/api/mosques/${id}`, signal);
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: Record<string, string | undefined>;
}

/** City / locality / postcode suggestions from Photon (OSM-based, built for search-as-you-type) */
export async function suggestPlaces(q: string, bias?: LatLng | null, signal?: AbortSignal): Promise<Place[]> {
  const near = bias ? `&lat=${coarse(bias.lat)}&lon=${coarse(bias.lng)}` : '';
  const json = await getJson<{ features: PhotonFeature[] }>(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en${near}`, signal,
  );
  const seen = new Set<string>();
  return json.features.flatMap(f => {
    const p = f.properties;
    const [lng, lat] = f.geometry.coordinates;
    const label = p.name ?? p.postcode ?? p.street;
    if (!label) return [];
    const detail = [p.city !== label ? p.city : null, p.state, p.country].filter(Boolean).join(', ');
    const id = `${label}|${detail}`;
    if (seen.has(id)) return [];
    seen.add(id);
    return [{ lat, lng, label, detail }];
  });
}
