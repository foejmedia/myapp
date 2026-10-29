'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ATTRIBUTION, FACILITIES, displayName, distanceKm, formatDistance, links, type Mosque } from '@/lib/mosques';
import { LocationError, fetchMosque, locate, session, type LatLng } from './client';
import GoogleMapEmbed from './GoogleMapEmbed';
import { CommunityBadge, Icon } from './MosqueCard';
import './mosques.css';

const TIMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
interface AreaTimes { times: Record<(typeof TIMES)[number], string>; method: string; date: string }

function to12h(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
}

/** General times for the mosque's coordinates — clearly not the mosque's own jamaat schedule */
async function areaTimes(m: Mosque, signal: AbortSignal): Promise<AreaTimes> {
  const d = new Date();
  const res = await fetch(
    `https://api.aladhan.com/v1/timings/${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}?latitude=${m.lat}&longitude=${m.lng}`,
    { signal },
  );
  if (!res.ok) throw new Error('times');
  const json = await res.json() as { data: { timings: Record<string, string>; date: { readable: string }; meta: { method?: { name?: string } } } };
  const times = {} as AreaTimes['times'];
  TIMES.forEach(t => { times[t] = json.data.timings[t].split(' ')[0]; });
  return { times, method: json.data.meta.method?.name ?? 'regional default method', date: json.data.date.readable };
}

export default function MosqueDetails({ id }: { id: string }) {
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [locMsg, setLocMsg] = useState('');
  const [locating, setLocating] = useState(false);
  const [times, setTimes] = useState<AreaTimes | null>(null);
  const [timesFailed, setTimesFailed] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    // show what the list already knew right away, then load the full record
    const known = session.data?.mosques.find(m => m.id === id);
    if (known) setMosque(known);
    setUserPos(session.userPos);
    const ctrl = new AbortController();
    setError('');
    fetchMosque(id, ctrl.signal)
      .then(setMosque)
      .catch(e => { if (!ctrl.signal.aborted && !known) setError((e as Error).message); });
    return () => ctrl.abort();
  }, [id, attempt]);

  const lat = mosque?.lat, lng = mosque?.lng;
  useEffect(() => {
    if (!mosque) return;
    const ctrl = new AbortController();
    areaTimes(mosque, ctrl.signal).then(setTimes).catch(() => { if (!ctrl.signal.aborted) setTimesFailed(true); });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  const showDistance = async () => {
    setLocating(true);
    setLocMsg('');
    try {
      const p = await locate();
      session.userPos = p;
      setUserPos(p);
    } catch (e) {
      setLocMsg(e instanceof LocationError ? e.message : 'Could not get your location.');
    } finally {
      setLocating(false);
    }
  };

  if (error) {
    return (
      <div className="mq">
        <div className="mq-wrap narrow">
          <Link href="/mosques" className="mq-back"><Icon name="arrow_back" /> Nearby mosques</Link>
          <div className="mq-state" role="alert">
            <Icon name="error" />
            <p>{error}</p>
            <button type="button" className="mq-btn primary" onClick={() => setAttempt(a => a + 1)}>Try again</button>
          </div>
        </div>
      </div>
    );
  }

  if (!mosque) {
    return (
      <div className="mq">
        <div className="mq-center" role="status"><span className="mq-spinner" aria-hidden="true" /><p>Loading mosque…</p></div>
      </div>
    );
  }

  const m = mosque;
  const name = displayName(m);
  const dist = userPos ? distanceKm(userPos.lat, userPos.lng, m.lat, m.lng) : null;
  const known = FACILITIES.filter(f => m.facilities[f.key] !== undefined);
  const contact = m.phone || m.website || m.facebook || m.email;

  return (
    <div className="mq">
      <div className="mq-wrap narrow">
        <Link href="/mosques" className="mq-back"><Icon name="arrow_back" /> Nearby mosques</Link>

        <section className="mq-hero">
          {m.image && !imgFailed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="mq-hero-img" src={m.image} alt={`Photo of ${name}`} onError={() => setImgFailed(true)} />
          )}
          <div className="mq-hero-body">
            <CommunityBadge />
            <h1 className={m.name ? '' : 'is-unnamed'}>{name}</h1>
            {m.nameAr && <p className="mq-hero-ar" lang="ar" dir="rtl">{m.nameAr}</p>}
            {m.denomination && <p className="mq-tag">{m.denomination}</p>}

            <p className="mq-hero-dist">
              {dist != null ? (
                <><Icon name="near_me" /> <b>{formatDistance(dist)}</b> from you (straight line)</>
              ) : (
                <button type="button" className="mq-link" onClick={showDistance} disabled={locating}>
                  <Icon name="my_location" /> {locating ? 'Finding you…' : 'Show distance from me'}
                </button>
              )}
            </p>
            {locMsg && <p className="mq-alert" role="alert">{locMsg}</p>}

            <div className="mq-hero-actions">
              <a className="mq-btn primary lg" href={links.google(m)} target="_blank" rel="noopener noreferrer">
                <Icon name="directions" /> Directions in Google Maps
              </a>
              <a className="mq-btn" href={links.googleView(m)} target="_blank" rel="noopener noreferrer"><Icon name="map" /> Open in Google Maps</a>
              <a className="mq-btn" href={links.apple(m)} target="_blank" rel="noopener noreferrer">Apple Maps</a>
              <a className="mq-btn" href={links.osmDirections(m)} target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
            </div>
          </div>
        </section>

        <section className="mq-sec" aria-labelledby="mq-ov">
          <h2 id="mq-ov">Overview</h2>
          <dl className="mq-dl">
            <div>
              <dt><Icon name="location_on" /> Address</dt>
              <dd>
                {m.address ?? 'No street address has been mapped for this mosque.'}
                {m.addressApprox && <small>Approximate — looked up from the map position, not recorded by the mosque.</small>}
              </dd>
            </div>
            {m.openingHours && (
              <div>
                <dt><Icon name="schedule" /> Opening hours</dt>
                <dd><code>{m.openingHours}</code><small>As mapped on OpenStreetMap.</small></dd>
              </div>
            )}
            {m.phone && (
              <div><dt><Icon name="call" /> Phone</dt><dd><a href={`tel:${m.phone.replace(/[^\d+]/g, '')}`}>{m.phone}</a></dd></div>
            )}
            {m.website && (
              <div><dt><Icon name="language" /> Website</dt><dd><a href={m.website} target="_blank" rel="noopener noreferrer">{new URL(m.website).hostname}</a></dd></div>
            )}
            {m.facebook && (
              <div><dt><Icon name="share" /> Facebook</dt><dd><a href={m.facebook} target="_blank" rel="noopener noreferrer">Facebook page</a></dd></div>
            )}
            {m.email && (
              <div><dt><Icon name="mail" /> Email</dt><dd><a href={`mailto:${m.email}`}>{m.email}</a></dd></div>
            )}
            {!contact && (
              <div><dt><Icon name="contact_support" /> Contact</dt><dd>No public contact details have been mapped.</dd></div>
            )}
          </dl>
          <GoogleMapEmbed center={m} place className="mq-map-detail" title={`Google Maps: location of ${name}`} />
        </section>

        <section className="mq-sec" aria-labelledby="mq-pt">
          <h2 id="mq-pt">Prayer timings</h2>
          <p className="mq-callout">
            <Icon name="info" />
            <span>
              This mosque&apos;s own congregation (jamaat) and Jumu&apos;ah times aren&apos;t available from a verified source.
              Please confirm them with the mosque{m.phone ? ' by phone' : ''}.
            </span>
          </p>
          <h3 className="mq-h3">Prayer times for this location</h3>
          {times ? (
            <>
              <ul className="mq-times">
                {TIMES.map(t => (
                  <li key={t} className={t === 'Sunrise' ? 'is-sunrise' : ''}><span>{t}</span><b>{to12h(times.times[t])}</b></li>
                ))}
              </ul>
              <p className="mq-small">
                {times.date} · Calculated for the mosque&apos;s coordinates by Aladhan ({times.method}). These are the
                start of each prayer&apos;s time, not when the congregation begins.
              </p>
            </>
          ) : timesFailed ? (
            <p className="mq-small">Prayer times couldn&apos;t be loaded right now.</p>
          ) : (
            <div className="mq-skel short" aria-busy="true" />
          )}
        </section>

        <section className="mq-sec" aria-labelledby="mq-fac">
          <h2 id="mq-fac">Facilities</h2>
          {known.length ? (
            <ul className="mq-faclist">
              {known.map(f => {
                const yes = m.facilities[f.key] === true;
                const label = f.key === 'wheelchair' && m.wheelchair === 'limited' ? 'Limited wheelchair access' : f.label;
                return (
                  <li key={f.key} className={yes ? 'yes' : 'no'}>
                    <Icon name={f.icon} /> {label}
                    <span className="mq-sr">{yes ? 'available' : 'not available'}</span>
                    <Icon name={yes ? 'check_circle' : 'cancel'} className="mq-fac-state" />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mq-small">No facility information has been mapped for this mosque yet.</p>
          )}
        </section>

        <section className="mq-sec" aria-labelledby="mq-help">
          <h2 id="mq-help">Is something wrong or missing?</h2>
          <p className="mq-small">
            This listing comes from OpenStreetMap, a free map edited by volunteers. Corrections made there reach this
            app and many others. Reports are reviewed by local mappers.
          </p>
          <div className="mq-hero-actions">
            <a className="mq-btn" href={links.report(m)} target="_blank" rel="noopener noreferrer"><Icon name="flag" /> Report a problem</a>
            <a className="mq-btn" href={links.osmEdit(m)} target="_blank" rel="noopener noreferrer"><Icon name="edit" /> Edit details</a>
            <a className="mq-btn" href={links.osmView(m)} target="_blank" rel="noopener noreferrer">View source record</a>
          </div>
        </section>

        <footer className="mq-foot">
          <p>Mosque data: {ATTRIBUTION}. Community-mapped; not verified by the mosque.</p>
        </footer>
      </div>
    </div>
  );
}
