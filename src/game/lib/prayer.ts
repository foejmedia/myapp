/**
 * Prayer times from solar position (declination + equation of time).
 * No packages. Times are returned as local Dates for the given time zone offset.
 * High latitudes use the angle-based rule when Fajr/Isha would not occur.
 */
import type { Method } from './storage';

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type PrayerTimes = Record<PrayerName, Date>;
export const SALAH: Exclude<PrayerName, 'sunrise'>[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PRAYER_LABEL: Record<PrayerName, string> = {
  fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};

export const METHODS: Record<Method, { label: string; fajr: number; isha: number | { minutes: number; ramadan: number } }> = {
  MWL: { label: 'Muslim World League', fajr: 18, isha: 17 },
  ISNA: { label: 'ISNA (North America)', fajr: 15, isha: 15 },
  Egypt: { label: 'Egyptian General Authority', fajr: 19.5, isha: 17.5 },
  Karachi: { label: 'University of Islamic Sciences, Karachi', fajr: 18, isha: 18 },
  UmmAlQura: { label: 'Umm al-Qura, Makkah', fajr: 18.5, isha: { minutes: 90, ramadan: 120 } },
};

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const sin = (d: number) => Math.sin(rad(d));
const cos = (d: number) => Math.cos(rad(d));
const tan = (d: number) => Math.tan(rad(d));
const arcsin = (x: number) => deg(Math.asin(x));
const arccos = (x: number) => deg(Math.acos(x));
const arctan2 = (y: number, x: number) => deg(Math.atan2(y, x));
const arccot = (x: number) => deg(Math.atan(1 / x));
const fix = (a: number, b: number) => { const r = a - b * Math.floor(a / b); return r < 0 ? r + b : r; };
const fixAngle = (a: number) => fix(a, 360);
const fixHour = (h: number) => fix(h, 24);

function julian(year: number, month: number, day: number): number {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function sunPosition(jd: number) {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * sin(g) + 0.02 * sin(2 * g));
  const e = 23.439 - 0.00000036 * D;
  const RA = arctan2(cos(e) * sin(L), cos(L)) / 15;
  return { declination: arcsin(sin(e) * sin(L)), equation: q / 15 - fixHour(RA) };
}

export type PrayerInput = {
  lat: number;
  lng: number;
  date: Date;        // the calendar day (local)
  tzHours: number;   // e.g. 5.5 for India
  method: Method;
  asr: 'standard' | 'hanafi';
  ramadan?: boolean;
};

/** Times as local fractional hours (may be NaN only if the sun never rises). */
export function computeHours(inp: PrayerInput): Record<PrayerName, number> {
  const { lat, lng, method } = inp;
  const m = METHODS[method];
  const jDate = julian(inp.date.getFullYear(), inp.date.getMonth() + 1, inp.date.getDate()) - lng / (15 * 24);

  const midDay = (t: number) => fixHour(12 - sunPosition(jDate + t).equation);
  const angleTime = (angle: number, t: number, ccw: boolean) => {
    const decl = sunPosition(jDate + t).declination;
    const noon = midDay(t);
    const x = arccos((-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15;
    return noon + (ccw ? -x : x);
  };
  const asrTime = (factor: number, t: number) => {
    const decl = sunPosition(jDate + t).declination;
    return angleTime(-arccot(factor + tan(Math.abs(lat - decl))), t, false);
  };

  // Two passes: estimate, then refine with the estimate.
  let h = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18 };
  for (let pass = 0; pass < 2; pass++) {
    const p = (x: number) => x / 24;
    h = {
      fajr: angleTime(m.fajr, p(h.fajr), true),
      sunrise: angleTime(0.833, p(h.sunrise), true),
      dhuhr: midDay(p(h.dhuhr)),
      asr: asrTime(inp.asr === 'hanafi' ? 2 : 1, p(h.asr)),
      sunset: angleTime(0.833, p(h.sunset), false),
      isha: typeof m.isha === 'number' ? angleTime(m.isha, p(h.isha), false) : h.isha,
    };
    if (pass === 0) for (const k of Object.keys(h) as (keyof typeof h)[]) if (Number.isNaN(h[k])) h[k] = k === 'fajr' ? 5 : 18;
  }

  const shift = inp.tzHours - lng / 15;
  const out = {
    fajr: h.fajr + shift,
    sunrise: h.sunrise + shift,
    dhuhr: h.dhuhr + shift,
    asr: h.asr + shift,
    maghrib: h.sunset + shift,
    isha: h.isha + shift,
  };

  // Night = sunset to next sunrise. Angle-based rule for high latitudes.
  const night = fixHour(out.sunrise - out.maghrib);
  const fajrMax = (m.fajr / 60) * night;
  if (Number.isNaN(out.fajr) || fixHour(out.sunrise - out.fajr) > fajrMax) out.fajr = out.sunrise - fajrMax;
  if (typeof m.isha === 'number') {
    const ishaMax = (m.isha / 60) * night;
    if (Number.isNaN(out.isha) || fixHour(out.isha - out.maghrib) > ishaMax) out.isha = out.maghrib + ishaMax;
  } else {
    out.isha = out.maghrib + (inp.ramadan ? m.isha.ramadan : m.isha.minutes) / 60;
  }
  return out;
}

/** Prayer times as Dates on the given local day. Null if the input cannot produce times. */
export function prayerTimes(inp: PrayerInput): PrayerTimes | null {
  const hours = computeHours(inp);
  const base = new Date(inp.date.getFullYear(), inp.date.getMonth(), inp.date.getDate());
  const out = {} as PrayerTimes;
  for (const [k, v] of Object.entries(hours) as [PrayerName, number][]) {
    if (!Number.isFinite(v)) return null;
    out[k] = new Date(base.getTime() + Math.round(v * 60) * 60000);
  }
  return out;
}

export const formatTime = (d: Date) =>
  d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
