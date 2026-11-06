'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import GoogleMapEmbed, { openUrl } from './GoogleMapEmbed';
import './mosques.css';

type Phase = 'boot' | 'intro' | 'locating' | 'ready';
interface LatLng { lat: number; lng: number }

function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ''}`} aria-hidden="true">{name}</span>;
}

function locate(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return reject(new Error('This browser can’t detect your location. Type your area instead.'));
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(new Error(
        err.code === err.PERMISSION_DENIED
          ? 'Location access is blocked. Allow it from the lock icon in the address bar, or type your area instead.'
          : err.code === err.POSITION_UNAVAILABLE
            ? 'Your location is unavailable — location services may be turned off on this device.'
            : 'Finding your location took too long. Try again, or type your area.',
      )),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2 * 60 * 1000 },
    );
  });
}

/** Already granted? Then the intro can be skipped. Never prompts. */
async function locationGranted() {
  try {
    return (await navigator.permissions?.query({ name: 'geolocation' as PermissionName }))?.state === 'granted';
  } catch {
    return false;
  }
}

/** Google's map searches by place name, so a GPS position becomes "Anjanapura, Bengaluru" first */
async function areaName(p: LatLng): Promise<string | null> {
  try {
    const res = await fetch(`/api/geocode?lat=${p.lat}&lng=${p.lng}`);
    if (!res.ok) return null;
    return ((await res.json()) as { area?: string }).area ?? null;
  } catch {
    return null;
  }
}

/** Kept in memory only, so coming back to the page doesn't ask again; never written to storage */
let lastPlace: { name: string; fromGps: boolean } | null = null;

export default function NearbyMosques() {
  const [phase, setPhase] = useState<Phase>('boot');
  const [place, setPlace] = useState<{ name: string; fromGps: boolean } | null>(null);
  /** located, but the area couldn't be named — the user types it */
  const [needsArea, setNeedsArea] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const show = (p: { name: string; fromGps: boolean }) => {
    lastPlace = p;
    setPlace(p);
    setNeedsArea(false);
    setText(p.name);
    setPhase('ready');
  };

  const findMe = useCallback(async () => {
    setLocating(true);
    setLocError('');
    setPhase(p => (p === 'ready' ? p : 'locating'));
    try {
      const name = await areaName(await locate());
      if (name) show({ name, fromGps: true });
      else {
        setPlace(null);
        setNeedsArea(true);
        setPhase('ready');
        window.setTimeout(() => inputRef.current?.focus(), 50);
      }
    } catch (e) {
      setLocError((e as Error).message);
      setPhase(p => (p === 'ready' ? p : 'intro'));
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    if (lastPlace) { show(lastPlace); return; }
    locationGranted().then(granted => (granted ? findMe() : setPhase('intro')));
  }, [findMe]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = text.trim();
    if (name) show({ name, fromGps: false });
  };

  // search as soon as the user pauses typing, so the map never waits on the Search button
  useEffect(() => {
    const name = text.trim();
    if (name.length < 3 || name === place?.name) return;
    const t = window.setTimeout(() => show({ name, fromGps: false }), 900);
    return () => window.clearTimeout(t);
  }, [text, place?.name]);

  const form = (
    <form className="mq-search" onSubmit={submit} role="search">
      <Icon name="search" className="mq-search-icon" />
      <input
        ref={inputRef}
        type="search"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Area, city or postcode"
        aria-label="Find mosques in an area, city or postcode"
        enterKeyHint="search"
      />
      <button type="submit" className="mq-btn primary" disabled={!text.trim()}>Search</button>
    </form>
  );

  const nearMe = (
    <a className="mq-btn" href={openUrl()} target="_blank" rel="noopener noreferrer">
      <Icon name="near_me" /> Nearest to my exact location
    </a>
  );

  if (phase === 'boot' || phase === 'locating') {
    return (
      <div className="mq">
        <div className="mq-center" role="status">
          <span className="mq-spinner" aria-hidden="true" />
          <p>{phase === 'locating' ? 'Finding your area…' : 'Loading…'}</p>
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
            To find your area, we need your location. It&apos;s used once to look up your area&apos;s name with Google,
            and we don&apos;t save it.
          </p>
          <button type="button" className="mq-btn primary lg" onClick={findMe} disabled={locating}>
            <Icon name="my_location" /> Use my location
          </button>
          {locError && <p className="mq-alert" role="alert">{locError}</p>}
          <p className="mq-or">or type your area, city or postcode</p>
          {form}
        </section>
      </div>
    );
  }

  return (
    <div className="mq">
      <div className="mq-wrap">
        <header className="mq-head">
          <p className="mq-ar" lang="ar">المساجد القريبة</p>
          <h1>Mosques Near You</h1>
        </header>

        <div className="mq-locbar">
          <Icon name={place?.fromGps ? 'my_location' : 'location_on'} />
          <div className="mq-locbar-text">
            <small>{place ? (place.fromGps ? 'Your area' : 'Showing mosques in') : 'Your area'}</small>
            <b>{place?.name ?? 'Type your area below'}</b>
          </div>
          <button type="button" className="mq-btn sm" onClick={findMe} disabled={locating} aria-label="Use my current location">
            <Icon name={locating ? 'progress_activity' : 'my_location'} className={locating ? 'mq-spin' : ''} />
            <span className="mq-hide-xs">Use my location</span>
          </button>
        </div>
        {locError && <p className="mq-alert" role="alert">{locError}</p>}

        {form}

        {place ? (
          <>
            <div className="mq-mapcol">
              <GoogleMapEmbed place={place.name} />
            </div>
            <div className="mq-actions">
              <a className="mq-btn primary lg" href={openUrl(place.name)} target="_blank" rel="noopener noreferrer">
                <Icon name="list" /> See the list in Google Maps
              </a>
              {nearMe}
            </div>
            <p className="mq-small">
              Tap a mosque on the map for its details, photos and directions. Not quite your area? Type a nearby
              locality above for closer results.
            </p>
          </>
        ) : (
          <div className="mq-prompt" role="status">
            <Icon name="edit_location_alt" />
            <p>
              {needsArea ? 'We found your location, but couldn’t name your area.' : 'Choose an area to see mosques.'}{' '}
              Type your area or locality above (for example “Anjanapura, Bengaluru”) to see its mosques on the map — or
              open Google Maps to see the mosques nearest your exact location.
            </p>
            {nearMe}
          </div>
        )}

        <footer className="mq-foot">
          <p>Map and mosque results: Google Maps.</p>
        </footer>
      </div>
    </div>
  );
}
