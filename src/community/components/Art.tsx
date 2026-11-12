import {
  BookMarked, BookOpen, Brain, Headphones, Languages, Lightbulb, ListChecks, Mic, Play, Radio, Timer,
} from 'lucide-react';
import { CIRCLES } from '../data/circles';
import { FORMATS } from '../data/gatherings';
import s from '../community.module.css';

/** The Learn Quran mark: an open book on a navy tile */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="cm-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a3370" />
          <stop offset="1" stopColor="#141a3a" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#cm-logo)" />
      <path d="M10 15.5c4.6-1.6 9.2-1.3 13 1.1v18c-3.8-2.4-8.4-2.7-13-1.1z" fill="#fff" />
      <path d="M38 15.5c-4.6-1.6-9.2-1.3-13 1.1v18c3.8-2.4 8.4-2.7 13-1.1z" fill="#fff" />
      <path d="M28.5 21.5h6M28.5 25h6M28.5 28.5h6" stroke="#1ee39a" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="40" cy="40" r="3" fill="#1ee39a" />
    </svg>
  );
}

const TINTS = ['var(--t0)', 'var(--t1)', 'var(--t2)', 'var(--t3)', 'var(--t4)'];
const INKS = ['var(--t0-ink)', 'var(--t1-ink)', 'var(--t2-ink)', 'var(--t3-ink)', 'var(--t4-ink)'];

/** A round portrait placeholder: head and shoulders, no face, so no real person is implied */
export function Person({ tint = 0, size = 56, ring }: { tint?: number; size?: number; ring?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden="true" className={s.person}>
      <circle cx="28" cy="28" r="26" fill={TINTS[tint % 5]} stroke={ring ?? 'var(--surface)'} strokeWidth="3" />
      <clipPath id={`cm-p${tint}`}>
        <circle cx="28" cy="28" r="24.5" />
      </clipPath>
      <g clipPath={`url(#cm-p${tint})`} fill={INKS[tint % 5]}>
        <circle cx="28" cy="23" r="8.5" />
        <path d="M11 54c0-11 7.6-18 17-18s17 7 17 18z" />
      </g>
    </svg>
  );
}

/** The little sound waves beside the hero headline */
export function Waves() {
  return (
    <svg className={s.waves} viewBox="0 0 40 48" aria-hidden="true">
      <g fill="none" stroke="var(--mint)" strokeWidth="3.2" strokeLinecap="round">
        <path d="M6 30c5-3 7-9 5-15" />
        <path d="M14 36c9-6 12-17 8-27" />
        <path d="M22 42c13-9 17-25 11-38" />
      </g>
    </svg>
  );
}

const PEOPLE = [
  { tint: 4, x: 3, y: 4, ring: '#c9b7f6' },
  { tint: 1, x: 8, y: 58, ring: '#ffd27a', typing: true },
  { tint: 3, x: 89, y: 6, ring: '#b9cdf6', bubble: 'Assalamu alaikum!' },
  { tint: 2, x: 79, y: 66, ring: '#ffb9a3' },
];

/** People floating around the hero, each on a dashed path down to the circle below */
export function HeroPeople() {
  return (
    <div className={s.heroPeople} aria-hidden="true">
      <svg className={s.heroPaths} viewBox="0 0 100 100" preserveAspectRatio="none">
        <g fill="none" strokeWidth="1.6" strokeDasharray="4 6" strokeLinecap="round" vectorEffect="non-scaling-stroke">
          <path d="M7 18 C 14 30, 22 60, 21 100" stroke="#a99af0" vectorEffect="non-scaling-stroke" />
          <path d="M11 72 C 9 84, 11 94, 15 100" stroke="#f5b54a" vectorEffect="non-scaling-stroke" />
          <path d="M93 34 C 99 54, 99 80, 92 100" stroke="#8fb0f2" vectorEffect="non-scaling-stroke" />
          <path d="M80 76 C 73 80, 69 90, 70 100" stroke="#ff9478" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      {PEOPLE.map(p => (
        <span key={p.tint} className={s.floater} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <Person tint={p.tint} ring={p.ring} />
          {p.bubble && <span className={s.bubbleLeft}>{p.bubble}</span>}
          {p.typing && (
            <span className={s.bubbleTyping}>
              <i />
              <i />
              <i />
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

/** A deterministic waveform, so the server and the browser draw the same bars */
const WAVE = Array.from({ length: 34 }, (_, i) => 22 + Math.round(Math.abs(Math.sin(i * 1.7) * 60 + Math.sin(i * 0.6) * 18)));

/**
 * What a circle looks like from the inside: a sketch of the app, not a screenshot.
 * Only real names are used (the circles and the weekly session); everything else is placeholder bars.
 */
export function CirclePreview() {
  const side = CIRCLES.slice(0, 7);
  const weekly = FORMATS[0];
  return (
    <div className={s.preview} aria-hidden="true">
      <div className={s.previewBar}>
        <LogoMark size={22} />
        <b>Learn Quran</b>
        <span className={s.previewSearch}>Search circles</span>
        <span className={s.previewMe}>
          <Person tint={0} size={26} />
        </span>
      </div>
      <div className={s.previewBody}>
        <div className={s.previewSide}>
          <p>Your circles</p>
          {side.map((c, i) => (
            <span key={c.id} className={i === 1 ? s.previewSideOn : undefined}>
              <i />
              {c.name}
            </span>
          ))}
        </div>

        <div className={s.previewMain}>
          <div className={s.previewStage}>
            <div>
              <small>{side[1].name}</small>
              <strong>{weekly.name}</strong>
              <em>{weekly.where} · {weekly.length}</em>
            </div>
            <div className={s.previewFaces}>
              {[0, 1, 2, 3, 4].map(t => (
                <Person key={t} tint={t} size={40} />
              ))}
            </div>
          </div>
          <div className={s.voice}>
            <span className={s.voicePlay}>
              <Play size={14} fill="currentColor" />
            </span>
            <span className={s.voiceWave}>
              {WAVE.map((h, i) => (
                <i key={i} style={{ height: `${Math.min(h, 100)}%` }} className={i < 12 ? s.voiceDone : undefined} />
              ))}
            </span>
            <span className={s.voiceTime}>0:42</span>
          </div>
          <span className={s.skel} style={{ width: '72%' }} />
          <span className={s.skel} style={{ width: '54%' }} />
          <span className={s.skelSoft} style={{ width: '38%' }} />
        </div>

        <div className={s.previewRight}>
          <p>This week</p>
          {[64, 80, 52].map((w, i) => (
            <span key={i} className={s.previewRow}>
              <i className={i === 0 ? s.previewTick : undefined} />
              <span className={s.skel} style={{ width: `${w}%` }} />
            </span>
          ))}
          <p>Partners</p>
          {[2, 3].map(t => (
            <span key={t} className={s.previewRow}>
              <Person tint={t} size={24} />
              <span className={s.skel} style={{ width: '60%' }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const TOOLS = [
  { icon: BookOpen, name: 'Read Quran', color: '#ff7a1a' },
  { icon: Headphones, name: 'Audio Quran', color: '#1db954' },
  { icon: Brain, name: 'Hifz Program', color: '#6c5cff' },
  { icon: Mic, name: 'Tajweed', color: '#ff4d6d' },
  { icon: Lightbulb, name: 'Tafseer', color: '#f5a524' },
  { icon: Languages, name: 'Word by Word', color: '#2f7cf6' },
  { icon: BookMarked, name: 'Mushaf', color: '#e2457a' },
  { icon: Radio, name: 'Quran Radio', color: '#ff5a36' },
  { icon: ListChecks, name: 'Quran Quiz', color: '#0fb5ae' },
  { icon: Timer, name: 'Learn in 1 Minute', color: '#2f55d4' },
];

// six on the outer ring, four on the inner one; angles keep the middle clear for the text
const SPOTS = [
  { a: -150, r: 1 }, { a: -90, r: 1 }, { a: -30, r: 1 }, { a: 30, r: 1 }, { a: 90, r: 1 }, { a: 150, r: 1 },
  { a: -125, r: 0.64 }, { a: -55, r: 0.64 }, { a: 55, r: 0.64 }, { a: 125, r: 0.64 },
];

/** The app's tools orbiting the community: rings, coloured icons, and the text in the middle */
export function ToolsOrbit({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.orbit}>
      <svg className={s.orbitRings} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <g fill="none" stroke="var(--line-strong)" strokeWidth="1.2" strokeDasharray="3 6">
          <ellipse cx="50" cy="50" rx="46" ry="44" vectorEffect="non-scaling-stroke" />
          <ellipse cx="50" cy="50" rx="29.5" ry="28" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      {TOOLS.map((t, i) => {
        const { a, r } = SPOTS[i];
        const rad = (a * Math.PI) / 180;
        const I = t.icon;
        return (
          <span
            key={t.name}
            className={r < 1 ? `${s.orbitIcon} ${s.orbitInner}` : s.orbitIcon}
            title={t.name}
            aria-hidden="true"
            style={{ left: `${50 + 46 * r * Math.cos(rad)}%`, top: `${50 + 44 * r * Math.sin(rad)}%`, background: t.color }}
          >
            <I size={20} strokeWidth={2} />
          </span>
        );
      })}
      <div className={s.orbitCenter}>{children}</div>
    </div>
  );
}

/** A loose hand-drawn line for the corner of the mint card */
export function Squiggle() {
  return (
    <svg className={s.joinSquiggle} viewBox="0 0 120 80" aria-hidden="true">
      <path d="M4 76c10-22 22-34 34-30s4 22-8 18 6-34 30-40 30 14 22 24-22-2-10-20 30-18 44-20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
