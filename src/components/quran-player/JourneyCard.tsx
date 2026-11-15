'use client';
/**
 * "My listening journey": Arabic + meaning, surah 1 → 114 in order, remembered per learner.
 * Shows where to continue, simple stats, and a map of all 114 surahs.
 */
import { useEffect, useRef, useState } from 'react';
import { journeySummary, surahPct, resumeAyah } from '@/lib/listenJourney';
import type { ListenJourney } from './useListenJourney';
import { Icons } from './PlayerIcons';
import { SurahArt } from './SurahArt';
import './JourneyCard.css';

export type JourneySurah = { number: number; name: string; translation: string; ayahs: number };

type Props = {
  tracker: ListenJourney;
  surahs: JourneySurah[];
  langName: string;
  /** what is playing right now in translation mode */
  now: { surah: number; ayah: number } | null;
  isPlaying: boolean;
  onPlay: (surah: number, ayah: number) => void;
  onTogglePlay: () => void;
};

const initial = (name: string) => name.trim().slice(0, 1).toUpperCase();

function NameForm({ onSubmit, cta, autoFocus }: { onSubmit: (n: string) => boolean; cta: string; autoFocus?: boolean }) {
  const [name, setName] = useState('');
  return (
    <form className="qpj-form" onSubmit={e => { e.preventDefault(); if (name.trim() && onSubmit(name)) setName(''); }}>
      <input className="qpj-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" maxLength={40} aria-label="Your name" autoFocus={autoFocus} />
      <button type="submit" className="qpj-btn" disabled={!name.trim()}>{cta}</button>
    </form>
  );
}

export function JourneyCard({ tracker, surahs, langName, now, isPlaying, onPlay, onTogglePlay }: Props) {
  const { status, profile, profiles, journey, today } = tracker;
  const [menu, setMenu] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menuRef.current?.contains(e.target as Node)) { setMenu(false); setAdding(false); }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [menu]);

  if (status === 'loading' || !today) return <div className="qpj qpj-skeleton" aria-hidden="true" />;

  const howItWorks = (
    <ol className="qpj-steps">
      <li><span>1</span>Hear an ayah in Arabic</li>
      <li><span>2</span>Then its meaning in {langName}</li>
      <li><span>3</span>Surah 1 → 114, in order</li>
    </ol>
  );

  /* ── nobody chosen yet ── */
  if (status === 'guest' || !profile) {
    const first = surahs[0];
    return (
      <section className="qpj qpj-guest" aria-labelledby="qpj-title">
        <div className="qpj-guest-text">
          <span className="qpj-eyebrow">My listening journey</span>
          <h2 id="qpj-title">Understand the whole Quran, one ayah at a time</h2>
          {howItWorks}
          <p className="qpj-muted">Add your name and we&apos;ll remember the exact ayah where you stop, for each person on this device.</p>
        </div>
        <div className="qpj-guest-actions">
          {profiles.length > 0 && (
            <div className="qpj-chips" role="list" aria-label="Who is listening?">
              {profiles.map(p => (
                <button key={p.id} type="button" role="listitem" className="qpj-chip" onClick={() => tracker.signIn(p.id)}>
                  <span className="qpj-avatar sm" aria-hidden="true">{initial(p.name)}</span>{p.name}
                </button>
              ))}
            </div>
          )}
          <NameForm onSubmit={tracker.signUp} cta={profiles.length ? 'Add me' : 'Start my journey'} />
          {first && (
            <button type="button" className="qpj-link" onClick={() => onPlay(first.number, 1)}>
              or just listen without saving →
            </button>
          )}
        </div>
      </section>
    );
  }

  const s = journeySummary(journey, surahs, today);
  const nextMeta = s.next ? surahs.find(x => x.number === s.next!.surah.number) ?? null : null;
  const playingNext = !!(now && nextMeta && now.surah === nextMeta.number);
  const shownAyah = playingNext && now ? now.ayah : s.next?.ayah ?? 1;
  const nextPct = nextMeta ? Math.round(((shownAyah - 1) / nextMeta.ayahs) * 100) : 0;
  const allDone = s.surahsDone === s.totalSurahs;

  return (
    <section className="qpj" aria-label={`${profile.name}'s listening journey`}>
      {/* a div, not <header>: the player page hides every <header> to remove the site navbar */}
      <div className="qpj-head">
        <div className="qpj-who">
          <span className="qpj-avatar" aria-hidden="true">{initial(profile.name)}</span>
          <div>
            <span className="qpj-eyebrow">My listening journey</span>
            <div className="qpj-name">{profile.name}</div>
          </div>
        </div>
        <div className="qpj-menu-wrap" ref={menuRef}>
          <button type="button" className="qpj-ghost" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(m => !m)}>
            Not {profile.name}?
          </button>
          {menu && (
            <div className="qpj-menu" role="menu">
              {profiles.map(p => (
                <button key={p.id} type="button" role="menuitemradio" aria-checked={p.id === profile.id}
                  className={`qpj-menu-item${p.id === profile.id ? ' on' : ''}`}
                  onClick={() => { tracker.signIn(p.id); setMenu(false); }}>
                  <span className="qpj-avatar sm" aria-hidden="true">{initial(p.name)}</span>
                  <span className="qpj-menu-name">{p.name}</span>
                  {p.id === profile.id && <span aria-hidden="true">✓</span>}
                </button>
              ))}
              <div className="qpj-menu-sep" />
              {adding ? (
                <NameForm autoFocus cta="Add" onSubmit={n => { const ok = tracker.signUp(n); if (ok) { setAdding(false); setMenu(false); } return ok; }} />
              ) : (
                <button type="button" role="menuitem" className="qpj-menu-item" onClick={() => setAdding(true)}>
                  <span className="qpj-plus" aria-hidden="true">+</span>Add someone
                </button>
              )}
              <button type="button" role="menuitem" className="qpj-menu-item dim" onClick={() => { tracker.signOut(); setMenu(false); }}>
                Listen without saving
              </button>
            </div>
          )}
        </div>
      </div>

      {/* continue where you stopped */}
      {allDone ? (
        <div className="qpj-next qpj-finished">
          <div className="qpj-next-text">
            <span className="qpj-next-label">MashaAllah — all 114 surahs</span>
            <div className="qpj-next-title">You listened to the meaning of the whole Quran</div>
            <div className="qpj-next-sub">Pick any surah from the map to listen again.</div>
          </div>
        </div>
      ) : nextMeta && s.next ? (
        <div className={`qpj-next${playingNext ? ' is-live' : ''}`}>
          <div className="qpj-next-art"><SurahArt number={nextMeta.number} name={nextMeta.name} size="small" /></div>
          <div className="qpj-next-text">
            <span className="qpj-next-label">
              {playingNext ? (isPlaying ? 'Now listening' : 'Paused') : shownAyah > 1 ? 'Continue where you stopped' : 'Up next'} · Surah {nextMeta.number} of 114
            </span>
            <div className="qpj-next-title">{nextMeta.name} <span>— {nextMeta.translation}</span></div>
            <div className="qpj-next-sub">Ayah {shownAyah} of {nextMeta.ayahs} · {langName}</div>
            <div className="qpj-bar" aria-hidden="true"><span style={{ width: `${nextPct}%` }} /></div>
          </div>
          <button
            type="button"
            className="qpj-play"
            aria-label={playingNext && isPlaying ? 'Pause' : `Play ${nextMeta.name} from ayah ${shownAyah}`}
            onClick={() => (playingNext ? onTogglePlay() : onPlay(nextMeta.number, s.next!.ayah))}
          >
            {playingNext && isPlaying ? <Icons.Pause /> : <Icons.Play />}
          </button>
        </div>
      ) : null}

      {/* simple numbers */}
      <div className="qpj-stats">
        <div><b>{s.surahsDone}<small>/114</small></b><span>Surahs finished</span></div>
        <div><b>{s.ayahsHeard.toLocaleString()}<small>/{s.totalAyahs.toLocaleString()}</small></b><span>Ayahs understood</span></div>
        <div><b>{s.todayAyahs}</b><span>Ayahs today</span></div>
        <div><b><i className={s.streak ? 'on' : ''} aria-hidden="true">🔥</i>{s.streak}<small> day{s.streak === 1 ? '' : 's'}</small></b><span>Streak</span></div>
      </div>

      <div className="qpj-overall" aria-label={`${(s.pct * 100).toFixed(1)}% of the Quran`}>
        <div className="qpj-bar thin"><span style={{ width: `${Math.max(s.pct * 100, s.pct > 0 ? 1 : 0)}%` }} /></div>
        <span>{(s.pct * 100).toFixed(1)}% of the Quran</span>
      </div>

      <button type="button" className="qpj-map-toggle" aria-expanded={showMap} onClick={() => setShowMap(v => !v)}>
        {showMap ? 'Hide' : 'Show'} all 114 surahs
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: showMap ? 'rotate(180deg)' : undefined }}><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {showMap && (
        <>
          <div className="qpj-legend" aria-hidden="true">
            <span><i className="done" />Finished</span>
            <span><i className="part" />Started</span>
            <span><i className="next" />Up next</span>
            <span><i />Not yet</span>
          </div>
          <div className="qpj-map" role="list">
            {surahs.map(x => {
              const pct = surahPct(journey, x);
              const done = pct >= 1;
              const isNext = s.next?.surah.number === x.number;
              const live = now?.surah === x.number;
              const ay = resumeAyah(journey, x);
              return (
                <button
                  key={x.number}
                  type="button"
                  role="listitem"
                  className={`qpj-tile${done ? ' done' : pct > 0 ? ' part' : ''}${isNext ? ' next' : ''}${live ? ' live' : ''}`}
                  style={!done && pct > 0 ? { ['--p' as string]: `${Math.round(pct * 100)}%` } : undefined}
                  title={`${x.number}. ${x.name} — ${x.translation}${done ? ' (finished)' : pct > 0 ? ` (${Math.round(pct * 100)}%, resume at ayah ${ay})` : ''}`}
                  aria-label={`Surah ${x.number}, ${x.name}${done ? ', finished' : pct > 0 ? `, ${Math.round(pct * 100)} percent` : ''}`}
                  onClick={() => onPlay(x.number, ay)}
                >
                  {x.number}
                </button>
              );
            })}
          </div>
        </>
      )}

      {tracker.saveError && <p className="qpj-error" role="alert">This browser is blocking storage, so progress can&apos;t be saved.</p>}
    </section>
  );
}
