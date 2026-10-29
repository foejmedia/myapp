/**
 * Qibla direction + distance to the Kaaba along the great circle.
 */

export const KAABA = { lat: 21.4225, lng: 39.8262 };

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Normalise any angle to [0, 360) */
export const norm = (a: number) => ((a % 360) + 360) % 360;

/** Initial great-circle bearing from the point to the Kaaba, degrees clockwise from true north */
export function qiblaBearing(lat: number, lng: number) {
  const φ1 = rad(lat), φ2 = rad(KAABA.lat), Δλ = rad(KAABA.lng - lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return norm(deg(Math.atan2(y, x)));
}

/** Haversine distance to the Kaaba in km */
export function qiblaDistance(lat: number, lng: number) {
  const φ1 = rad(lat), φ2 = rad(KAABA.lat);
  const a = Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(rad(KAABA.lng - lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const cardinal = (a: number) => POINTS[Math.round(norm(a) / 45) % 8];

/** Signed shortest turn from `from` to `to`, in (-180, 180] */
export function turn(from: number, to: number) {
  const d = norm(to - from);
  return d > 180 ? d - 360 : d;
}

// ---------- sun ----------

/** Sun azimuth (clockwise from true north) and elevation, degrees — NOAA solar position algorithm */
export function sunPosition(lat: number, lng: number, date = new Date()) {
  const T = (date.getTime() / 86400000 + 2440587.5 - 2451545) / 36525;
  const L0 = norm(280.46646 + T * (36000.76983 + T * 0.0003032));
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T))
    + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T) + Math.sin(rad(3 * M)) * 0.000289;
  const Ω = 125.04 - 1934.136 * T;
  const λ = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(Ω));
  const ε = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(rad(Ω));
  const δ = Math.asin(Math.sin(rad(ε)) * Math.sin(rad(λ)));

  const y = Math.tan(rad(ε / 2)) ** 2;
  const eqTime = 4 * deg(y * Math.sin(rad(2 * L0)) - 2 * e * Math.sin(rad(M))
    + 4 * e * y * Math.sin(rad(M)) * Math.cos(rad(2 * L0))
    - 0.5 * y * y * Math.sin(rad(4 * L0)) - 1.25 * e * e * Math.sin(rad(2 * M)));
  const utcMin = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const H = rad(((utcMin + eqTime + 4 * lng) % 1440) / 4 - 180);

  const φ = rad(lat);
  const elevation = deg(Math.asin(Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ) * Math.cos(H)));
  const azimuth = norm(deg(Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(φ) - Math.tan(δ) * Math.cos(φ))) + 180);
  return { azimuth, elevation };
}

/**
 * Twice a year the sun passes straight over the Kaaba, so every shadow on the
 * sunlit half of the Earth points away from the Qibla (Rasd al-Qibla).
 */
export function nextSunOverKaaba(now = new Date()) {
  const at = (y: number) => [
    Date.UTC(y, 4, 27, 9, 18), Date.UTC(y, 4, 28, 9, 18),
    Date.UTC(y, 6, 15, 9, 27), Date.UTC(y, 6, 16, 9, 27),
  ];
  const t = [...at(now.getUTCFullYear()), ...at(now.getUTCFullYear() + 1)].find(x => x > now.getTime() - 5 * 60000)!;
  return new Date(t);
}

// ---------- map ----------

/** Points along the great circle to the Kaaba, longitudes unwrapped so the line never jumps across the map */
export function pathToKaaba(lat: number, lng: number, steps = 64): [number, number][] {
  const φ1 = rad(lat), λ1 = rad(lng), φ2 = rad(KAABA.lat), λ2 = rad(KAABA.lng);
  const d = qiblaDistance(lat, lng) / 6371;
  if (d < 1e-6) return [[lat, lng]];
  const out: [number, number][] = [];
  let prev = lng;
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const a = Math.sin((1 - f) * d) / Math.sin(d), b = Math.sin(f * d) / Math.sin(d);
    const x = a * Math.cos(φ1) * Math.cos(λ1) + b * Math.cos(φ2) * Math.cos(λ2);
    const y = a * Math.cos(φ1) * Math.sin(λ1) + b * Math.cos(φ2) * Math.sin(λ2);
    const z = a * Math.sin(φ1) + b * Math.sin(φ2);
    let lon = deg(Math.atan2(y, x));
    lon += 360 * Math.round((prev - lon) / 360);
    prev = lon;
    out.push([deg(Math.atan2(z, Math.hypot(x, y))), lon]);
  }
  return out;
}
