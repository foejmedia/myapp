'use client';
import { useState } from 'react';
import { CATEGORIES, type LiveStation } from '@/lib/radio/live';

export function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ''}`} aria-hidden="true">{name}</span>;
}

export const detail = (s: LiveStation) => {
  if (s.category !== 'station') return CATEGORIES.find(c => c.id === s.category)!.label.replace(/s$/, '');
  const codec = s.codec && s.codec !== 'UNKNOWN' ? s.codec : null;
  return [s.country, codec && s.bitrate ? `${codec} ${s.bitrate} kbps` : codec].filter(Boolean).join(' · ');
};

/** Muted, playlist-style gradients in the app's emerald / gold / ink family */
const PALETTES = [
  ['#0b5d43', '#1f8a68'], ['#7a5a12', '#c9a24a'], ['#123a4a', '#2e7d8f'], ['#3b2a52', '#7a5aa6'],
  ['#5a1f2b', '#a6475a'], ['#1d3b2a', '#4c8c5e'], ['#2a2f4a', '#5864a6'], ['#4a3518', '#a87a3a'],
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

/** The text a generated cover shows: the Arabic name if there is one, else initials */
function coverText(s: LiveStation) {
  const ar = s.nameAr?.replace(/[-–—]+/g, ' ').trim();
  if (ar) return { text: ar.split(/\s+/).slice(0, 3).join(' '), ar: true };
  const words = s.name.replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(w => w.length > 2 && !/^(radio|quran|the|al)$/i.test(w));
  return { text: (words.slice(0, 2).map(w => w[0]).join('') || s.name.slice(0, 2)).toUpperCase(), ar: false };
}

/** Station artwork, or a generated cover when there's none (most channels have none) */
export function Cover({ s, size }: { s: LiveStation; size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  const [failed, setFailed] = useState(false);
  const [a, b] = PALETTES[hash(s.id) % PALETTES.length];
  const icon = CATEGORIES.find(c => c.id === s.category)!.icon;
  if (s.image && !failed) {
    return (
      <span className={`lr-cover ${size} has-img`} style={{ ['--c1' as string]: a, ['--c2' as string]: b }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.image} alt="" loading="lazy" onError={() => setFailed(true)} />
      </span>
    );
  }
  const t = coverText(s);
  return (
    <span className={`lr-cover ${size}`} style={{ ['--c1' as string]: a, ['--c2' as string]: b }} aria-hidden="true">
      <span className={`lr-cover-text${t.ar ? ' is-ar' : ''}`} lang={t.ar ? 'ar' : undefined} dir={t.ar ? 'rtl' : undefined}>{t.text}</span>
      <Icon name={icon} className="lr-cover-icon" />
    </span>
  );
}

/** Decorative level bars; animated only while audio is actually playing */
export function Bars({ on, big }: { on: boolean; big?: boolean }) {
  return (
    <span className={`lr-bars${on ? ' is-on' : ''}${big ? ' big' : ''}`} aria-hidden="true">
      {Array.from({ length: big ? 28 : 4 }, (_, i) => <i key={i} style={{ animationDelay: `${-(i * 137) % 900}ms` }} />)}
    </span>
  );
}

interface RowProps {
  s: LiveStation;
  index: number;
  active: boolean;
  playing: boolean;
  connecting: boolean;
  fav: boolean;
  onPlay: () => void;
  onFav: () => void;
}

/** Track-list row */
export function Row({ s, index, active, playing, connecting, fav, onPlay, onFav }: RowProps) {
  return (
    <li className={`lr-row${active ? ' is-active' : ''}`}>
      <button type="button" className="lr-row-main" onClick={onPlay} aria-label={`${active && (playing || connecting) ? 'Pause' : 'Play'} ${s.name}`}>
        <span className="lr-row-idx">
          {active && connecting ? <span className="lr-spinner" /> : active && playing ? <Bars on /> : (
            <><span className="lr-num">{index + 1}</span><Icon name="play_arrow" className="lr-row-play" /></>
          )}
        </span>
        <Cover s={s} size="sm" />
        <span className="lr-row-text">
          <b>{s.name}</b>
          <small>{s.nameAr ? <span lang="ar" dir="rtl">{s.nameAr}</span> : detail(s)}</small>
        </span>
        <span className="lr-row-meta">{s.nameAr ? detail(s) : ''}</span>
        <span className="lr-live-tag">LIVE</span>
      </button>
      <button type="button" className={`lr-heart${fav ? ' is-on' : ''}`} aria-pressed={fav} onClick={onFav}
        aria-label={fav ? `Remove ${s.name} from favourites` : `Add ${s.name} to favourites`}>
        <Icon name="favorite" />
      </button>
    </li>
  );
}

/** Square shelf card */
export function Tile({ s, active, playing, onPlay }: { s: LiveStation; active: boolean; playing: boolean; onPlay: () => void }) {
  return (
    <li className={`lr-tile${active ? ' is-active' : ''}`}>
      <button type="button" onClick={onPlay} aria-label={`${active && playing ? 'Pause' : 'Play'} ${s.name}`}>
        <span className="lr-tile-art">
          <Cover s={s} size="lg" />
          <span className="lr-tile-play"><Icon name={active && playing ? 'pause' : 'play_arrow'} /></span>
          {active && playing && <span className="lr-tile-eq"><Bars on /></span>}
        </span>
        <b>{s.name}</b>
        <small>{s.nameAr ? <span lang="ar" dir="rtl">{s.nameAr}</span> : detail(s)}</small>
      </button>
    </li>
  );
}
