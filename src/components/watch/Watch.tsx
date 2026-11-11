'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ROWS, type CatalogResponse, type RowId, type Video } from '@/lib/videos/catalog';
import { Card, Hero, Icon, Shelf, ShortCard, meta } from './parts';
import Player from './Player';
import { readList, readProgress, resumeAt, snap, toggleList, type Progress, type Snap } from './store';
import './watch.css';

type Tab = 'home' | 'list' | RowId;
const SHELF_SIZE = 20;

/** One newest video per channel, so the spotlight isn't six uploads from the same channel */
function spotlight(videos: Video[]) {
  const seen = new Set<string>();
  return videos.filter(v => !v.short && !seen.has(v.channelId) && seen.add(v.channelId)).slice(0, 6);
}

export default function Watch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const watching = params?.get('v') ?? null;
  const tabParam = params?.get('tab') as Tab | null;
  const tab: Tab = tabParam && (['home', 'list', ...ROWS.map(r => r.id)] as string[]).includes(tabParam) ? tabParam : 'home';

  const [data, setData] = useState<CatalogResponse | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [list, setList] = useState<Snap[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});

  useEffect(() => { setList(readList()); setProgress(readProgress()); }, []);
  // coming back from the player: show the new position in "Continue watching"
  useEffect(() => { if (!watching) setProgress(readProgress()); }, [watching]);

  useEffect(() => {
    const ctrl = new AbortController();
    setError('');
    fetch('/api/videos', { signal: ctrl.signal })
      .then(async r => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(json.error ?? 'Videos are unavailable right now.');
        setData(json as CatalogResponse);
      })
      .catch(e => { if (!ctrl.signal.aborted) setError(e instanceof TypeError ? 'You appear to be offline.' : (e as Error).message); });
    return () => ctrl.abort();
  }, [attempt]);

  const go = useCallback((next: { v?: string | null; tab?: Tab }, replace = false) => {
    const sp = new URLSearchParams(params?.toString() ?? '');
    if ('v' in next) { if (next.v) sp.set('v', next.v); else sp.delete('v'); }
    if (next.tab) { if (next.tab === 'home') sp.delete('tab'); else sp.set('tab', next.tab); }
    const url = `${pathname}${sp.toString() ? `?${sp}` : ''}`;
    if (replace) router.replace(url, { scroll: false }); else router.push(url, { scroll: !('v' in next) });
  }, [params, pathname, router]);

  const open = (v: Snap) => go({ v: v.id });
  const close = useCallback(() => {
    // came here from the page: go back; arrived by a shared link: just drop the param
    if (window.history.length > 1) router.back(); else go({ v: null }, true);
  }, [router, go]);

  const videos = useMemo(() => data?.videos ?? [], [data]);
  const longs = useMemo(() => videos.filter(v => !v.short), [videos]);
  const shorts = useMemo(() => videos.filter(v => v.short), [videos]);
  const byId = useMemo(() => new Map(videos.map(v => [v.id, v])), [videos]);
  const inList = (id: string) => list.some(x => x.id === id);
  const onToggleList = (v: Snap) => setList(toggleList(v));

  const continuing = useMemo(() => Object.values(progress)
    .filter(p => p.t > 10 && p.t < p.d - 20)
    .sort((a, b) => b.at - a.at)
    .map(p => ({ v: { ...p.v, ...byId.get(p.v.id) }, pct: p.t / p.d })), [progress, byId]);

  const current: (Partial<Video> & Snap) | null = watching
    ? byId.get(watching) ?? list.find(x => x.id === watching) ?? progress[watching]?.v ?? (/^[\w-]{11}$/.test(watching) ? { id: watching, title: 'Video', channel: '', row: 'recitation', short: false } : null)
    : null;

  // the watch view takes over the screen: lock page scroll, Escape closes it
  useEffect(() => {
    if (!current) return;
    // globals.css puts overflow-x on <html>, which makes <html> the page's scroller — lock both,
    // or the page scrollbar stays visible next to the overlay's own
    const els = [document.documentElement, document.body];
    const prev = els.map(el => el.style.overflow);
    els.forEach(el => { el.style.overflow = 'hidden'; });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => { els.forEach((el, i) => { el.style.overflow = prev[i]; }); window.removeEventListener('keydown', onKey); };
  }, [current, close]);

  const cards = (vs: (Partial<Video> & Snap)[]) => vs.map(v => <Card key={v.id} v={v} onOpen={() => open(v)} />);
  const grid = (vs: (Partial<Video> & Snap)[], empty: string) => vs.length
    ? <ul className="wt-grid">{cards(vs)}</ul>
    : <div className="wt-state"><Icon name="video_library" /><p>{empty}</p></div>;

  // Home (the LearnQuran homepage) is a link in the rail; the Watch logo returns to the start of Watch
  const nav: { id: Tab; label: string; icon: string }[] = [
    ...ROWS.map(r => ({ id: r.id as Tab, label: r.short, icon: r.icon })),
    { id: 'list', label: 'My List', icon: 'bookmark' },
  ];

  let body: React.ReactNode;
  if (error) {
    body = (
      <div className="wt-state" role="alert">
        <Icon name="wifi_off" />
        <h2>Couldn’t load videos</h2>
        <p>{error}</p>
        <button type="button" className="wt-btn primary" onClick={() => setAttempt(a => a + 1)}><Icon name="refresh" /> Try again</button>
      </div>
    );
  } else if (!data && tab !== 'list') {
    body = (
      <>
        {tab === 'home' && <div className="wt-hero is-loading" />}
        <div className="wt-skel-row">{Array.from({ length: 6 }, (_, i) => <span key={i} />)}</div>
        <div className="wt-skel-row">{Array.from({ length: 6 }, (_, i) => <span key={i} />)}</div>
      </>
    );
  } else if (tab === 'home') {
    body = (
      <>
        <Hero items={spotlight(videos)} inList={inList} onWatch={open} onToggleList={onToggleList} />
        {continuing.length > 0 && (
          <Shelf title="Continue watching">
            {continuing.map(({ v, pct }) => <Card key={v.id} v={v} progress={pct} onOpen={() => open(v)} />)}
          </Shelf>
        )}
        {list.length > 0 && <Shelf title="My List" onSeeAll={() => go({ tab: 'list' })}>{cards(list.map(s => ({ ...s, ...byId.get(s.id) })).slice(0, SHELF_SIZE))}</Shelf>}
        <Shelf title="Latest uploads">{cards(longs.slice(0, SHELF_SIZE))}</Shelf>
        {ROWS.map((r, i) => {
          const vs = longs.filter(v => v.row === r.id);
          return (
            <div key={r.id} className="wt-block">
              {vs.length > 0 && <Shelf title={r.title} onSeeAll={() => go({ tab: r.id })}>{cards(vs.slice(0, SHELF_SIZE))}</Shelf>}
              {i === 1 && shorts.length > 0 && (
                <Shelf title="Quick reminders" tall>
                  {shorts.slice(0, SHELF_SIZE).map(v => <ShortCard key={v.id} v={v} onOpen={() => open(v)} />)}
                </Shelf>
              )}
            </div>
          );
        })}
      </>
    );
  } else if (tab === 'list') {
    body = (
      <section className="wt-page" aria-label="My List">
        <h1 className="wt-page-title">My List</h1>
        {grid(list.map(s => ({ ...s, ...byId.get(s.id) })), 'Videos you add with + appear here.')}
      </section>
    );
  } else {
    const r = ROWS.find(x => x.id === tab)!;
    const vs = longs.filter(v => v.row === r.id);
    const ss = shorts.filter(v => v.row === r.id);
    body = (
      <section className="wt-page" aria-label={r.title}>
        <h1 className="wt-page-title"><Icon name={r.icon} /> {r.title}</h1>
        {grid(vs, 'No videos here right now.')}
        {ss.length > 0 && <Shelf title="Quick reminders" tall>{ss.map(v => <ShortCard key={v.id} v={v} onOpen={() => open(v)} />)}</Shelf>}
      </section>
    );
  }

  const more = current ? longs.filter(v => v.channel === current.channel && v.id !== current.id).slice(0, SHELF_SIZE) : [];
  const next = current ? longs.filter(v => v.row === current.row && v.channel !== current.channel).slice(0, SHELF_SIZE) : [];

  return (
    <div className="wt">
      <nav className="wt-rail" aria-label="Watch">
        <button type="button" className="wt-brand" title="Watch: start" onClick={() => go({ tab: 'home' })}>
          <Icon name="smart_display" />
          <span className="wt-brand-text"><b>Watch</b></span>
        </button>
        <Link href="/" className="wt-rail-item" title="LearnQuran homepage">
          <Icon name="home" /><span>Home</span>
        </Link>
        {nav.map(n => (
          <button key={n.id} type="button" className={`wt-rail-item${tab === n.id ? ' is-on' : ''}`} aria-current={tab === n.id ? 'page' : undefined}
            onClick={() => go({ tab: n.id })}>
            <Icon name={n.icon} /><span>{n.label}</span>
          </button>
        ))}
      </nav>

      <main className="wt-main">
        {body}
        {data?.missing.length ? <p className="wt-note"><Icon name="info" /> Couldn’t reach {data.missing.join(', ')} just now.</p> : null}
        <footer className="wt-foot">
          Videos are published on YouTube by their channels and play in YouTube’s player. LearnQuran shows each channel’s latest uploads.
        </footer>
      </main>

      {current && (
        <div className="wt-watch" role="dialog" aria-modal="true" aria-label={current.title}>
          <header className="wt-watch-top">
            <button type="button" className="wt-btn icon ghost" onClick={close} aria-label="Back"><Icon name="arrow_back" /></button>
            <span>{current.channel}</span>
          </header>
          <div className="wt-watch-body">
            <Player key={current.id} video={snap(current)} start={resumeAt(current.id)} />
            <div className="wt-watch-info">
              <h1>{current.title}</h1>
              <p className="wt-watch-meta">{meta(current)}</p>
              <div className="wt-watch-actions">
                <button type="button" className="wt-btn" onClick={() => onToggleList(current)} aria-pressed={inList(current.id)}>
                  <Icon name={inList(current.id) ? 'check' : 'add'} /> {inList(current.id) ? 'In My List' : 'My List'}
                </button>
                <button type="button" className="wt-btn" onClick={() => {
                  const url = `${window.location.origin}${pathname}?v=${current.id}`;
                  if (navigator.share) navigator.share({ title: current.title, url }).catch(() => {});
                  else navigator.clipboard?.writeText(url);
                }}><Icon name="share" /> Share</button>
                <a className="wt-btn" href={`https://www.youtube.com/watch?v=${current.id}`} target="_blank" rel="noopener noreferrer"><Icon name="open_in_new" /> YouTube</a>
              </div>
              {current.summary && <p className="wt-watch-summary">{current.summary}</p>}
            </div>
            {more.length > 0 && <Shelf title={`More from ${current.channel}`}>{cards(more)}</Shelf>}
            {next.length > 0 && <Shelf title={`More ${ROWS.find(r => r.id === current.row)!.title.toLowerCase()}`}>{cards(next)}</Shelf>}
          </div>
        </div>
      )}
    </div>
  );
}
