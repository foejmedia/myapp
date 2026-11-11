'use client';
/**
 * Live Quran Radio, styled as a vintage valve radio: a glowing tuning dial with the
 * stations printed along the band, rotary knobs, push-button bands and a speaker grille.
 * Below the set is the "programme guide": shelves and lists of every station.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, type Category, type LiveResponse, type LiveStation } from '@/lib/radio/live';
import { Bars, Cover, Icon, Row, Tile, detail } from './parts';
import { Dial, Keys, Knob, Lamp, type Status } from './RadioSet';
import './LiveRadio.css';

type View = 'home' | 'all' | 'favourites' | Category;

const PAGE = 40;
const SHELF = 14;
const FAV_KEY = 'live-radio-favourites';
const RECENT_KEY = 'live-radio-recent';
const PREF_KEY = 'live-radio-prefs';

const readJson = <T,>(key: string, fallback: T): T => {
  try { return (JSON.parse(localStorage.getItem(key) ?? 'null') as T) ?? fallback; } catch { return fallback; }
};
const writeJson = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } };

/** Lower-case, accents and Arabic diacritics removed, for search */
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ًͯ-ٰٟ]/g, '');

const clock = (sec: number) => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(s).padStart(2, '0')}`;
};

const STATUS_TEXT: Record<Status, string> = {
  idle: '', connecting: 'Tuning…', playing: 'On air', paused: 'Standby', error: 'No signal',
};

/** Short band names for the push-buttons */
const KEY_LABEL: Record<Category, string> = { recitation: 'Recitation', translation: 'Translation', tafsir: 'Tafsir', station: 'World' };

/** true below `px` wide: the dial prints fewer names on phones */
function useNarrow(px = 640) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${px}px)`);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [px]);
  return narrow;
}

export default function LiveRadio() {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);

  const [view, setView] = useState<View>('home');
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [favs, setFavs] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<LiveStation | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [volume, setVolume] = useState(0.9);
  /** false on iPhone/iPad, where a page can't set the volume (only the hardware buttons can) */
  const [canVolume, setCanVolume] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [sheet, setSheet] = useState(false);
  /** the station the tuning knob is resting on mid-drag (played when released) */
  const [tune, setTune] = useState<number | null>(null);
  const listTop = useRef<HTMLDivElement>(null);
  const narrow = useNarrow();

  useEffect(() => {
    setFavs(readJson<string[]>(FAV_KEY, []));
    setRecent(readJson<string[]>(RECENT_KEY, []));
    const prefs = readJson<{ volume?: number }>(PREF_KEY, {});
    if (typeof prefs.volume === 'number') setVolume(prefs.volume);
    // iOS ignores writes to `volume` and reads back 1; the volume effect below sets the real level afterwards
    const a = audioRef.current;
    if (a) {
      a.volume = 0.5;
      if (Math.abs(a.volume - 0.5) > 0.01) setCanVolume(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoadError('');
    fetch('/api/radio/live', { signal: ctrl.signal })
      .then(async r => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(json.error ?? 'Live radio is unavailable right now.');
        setData(json as LiveResponse);
      })
      .catch(e => { if (!ctrl.signal.aborted) setLoadError(e instanceof TypeError ? 'You appear to be offline.' : (e as Error).message); });
    return () => ctrl.abort();
  }, [attempt]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    writeJson(PREF_KEY, { volume });
  }, [volume]);

  // listening time for the current connection
  useEffect(() => {
    if (status !== 'playing') return;
    const t = window.setInterval(() => setElapsed(e => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [status]);

  const stations = useMemo(() => data?.stations ?? [], [data]);
  const byId = useMemo(() => new Map(stations.map(s => [s.id, s])), [stations]);
  const byCategory = useMemo(() => {
    const m = new Map<Category, LiveStation[]>();
    for (const s of stations) m.set(s.category, [...(m.get(s.category) ?? []), s]);
    return m;
  }, [stations]);
  const favStations = useMemo(() => favs.map(id => byId.get(id)).filter((s): s is LiveStation => !!s), [favs, byId]);
  const recentStations = useMemo(() => recent.map(id => byId.get(id)).filter((s): s is LiveStation => !!s), [recent, byId]);

  const countries = useMemo(() => {
    const m = new Map<string, { name: string; n: number }>();
    for (const s of byCategory.get('station') ?? []) {
      if (!s.countryCode) continue;
      const e = m.get(s.countryCode) ?? { name: s.country ?? s.countryCode, n: 0 };
      m.set(s.countryCode, { ...e, n: e.n + 1 });
    }
    return [...m].sort((a, b) => b[1].n - a[1].n);
  }, [byCategory]);

  const q = norm(query.trim());
  /** what the track list shows: a search across everything, or one category */
  const listed = useMemo(() => {
    if (!q && view === 'home') return [];
    const base = q ? stations
      : view === 'all' ? stations
      : view === 'favourites' ? favStations
      : (byCategory.get(view as Category) ?? []).filter(s => !country || view !== 'station' || s.countryCode === country);
    return q ? base.filter(s => norm(`${s.name} ${s.nameAr ?? ''} ${s.country ?? ''}`).includes(q)) : base;
  }, [q, view, stations, favStations, byCategory, country]);

  /** the stations along the dial: what's listed, else the tuned station's band, else recitations */
  const band = useMemo(
    () => (listed.length ? listed : current ? byCategory.get(current.category) ?? stations : byCategory.get('recitation') ?? stations),
    [listed, current, byCategory, stations],
  );
  const bandIndex = current ? band.findIndex(s => s.id === current.id) : -1;
  useEffect(() => setTune(null), [band]);

  const toggleFav = (id: string) => setFavs(f => {
    const next = f.includes(id) ? f.filter(x => x !== id) : [id, ...f];
    writeJson(FAV_KEY, next);
    return next;
  });

  const open = (v: View) => {
    setView(v);
    setQuery('');
    setShown(PAGE);
    if (v !== 'station') setCountry('');
    if (v !== 'home') window.setTimeout(() => listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };

  // ---------- playback ----------

  const play = useCallback((s: LiveStation) => {
    const a = audioRef.current;
    if (!a) return;
    setCurrent(s);
    setStatus('connecting');
    setElapsed(0);
    setRecent(r => {
      const next = [s.id, ...r.filter(x => x !== s.id)].slice(0, 12);
      writeJson(RECENT_KEY, next);
      return next;
    });
    a.src = s.streamUrl;
    a.play().catch(() => setStatus(st => (st === 'connecting' ? 'error' : st)));
  }, []);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.removeAttribute('src');
    a.load(); // ends the download, not just the sound
    setStatus('idle');
  }, []);

  const pause = useCallback(() => { audioRef.current?.pause(); setStatus('paused'); }, []);

  const toggle = useCallback((s?: LiveStation) => {
    const target = s ?? current;
    if (!target) return;
    if (current?.id === target.id && (status === 'playing' || status === 'connecting')) pause();
    // reconnect rather than resume, so playback is live again instead of where it paused
    else play(target);
  }, [current, status, pause, play]);

  /** next/previous along the dial */
  const step = useCallback((dir: 1 | -1) => {
    if (!band.length) return;
    const i = current ? band.findIndex(s => s.id === current.id) : -1;
    play(band[(i + dir + band.length) % band.length]);
  }, [band, current, play]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.name,
      artist: current.nameAr ?? detail(current),
      album: 'Live Quran Radio',
      artwork: current.image ? [{ src: current.image, sizes: '512x512' }] : [],
    });
    navigator.mediaSession.setActionHandler('play', () => play(current));
    navigator.mediaSession.setActionHandler('pause', pause);
    navigator.mediaSession.setActionHandler('nexttrack', () => step(1));
    navigator.mediaSession.setActionHandler('previoustrack', () => step(-1));
  }, [current, play, pause, step]);

  // space bar plays/pauses, like a music app (not while typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.code !== 'Space' || !current || /INPUT|TEXTAREA|SELECT|BUTTON/.test(el.tagName)) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, toggle]);

  useEffect(() => () => stop(), [stop]);

  // ---------- render helpers ----------

  const isOn = (s: LiveStation) => current?.id === s.id;
  const playing = status === 'playing';
  const busy = status === 'playing' || status === 'connecting';
  /** what the dial readout shows: the station under the knob mid-drag, else the tuned one, else the first on the band */
  const shownStation = tune != null ? band[tune] ?? null : current ?? recentStations[0] ?? band[0] ?? null;
  /** where the needle rests: mid-drag position, else the tuned station, else (switched off) whatever the readout shows */
  const dialIndex = tune ?? (current ? bandIndex : shownStation ? band.findIndex(s => s.id === shownStation.id) : -1);

  /** `id` is where "See all" goes; recently played has no full list */
  const shelves: { id: View | null; title: string; list: LiveStation[] }[] = [
    { id: null, title: 'Recently played', list: recentStations },
    { id: 'favourites' as const, title: 'Your favourites', list: favStations },
    ...CATEGORIES.map(c => ({ id: c.id, title: c.label, list: byCategory.get(c.id) ?? [] })),
  ].filter(s => s.list.length);

  const keys: { id: View; label: string; n?: number }[] = [
    { id: 'home', label: 'Home' },
    ...(favStations.length ? [{ id: 'favourites' as const, label: 'Favourites', n: favStations.length }] : []),
    ...CATEGORIES.filter(c => byCategory.get(c.id)?.length).map(c => ({ id: c.id, label: KEY_LABEL[c.id], n: byCategory.get(c.id)!.length })),
    { id: 'all', label: 'All', n: stations.length },
  ];
  const listTitle = q ? `Results for “${query.trim()}”` : view === 'all' ? 'All stations' : view === 'favourites' ? 'Your favourites' : CATEGORIES.find(c => c.id === view)?.label ?? '';

  const playButton = (s: LiveStation, cls = '') => (
    <button type="button" className={`lr-bigplay ${cls}`} onClick={() => (status === 'error' && isOn(s) ? play(s) : toggle(s))}
      aria-label={isOn(s) && busy ? 'Pause' : 'Play'}>
      {isOn(s) && status === 'connecting' ? <span className="lr-spinner" /> : <Icon name={isOn(s) && busy ? 'pause' : 'play_arrow'} />}
    </button>
  );

  const liveLine = current && (
    <span className={`lr-liveline st-${status}`}>
      <span className="lr-livepill">{playing ? <><i className="lr-dot" /> ON AIR</> : STATUS_TEXT[status]}</span>
      <span className="lr-track"><i /></span>
      <span className="lr-elapsed" aria-label="Listening time">{clock(elapsed)}</span>
    </span>
  );

  const favButton = (s: LiveStation, cls = 'lr-iconbtn') => (
    <button type="button" className={`${cls}${favs.includes(s.id) ? ' is-fav' : ''}`} onClick={() => toggleFav(s.id)}
      aria-label={favs.includes(s.id) ? 'Remove from favourites' : 'Add to favourites'} aria-pressed={favs.includes(s.id)}>
      <Icon name="favorite" />
    </button>
  );

  return (
    <div className={`lr${current ? ' has-player' : ''}`}>
      <audio
        ref={audioRef}
        preload="none"
        onPlaying={() => setStatus('playing')}
        onWaiting={() => setStatus(s => (s === 'paused' ? s : 'connecting'))}
        onError={() => { if (audioRef.current?.getAttribute('src')) setStatus('error'); }}
      />

      <div className="lr-wrap">
        {/* ---------- the radio set ---------- */}
        <section className={`rd st-${status}`} aria-label={current ? 'Now playing' : 'Radio'}>
          <div className="rd-cabinet">
            <header className="rd-plate">
              <span className="rd-brand">Learn Quran</span>
              <span className="rd-model">Live Quran Radio · {data ? `${stations.length} stations` : 'loading'}</span>
            </header>

            <Dial band={band} index={dialIndex} status={tune != null ? 'connecting' : status} onTune={play} maxNames={narrow ? 6 : 12}>
              <Lamp status={tune != null ? 'connecting' : status} />
              <span className="rd-read-name">
                {shownStation ? (
                  <>
                    <b>{shownStation.name}</b>
                    <small>{shownStation.nameAr ? <span lang="ar" dir="rtl">{shownStation.nameAr}</span> : detail(shownStation)}</small>
                  </>
                ) : (
                  <b>{loadError ? 'No signal' : 'Warming up…'}</b>
                )}
              </span>
              <span className="rd-read-time" aria-label="Listening time">{current && status !== 'idle' ? clock(elapsed) : '--:--'}</span>
            </Dial>

            <div className="rd-face">
              <div className="rd-grille" aria-hidden="true">
                <Bars on={playing} big />
              </div>

              <div className="rd-panel">
                <Keys items={keys} on={q ? null : view} onPick={open} />
                <div className="rd-controls">
                  <Knob
                    label="Volume"
                    value={volume}
                    min={0}
                    max={1}
                    step={0.05}
                    nudge={0.1}
                    onChange={setVolume}
                    disabled={!canVolume}
                    readout={canVolume ? `${Math.round(volume * 100)}` : '—'}
                    hint={canVolume ? undefined : 'Use the phone’s buttons'}
                  />
                  <div className="rd-transport">
                    <button type="button" className="rd-step" onClick={() => step(-1)} aria-label="Previous station" disabled={!band.length}><Icon name="fast_rewind" /></button>
                    {shownStation ? playButton(shownStation) : <button type="button" className="lr-bigplay" disabled aria-label="Play"><Icon name="play_arrow" /></button>}
                    <button type="button" className="rd-step" onClick={() => step(1)} aria-label="Next station" disabled={!band.length}><Icon name="fast_forward" /></button>
                  </div>
                  <Knob
                    label="Tuning"
                    big
                    value={tune ?? Math.max(0, bandIndex)}
                    min={0}
                    max={Math.max(0, band.length - 1)}
                    degPerStep={12}
                    onChange={setTune}
                    onCommit={v => { if (band[v] && band[v].id !== current?.id) play(band[v]); setTune(null); }}
                    disabled={band.length < 2}
                    readout={band.length ? `${(tune ?? Math.max(0, bandIndex)) + 1} / ${band.length}` : '–'}
                  />
                </div>
                {shownStation && (
                  <div className="rd-extra">
                    {favButton(shownStation, 'rd-fav')}
                    {status === 'error' && <button type="button" className="lr-pill" onClick={() => step(1)}><Icon name="skip_next" /> Try next station</button>}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="rd-feet" aria-hidden="true"><i /><i /></div>
        </section>

        {/* ---------- programme guide ---------- */}
        <div className="lr-guide">
          <div className="lr-bar" ref={listTop}>
            <h2 className="lr-guide-title">Programme guide</h2>
            <label className="lr-search">
              <Icon name="search" />
              <input type="search" value={query} onChange={e => { setQuery(e.target.value); setShown(PAGE); }}
                placeholder="Find a reciter, station or country" aria-label="Search stations" />
            </label>
          </div>

          {data?.missing.length ? (
            <p className="lr-note" role="status"><Icon name="info" /> {data.missing.join(' and ')} couldn’t be reached, so some stations are missing for now.</p>
          ) : null}

          {loadError ? (
            <div className="lr-state" role="alert">
              <Icon name="wifi_off" />
              <h2>Couldn’t load live stations</h2>
              <p>{loadError}</p>
              <button type="button" className="lr-pill primary" onClick={() => setAttempt(a => a + 1)}><Icon name="refresh" /> Try again</button>
            </div>
          ) : !data ? (
            <div className="lr-shelf"><div className="lr-shelf-row">{Array.from({ length: 7 }, (_, i) => <span key={i} className="lr-tile-skel" />)}</div></div>
          ) : !q && view === 'home' ? (
            shelves.map(sh => (
              <section key={sh.title} className="lr-shelf" aria-label={sh.title}>
                <header>
                  <h2>{sh.title}</h2>
                  {sh.id && sh.list.length > 4 && <button type="button" className="lr-seeall" onClick={() => open(sh.id!)}>See all</button>}
                </header>
                <ul className="lr-shelf-row">
                  {sh.list.slice(0, SHELF).map(s => (
                    <Tile key={s.id} s={s} active={isOn(s)} playing={isOn(s) && playing} onPlay={() => toggle(s)} />
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <section className="lr-list" aria-label="Stations">
              <header className="lr-list-head">
                <h2>{listTitle}</h2>
                <span>{listed.length} station{listed.length === 1 ? '' : 's'}</span>
                {!q && view === 'station' && countries.length > 1 && (
                  <select className="lr-select" value={country} onChange={e => { setCountry(e.target.value); setShown(PAGE); }} aria-label="Country">
                    <option value="">All countries</option>
                    {countries.map(([cc, c]) => <option key={cc} value={cc}>{c.name} ({c.n})</option>)}
                  </select>
                )}
              </header>
              {listed.length === 0 ? (
                <div className="lr-state">
                  <Icon name="search_off" />
                  <h2>No stations found</h2>
                  <p>Try another search or band.</p>
                  <button type="button" className="lr-pill" onClick={() => open('home')}>Back to home</button>
                </div>
              ) : (
                <>
                  <ol className="lr-rows">
                    {listed.slice(0, shown).map((s, i) => (
                      <Row key={s.id} s={s} index={i} active={isOn(s)} playing={isOn(s) && playing} connecting={isOn(s) && status === 'connecting'}
                        fav={favs.includes(s.id)} onPlay={() => toggle(s)} onFav={() => toggleFav(s.id)} />
                    ))}
                  </ol>
                  {listed.length > shown && (
                    <button type="button" className="lr-pill lr-more" onClick={() => setShown(n => n + PAGE)}>Show more ({listed.length - shown} left)</button>
                  )}
                </>
              )}
            </section>
          )}

          <footer className="lr-foot">
            <p>
              Streams from <a href="https://mp3quran.net" target="_blank" rel="noopener noreferrer">MP3Quran.net</a> and the{' '}
              <a href="https://www.radio-browser.info" target="_blank" rel="noopener noreferrer">Radio Browser</a> community directory.
              Stations are run by their broadcasters; some may be offline at times. Tip: press Space to play or pause, and turn the tuning knob with the mouse wheel.
            </p>
          </footer>
        </div>
      </div>

      {/* ---------- player bar (follows you down the page) ---------- */}
      {current && (
        <section className={`lr-player st-${status}`} aria-label="Player">
          <button type="button" className="lr-player-info" onClick={() => setSheet(true)} aria-label="Open now playing">
            <Cover s={current} size="xs" />
            <span>
              <b>{current.name}</b>
              <small>{status === 'error' ? 'No signal — try another station' : current.nameAr ?? detail(current)}</small>
            </span>
          </button>
          <div className="lr-player-mid">
            <div className="lr-ctrls">
              <button type="button" className="lr-iconbtn" onClick={() => step(-1)} aria-label="Previous station"><Icon name="skip_previous" /></button>
              {playButton(current, 'sm')}
              <button type="button" className="lr-iconbtn" onClick={() => step(1)} aria-label="Next station"><Icon name="skip_next" /></button>
            </div>
            {liveLine}
          </div>
          <div className="lr-player-end">
            {favButton(current)}
            <label className="lr-vol" hidden={!canVolume}>
              <Icon name={volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'} />
              <input type="range" min={0} max={1} step={0.05} value={volume} onChange={e => setVolume(Number(e.target.value))}
                aria-label="Volume" style={{ ['--v' as string]: `${volume * 100}%` }} />
            </label>
            <button type="button" className="lr-iconbtn" onClick={() => { stop(); setCurrent(null); setSheet(false); }} aria-label="Switch off"><Icon name="power_settings_new" /></button>
          </div>
        </section>
      )}

      {/* ---------- full-screen now playing (phones) ---------- */}
      {current && sheet && (
        <div className="lr-sheet" role="dialog" aria-modal="true" aria-label="Now playing">
          <div className="lr-sheet-inner">
            <header>
              <button type="button" className="lr-iconbtn" onClick={() => setSheet(false)} aria-label="Close"><Icon name="keyboard_arrow_down" /></button>
              <span>Now playing</span>
              {favButton(current)}
            </header>
            <Cover s={current} size="xl" />
            <div className="lr-sheet-text">
              <h2>{current.name}</h2>
              {current.nameAr && <p lang="ar" dir="rtl">{current.nameAr}</p>}
              <small>{detail(current)}</small>
            </div>
            <div className="lr-sheet-grille"><Bars on={playing} big /></div>
            {liveLine}
            <div className="lr-ctrls big">
              <button type="button" className="lr-iconbtn" onClick={() => step(-1)} aria-label="Previous station"><Icon name="skip_previous" /></button>
              {playButton(current)}
              <button type="button" className="lr-iconbtn" onClick={() => step(1)} aria-label="Next station"><Icon name="skip_next" /></button>
            </div>
            {status === 'error' && <button type="button" className="lr-pill" onClick={() => step(1)}>Try next station</button>}
          </div>
        </div>
      )}
    </div>
  );
}
