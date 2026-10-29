'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  PRAYER_AR, PRAYER_KEYS, dayKey, getCachedLocation, getPrayerDays, locateByGps, locateByIp, prayerDate, to12h, upcomingPrayers,
  type PrayerDay, type PrayerLocation,
} from '@/lib/prayerTimes';
import { cardinal, nextSunOverKaaba, norm, qiblaBearing, qiblaDistance, sunPosition, turn } from '@/lib/qibla';
import { magneticDeclination } from '@/lib/geomag';
import './QiblaCompass.css';

const QiblaMap = dynamic(() => import('./QiblaMap'), { ssr: false, loading: () => <div className="qb-map" aria-busy="true" /> });

/** iOS gates motion sensors behind a permission prompt that must come from a tap */
type IOSOrientation = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };
type OrientationEvt = DeviceOrientationEvent & { webkitCompassHeading?: number };
type Sensor = 'checking' | 'needs-permission' | 'active' | 'unsupported' | 'denied';

/** Within this many degrees counts as facing the Qibla */
const ALIGN_TOLERANCE = 4;
/** Low-pass factor for the jittery magnetometer: lower is smoother but laggier */
const SMOOTHING = 0.2;

const SOURCE_LABEL: Record<PrayerLocation['source'], string> = {
  gps: 'Precise (GPS)', ip: 'Approximate (network)', default: 'Default — Makkah',
};

function screenAngle() {
  return typeof screen !== 'undefined' && screen.orientation ? screen.orientation.angle : 0;
}

/** Magnetic compass heading in degrees clockwise from magnetic north, or null if this event carries none */
function readHeading(e: OrientationEvt, absoluteEvent: boolean) {
  if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
    return norm(e.webkitCompassHeading + screenAngle());
  }
  if (e.alpha == null || (!absoluteEvent && !e.absolute)) return null;
  return norm(360 - e.alpha + screenAngle());
}

const eastWest = (d: number) => `${Math.abs(d).toFixed(1)}° ${d >= 0 ? 'E' : 'W'}`;

function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m ${String(s % 60).padStart(2, '0')}s`;
}

const TICKS = Array.from({ length: 72 }, (_, i) => i * 5);
const LETTERS = [
  { a: 0, t: 'N' }, { a: 90, t: 'E' }, { a: 180, t: 'S' }, { a: 270, t: 'W' },
];

export default function QiblaCompass() {
  const [loc, setLoc] = useState<PrayerLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [sensor, setSensor] = useState<Sensor>('checking');
  /** unwrapped (can exceed 360) so the dial never spins the long way round at north */
  const [heading, setHeading] = useState<number | null>(null);
  const [days, setDays] = useState<PrayerDay[] | null>(null);
  const [now, setNow] = useState(() => new Date());
  const smoothed = useRef<number | null>(null);
  const raw = useRef<number | null>(null);
  const wasAligned = useRef(false);

  useEffect(() => {
    const cached = getCachedLocation();
    if (cached) setLoc(cached);
    else locateByIp().then(setLoc);
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  // reload on a new location, and after midnight when today's entry is gone
  const today = dayKey(now);
  useEffect(() => {
    if (!loc) return;
    let stale = false;
    getPrayerDays(loc).then(d => { if (!stale) setDays(d); }).catch(() => {});
    return () => { stale = true; };
  }, [loc, today]);

  const locatePrecisely = async () => {
    setLocating(true);
    setLocError('');
    try { setLoc(await locateByGps()); } catch (e) { setLocError((e as Error).message); }
    setLocating(false);
  };

  const listen = useCallback(() => {
    const absolute = 'ondeviceorientationabsolute' in window;
    const type = absolute ? 'deviceorientationabsolute' : 'deviceorientation';
    const onOrient = (e: Event) => {
      const h = readHeading(e as OrientationEvt, absolute);
      if (h != null) raw.current = h;
    };
    window.addEventListener(type, onOrient);

    let frame = 0;
    const tick = () => {
      if (raw.current != null) {
        const prev = smoothed.current;
        smoothed.current = prev == null ? raw.current : prev + turn(norm(prev), raw.current) * SMOOTHING;
        setHeading(smoothed.current);
        setSensor('active');
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    // desktops expose the API but never deliver a heading
    const probe = window.setTimeout(() => {
      if (raw.current == null) setSensor(s => (s === 'checking' ? 'unsupported' : s));
    }, 2500);

    return () => {
      window.removeEventListener(type, onOrient);
      cancelAnimationFrame(frame);
      window.clearTimeout(probe);
    };
  }, []);

  const stop = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      setSensor('unsupported');
      return;
    }
    if (typeof (DeviceOrientationEvent as IOSOrientation).requestPermission === 'function') {
      setSensor('needs-permission');
      return;
    }
    stop.current = listen();
    return () => stop.current?.();
  }, [listen]);

  const enableCompass = async () => {
    try {
      const res = await (DeviceOrientationEvent as IOSOrientation).requestPermission!();
      if (res !== 'granted') return setSensor('denied');
      setSensor('checking');
      stop.current = listen();
    } catch {
      setSensor('denied');
    }
  };

  const bearing = loc ? qiblaBearing(loc.lat, loc.lng) : null;
  const distance = loc ? qiblaDistance(loc.lat, loc.lng) : null;
  const declination = loc ? magneticDeclination(loc.lat, loc.lng, now) : 0;
  const live = sensor === 'active' && heading != null;
  // the sensor reports magnetic north; the Qibla bearing is from true north
  const trueHeading = live ? heading! + declination : 0;
  const offset = live && bearing != null ? turn(norm(trueHeading), bearing) : null;
  const aligned = offset != null && Math.abs(offset) <= ALIGN_TOLERANCE;
  const sun = loc ? sunPosition(loc.lat, loc.lng, now) : null;
  const sunUp = sun != null && sun.elevation > 0;

  useEffect(() => {
    if (aligned && !wasAligned.current) navigator.vibrate?.(60);
    wasAligned.current = aligned;
  }, [aligned]);

  let hint: string;
  if (bearing == null) hint = 'Finding your location…';
  else if (!live) hint = `Face ${Math.round(bearing)}° ${cardinal(bearing)} — measured clockwise from north.`;
  else if (aligned) hint = 'You are facing the Qibla';
  else hint = `Turn ${offset! > 0 ? 'right' : 'left'} ${Math.abs(Math.round(offset!))}°`;

  const next = days ? upcomingPrayers(days, now)[0] : undefined;
  const todayTimes = days?.find(d => d.date === today);

  let sunGuide = '';
  if (sun && bearing != null) {
    const fromSun = turn(sun.azimuth, bearing);
    if (!sunUp) sunGuide = 'The sun is below the horizon right now. Use the compass, or come back in daylight.';
    else if (Math.abs(fromSun) <= 5) sunGuide = 'The sun is in the Qibla direction right now — simply face the sun.';
    else sunGuide = `Face the sun, then turn ${fromSun > 0 ? 'right' : 'left'} ${Math.abs(Math.round(fromSun))}°. The sun is at ${Math.round(sun.azimuth)}° ${cardinal(sun.azimuth)}, ${Math.round(sun.elevation)}° above the horizon.`;
  }
  const kaabaSun = nextSunOverKaaba(now);
  const kaabaSunVisible = loc ? sunPosition(loc.lat, loc.lng, kaabaSun).elevation > 0 : false;

  return (
    <div className="qb">
      <div className="qb-wrap">
        <header className="qb-head">
          <p className="qb-ar" lang="ar">القبلة</p>
          <h1>Qibla Compass</h1>
          <p>Find the direction of the Kaaba in Makkah from wherever you are.</p>
        </header>

        <section className={`qb-card qb-compass${aligned ? ' is-aligned' : ''}`}>
          <div className="qb-dial-wrap">
            <span className="qb-pointer" aria-hidden="true" />
            <svg
              className="qb-dial"
              viewBox="0 0 300 300"
              style={{ transform: `rotate(${-trueHeading}deg)` }}
              role="img"
              aria-label={bearing != null ? `Qibla is ${Math.round(bearing)} degrees from north` : 'Compass'}
            >
              <circle cx="150" cy="150" r="146" className="qb-rim" />
              {TICKS.map(a => (
                <line
                  key={a}
                  x1="150" y1={a % 30 === 0 ? 14 : 18} x2="150" y2="26"
                  className={a % 30 === 0 ? 'qb-tick major' : 'qb-tick'}
                  transform={`rotate(${a} 150 150)`}
                />
              ))}
              {LETTERS.map(({ a, t }) => (
                <text key={t} x="150" y="48" className={t === 'N' ? 'qb-letter north' : 'qb-letter'} transform={`rotate(${a} 150 150)`}>
                  {t}
                </text>
              ))}
              {sunUp && (
                <g transform={`rotate(${sun!.azimuth} 150 150)`}>
                  <circle cx="150" cy="104" r="8" className="qb-sun" />
                  <circle cx="150" cy="104" r="12" className="qb-sun-ring" />
                </g>
              )}
              {bearing != null && (
                <g transform={`rotate(${bearing} 150 150)`}>
                  <line x1="150" y1="150" x2="150" y2="78" className="qb-needle" />
                  <g transform="translate(150 66)">
                    <g transform={`rotate(${-bearing + trueHeading})`}>
                      <rect x="-13" y="-13" width="26" height="26" rx="3" className="qb-kaaba" />
                      <rect x="-13" y="-6" width="26" height="4" className="qb-kaaba-band" />
                    </g>
                  </g>
                </g>
              )}
              <circle cx="150" cy="150" r="7" className="qb-hub" />
            </svg>
          </div>

          <p className="qb-hint" aria-live="polite">{hint}</p>

          {sensor === 'needs-permission' && (
            <button className="qb-btn primary" onClick={enableCompass}>Enable live compass</button>
          )}
          {sensor === 'denied' && (
            <p className="qb-note">Motion access was declined. Reload the page to ask again, or use the bearing above with a physical compass.</p>
          )}
          {sensor === 'unsupported' && (
            <p className="qb-note">No compass sensor found on this device. The dial shows north at the top — open this page on your phone for a live compass.</p>
          )}
          {live && (
            <p className="qb-note">Hold your phone flat, away from metal and magnets. If it seems off, move it in a figure-8 to calibrate.</p>
          )}
        </section>

        <section className="qb-stats">
          <div>
            <p>Qibla direction</p>
            <b>{bearing != null ? `${bearing.toFixed(1)}°` : '—'}</b>
            <span>{bearing != null ? `${cardinal(bearing)} from true north` : ' '}</span>
          </div>
          <div>
            <p>Distance to Kaaba</p>
            <b>{distance != null ? `${Math.round(distance).toLocaleString()} km` : '—'}</b>
            <span>Great-circle distance</span>
          </div>
          <div>
            <p>Magnetic declination</p>
            <b>{loc ? eastWest(declination) : '—'}</b>
            <span>
              {!loc ? ' '
                : live ? 'Corrected automatically'
                : `Handheld compass: face ${norm(bearing! - declination).toFixed(0)}°`}
            </span>
          </div>
          <div>
            <p>Your location</p>
            <b className="qb-place">{loc?.name ?? '—'}</b>
            <span>{loc ? SOURCE_LABEL[loc.source] : ' '}</span>
          </div>
        </section>

        {loc?.source !== 'gps' && (
          <div className="qb-card qb-locate">
            <p>Using an approximate location. For the most accurate direction, use your device&apos;s GPS.</p>
            <button className="qb-btn" onClick={locatePrecisely} disabled={locating}>
              {locating ? 'Locating…' : 'Use precise location'}
            </button>
            {locError && <p className="qb-error">{locError}</p>}
          </div>
        )}

        <section className="qb-card qb-prayer" aria-label="Next prayer">
          <h2>Next prayer</h2>
          {next ? (
            <div className="qb-next">
              <div>
                <b>{next.name}</b> <span lang="ar" dir="rtl">{PRAYER_AR[next.name]}</span>
              </div>
              <p>at <b>{to12h(next.at)}</b> · in <b>{countdown(+next.at - +now)}</b></p>
            </div>
          ) : (
            <p className="qb-muted">{loc ? 'Loading prayer times…' : 'Finding your location…'}</p>
          )}
          {todayTimes && (
            <ul className="qb-times">
              {PRAYER_KEYS.map(p => {
                const at = prayerDate(todayTimes, p);
                return (
                  <li key={p} className={next && +next.at === +at ? 'is-next' : at < now ? 'is-past' : ''}>
                    <span>{p}</span>
                    <b>{to12h(at)}</b>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="qb-card qb-sunbox" aria-label="Find the Qibla with the sun">
          <h2>Find it with the sun</h2>
          <p>{sunGuide || 'Finding your location…'}</p>
          {sunUp && <p className="qb-muted">The sun is also marked on the dial above.</p>}
          <div className="qb-rasd">
            <p>
              <b>Sun over the Kaaba:</b> on{' '}
              {kaabaSun.toLocaleDateString('en', { day: 'numeric', month: 'long' })} at {to12h(kaabaSun)} your time,
              the sun is directly above the Kaaba.{' '}
              {kaabaSunVisible
                ? 'Face the sun at that moment — your shadow will point straight behind you, away from the Qibla.'
                : 'It will be below your horizon then, so this method won’t work from your location on that day.'}
            </p>
          </div>
        </section>

        {loc && (
          <section className="qb-card qb-mapbox" aria-label="Map">
            <h2>On the map</h2>
            <QiblaMap lat={loc.lat} lng={loc.lng} />
            <p className="qb-muted">The dashed line is the shortest path over the Earth&apos;s surface — the direction you face to pray.</p>
          </section>
        )}

        <Link href="/mosques" className="qb-card qb-mosques">
          <span className="material-symbols-outlined" aria-hidden="true">mosque</span>
          <span><b>Mosques near you</b><small>Find a mosque nearby and get directions</small></span>
          <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
        </Link>
      </div>
    </div>
  );
}
