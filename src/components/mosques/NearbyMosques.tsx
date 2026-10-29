'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ATTRIBUTION, FACILITIES, RADII_KM, distanceKm, links, type FacilityKey, type NearbyResponse,
} from '@/lib/mosques';
import {
  LocationError, fetchNearby, locate, locationGranted, nearbyKey, session, type LatLng, type Origin, type Place,
} from './client';
import GoogleMapEmbed from './GoogleMapEmbed';
import MosqueCard, { Icon } from './MosqueCard';
import SearchBox from './SearchBox';
import './mosques.css';

type Phase = 'boot' | 'intro' | 'locating' | 'ready';
type Sort = 'distance' | 'name' | 'info';
const PAGE = 30;

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N} ]/gu, '');

export default function NearbyMosques() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('boot');
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [radius, setRadius] = useState(5);
  const [data, setData] = useState<NearbyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  /** mobile only; the map shows Google's results, so it leads */
  const [view, setView] = useState<'list' | 'map'>('map');
  const [filters, setFilters] = useState<Set<FacilityKey>>(new Set());
  const [sort, setSort] = useState<Sort>('distance');
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [reload, setReload] = useState(0);
  const [slow, setSlow] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const chooseOrigin = useCallback((o: Origin) => {
    setOrigin(o);
    setShown(PAGE);
    setPhase('ready');
  }, []);

  const findMe = useCallback(async () => {
    setLocating(true);
    setLocError('');
    setPhase(p => (p === 'ready' ? p : 'locating'));
    try {
      const pos = await locate();
      setUserPos(pos);
      chooseOrigin({ ...pos, label: 'Your current location', kind: 'gps' });
    } catch (e) {
      setLocError(e instanceof LocationError ? e.message : 'Could not get your location.');
      setPhase(p => (p === 'ready' ? p : 'intro'));
    } finally {
      setLocating(false);
    }
  }, [chooseOrigin]);

  // restore after visiting a mosque page, else skip the intro if location was granted before
  useEffect(() => {
    if (session.origin) {
      setOrigin(session.origin);
      setUserPos(session.userPos);
      setRadius(session.radius);
      if (session.data) setData(session.data);
      setPhase('ready');
      return;
    }
    locationGranted().then(granted => (granted ? findMe() : setPhase('intro')));
  }, [findMe]);

  useEffect(() => {
    session.origin = origin;
    session.userPos = userPos;
    session.radius = radius;
  }, [origin, userPos, radius]);

  useEffect(() => {
    if (!origin) return;
    const key = nearbyKey(origin, radius);
    if (session.data && session.dataKey === key) { setData(session.data); return; }
    const ctrl = new AbortController();
    setLoading(true);
    setError('');
    setSlow(false);
    const slowTimer = window.setTimeout(() => setSlow(true), 6000);
    fetchNearby(origin, radius, ctrl.signal)
      .then(d => { session.data = d; session.dataKey = key; setData(d); })
      .catch(e => { if (!ctrl.signal.aborted) setError((e as Error).message); })
      .finally(() => { window.clearTimeout(slowTimer); if (!ctrl.signal.aborted) setLoading(false); });
    return () => { window.clearTimeout(slowTimer); ctrl.abort(); };
  }, [origin, radius, reload]);

  const retry = () => { session.dataKey = ''; setReload(r => r + 1); };

  const pickPlace = (p: Place) => {
    setQuery('');
    chooseOrigin({ lat: p.lat, lng: p.lng, label: p.detail ? `${p.label}, ${p.detail}` : p.label, kind: 'place' });
  };

  // ---------- derived ----------
  const ref = userPos ?? origin;
  const distanceFrom = userPos ? 'from you' : origin?.kind === 'place' ? `from ${origin.label.split(',')[0]}` : 'from map centre';

  const items = useMemo(
    () => (data?.mosques ?? []).map(m => ({ m, d: ref ? distanceKm(ref.lat, ref.lng, m.lat, m.lng) : null })),
    [data, ref],
  );
  // a filter is offered only when at least one loaded mosque has that facility mapped
  const available = useMemo(() => FACILITIES.filter(f => items.some(x => x.m.facilities[f.key] === true)), [items]);
  const active = available.filter(f => filters.has(f.key)).map(f => f.key);
  const q = norm(query.trim());

  const visible = useMemo(() => {
    const list = items.filter(x =>
      active.every(k => x.m.facilities[k] === true) && (!q || norm(`${x.m.name ?? ''} ${x.m.nameAr ?? ''}`).includes(q)));
    const byName = (a: string | null, b: string | null) => (a && b ? a.localeCompare(b) : a ? -1 : b ? 1 : 0);
    if (sort === 'name') list.sort((a, b) => byName(a.m.name, b.m.name));
    else if (sort === 'info') list.sort((a, b) => b.m.richness - a.m.richness);
    else list.sort((a, b) => (a.d ?? 0) - (b.d ?? 0));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, active.join(), q, sort]);

  const nameMatches = q ? visible.filter(x => x.m.name && norm(x.m.name).includes(q)).map(x => x.m) : [];
  const googleArea = origin ? links.googleArea(origin.lat, origin.lng) : '';

  const toggleFilter = (k: FacilityKey) => setFilters(s => {
    const n = new Set(s);
    if (n.has(k)) n.delete(k); else n.add(k);
    return n;
  });

  const changeArea = () => searchRef.current?.focus();

  // ---------- screens ----------
  if (phase === 'boot' || phase === 'locating') {
    return (
      <div className="mq">
        <div className="mq-center" role="status">
          <span className="mq-spinner" aria-hidden="true" />
          <p>{phase === 'locating' ? 'Finding your location…' : 'Loading…'}</p>
        </div>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="mq">
        <section className="mq-intro">
          <span className="mq-intro-icon"><Icon name="mosque" /></span>
          <p className="mq-ar" lang="ar">المساجد القريبة</p>
          <h1>Mosques Near You</h1>
          <p className="mq-intro-why">
            To show mosques around you, we need your location. It isn&apos;t saved. It&apos;s used to show your area on
            Google Maps and, rounded to about 100&nbsp;m, to search our mosque list.
          </p>
          <button type="button" className="mq-btn primary lg" onClick={findMe} disabled={locating}>
            <Icon name="my_location" /> Use my location
          </button>
          {locError && <p className="mq-alert" role="alert">{locError}</p>}
          <p className="mq-or">or search for a city, area or postcode</p>
          <SearchBox ref={searchRef} value={query} onChange={setQuery} onPickPlace={pickPlace} placeholder="Search a city, area or postcode" />
        </section>
      </div>
    );
  }

  const empty = !loading && !error && data && visible.length === 0;
  const nextRadius = RADII_KM.find(r => r > radius);

  return (
    <div className="mq">
      <div className="mq-wrap">
        <header className="mq-head">
          <p className="mq-ar" lang="ar">المساجد القريبة</p>
          <h1>Mosques Near You</h1>
        </header>

        <div className="mq-locbar">
          <Icon name={origin?.kind === 'gps' ? 'my_location' : 'location_on'} />
          <div className="mq-locbar-text">
            <small>Searching near</small>
            <b>{origin?.label}</b>
          </div>
          <button type="button" className="mq-btn sm" onClick={findMe} disabled={locating} aria-label="Refresh my current location">
            <Icon name={locating ? 'progress_activity' : 'my_location'} className={locating ? 'mq-spin' : ''} />
            <span className="mq-hide-xs">{userPos ? 'Refresh' : 'Use my location'}</span>
          </button>
        </div>
        {locError && <p className="mq-alert" role="alert">{locError}</p>}

        <SearchBox
          ref={searchRef}
          value={query}
          onChange={v => { setQuery(v); setShown(PAGE); }}
          mosqueMatches={nameMatches}
          onPickMosque={m => router.push(`/mosques/${m.id}`)}
          onPickPlace={pickPlace}
          bias={origin}
          placeholder="Search mosque name, city, area or postcode"
        />

        <div className="mq-chips" role="group" aria-label="Search radius">
          {RADII_KM.map(r => (
            <button
              key={r}
              type="button"
              className={`mq-chip${r === radius ? ' is-on' : ''}`}
              aria-pressed={r === radius}
              onClick={() => { setRadius(r); setShown(PAGE); }}
            >
              {r} km
            </button>
          ))}
          {available.map(f => (
            <button
              key={f.key}
              type="button"
              className={`mq-chip fac${filters.has(f.key) ? ' is-on' : ''}`}
              aria-pressed={filters.has(f.key)}
              onClick={() => toggleFilter(f.key)}
            >
              <Icon name={f.icon} /> {f.label}
            </button>
          ))}
        </div>

        <div className="mq-toolbar">
          <p className="mq-count" aria-live="polite">
            {loading ? 'Searching…' : data ? `${visible.length} listed ${visible.length === 1 ? 'mosque' : 'mosques'} within ${radius} km` : ''}
          </p>
          <label className="mq-sort">
            <span>Sort</span>
            <select value={sort} onChange={e => setSort(e.target.value as Sort)}>
              <option value="distance">Nearest</option>
              <option value="name">Name (A–Z)</option>
              <option value="info">Most information</option>
            </select>
          </label>
          <div className="mq-toggle" role="tablist" aria-label="View">
            <button type="button" role="tab" aria-selected={view === 'list'} onClick={() => setView('list')}><Icon name="list" /> List</button>
            <button type="button" role="tab" aria-selected={view === 'map'} onClick={() => setView('map')}><Icon name="map" /> Map</button>
          </div>
        </div>

        {data?.partial && (
          <p className="mq-notice" role="status">
            The full map service is busy, so this is a <b>partial list</b> — only mosques with “mosque” or “masjid” in their
            name. The Google map shows everything Google knows about.{' '}
            <button type="button" className="mq-link" onClick={retry}>Try the full search again</button>
          </p>
        )}
        {data?.stale && (
          <p className="mq-notice" role="status">The map service is busy, so these results are from an earlier search and may be slightly out of date.</p>
        )}
        {data?.capped && (
          <p className="mq-notice">This area has more mosques than can be loaded at once. Choose a smaller radius to see them all.</p>
        )}
        {data && !data.capped && data.total > data.mosques.length && (
          <p className="mq-notice">Showing the nearest {data.mosques.length} of {data.total} mosques. Choose a smaller radius to narrow it down.</p>
        )}

        <div className={`mq-body view-${view}`}>
          <div className="mq-list">
            {error && (
              <div className="mq-state" role="alert">
                <Icon name="cloud_off" />
                <p>{error}</p>
                <button type="button" className="mq-btn primary" onClick={retry}>Try again</button>
              </div>
            )}
            {loading && slow && (
              <p className="mq-notice" role="status">The map data service is busy right now — this can take up to a minute.</p>
            )}
            {loading && !error && Array.from({ length: 3 }, (_, i) => <div key={i} className="mq-skel" aria-hidden="true" />)}
            {empty && (
              data!.total === 0 ? (
                <div className="mq-state">
                  <Icon name="mosque" />
                  <p>No mosques found nearby. Try increasing your search radius or selecting another location.</p>
                  <div className="mq-state-actions">
                    {nextRadius && (
                      <button type="button" className="mq-btn primary" onClick={() => setRadius(nextRadius)}>
                        Search {nextRadius} km
                      </button>
                    )}
                    <button type="button" className="mq-btn" onClick={changeArea}>Change search area</button>
                    <a className="mq-btn" href={googleArea} target="_blank" rel="noopener noreferrer"><Icon name="map" /> Search on Google Maps</a>
                  </div>
                </div>
              ) : (
                <div className="mq-state">
                  <Icon name="filter_alt_off" />
                  <p>No mosques match {q ? <>“{query.trim()}”</> : 'these filters'} within {radius} km.</p>
                  <button type="button" className="mq-btn" onClick={() => { setFilters(new Set()); setQuery(''); }}>Clear search and filters</button>
                </div>
              )
            )}
            {!loading && !error && visible.slice(0, shown).map(({ m, d }) => (
              <div key={m.id} id={`mq-card-${m.id}`}>
                <MosqueCard
                  mosque={m}
                  distanceKm={d}
                  distanceFrom={distanceFrom}
                />
              </div>
            ))}
            {!loading && !error && visible.length > shown && (
              <button type="button" className="mq-btn mq-more" onClick={() => setShown(s => s + PAGE)}>
                Show more ({visible.length - shown} left)
              </button>
            )}
          </div>

          <div className="mq-mapcol">
            {origin && <GoogleMapEmbed center={origin} radiusKm={radius} title={`Google Maps: mosques near ${origin.label}`} />}
            <a className="mq-map-open" href={googleArea} target="_blank" rel="noopener noreferrer">
              <Icon name="open_in_new" /> Open in Google Maps
            </a>
          </div>
        </div>

        <footer className="mq-foot">
          <p>
            Map: Google Maps. Mosque list: {ATTRIBUTION}, mapped by volunteers and not verified by the mosques, so
            details may be incomplete. Spotted a mistake? Open a mosque and choose
            “Report a problem”.
          </p>
          {data && <p>Updated {new Date(data.fetchedAt).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}.</p>}
        </footer>
      </div>
    </div>
  );
}
