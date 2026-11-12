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

const SKIN = ['#f7d5b5', '#eab38c', '#cf9068', '#a8704b', '#7a4c33'];
const WEAR = ['var(--wear-navy)', '#12b47c', '#7c5cff', '#ff7a59', '#2f7cf6', '#f5a524', '#e2457a', '#0fa3a0'];
const HAIR = ['#2a1d16', '#5a3a26', '#17151f', '#9a98a6'];

/**
 * An illustrated member: drawn, not photographed, and with no facial features, so no real person is implied.
 * Sisters wear a hijab; brothers have hair or a kufi, and may have a beard. Every look is chosen
 * in the data (`look` on a member or story), never guessed from a name.
 */
export interface Look {
  kind: 'hijab' | 'hair' | 'kufi';
  skin: number;
  /** clothes, or the hijab's colour */
  wear: number;
  hair?: 'short' | 'wavy' | 'curly';
  hairColor?: number;
  beard?: 'short' | 'full';
  /** the kufi: white unless given */
  cap?: string;
}

function Figure({ look }: { look: Look }) {
  const skin = SKIN[look.skin % SKIN.length];
  const wear = WEAR[look.wear % WEAR.length];
  const hairC = HAIR[(look.hairColor ?? 0) % HAIR.length];
  const hijab = look.kind === 'hijab';
  const beard = !hijab && look.beard;
  return (
    <g>
      <circle cx="30" cy="31" r="21" fill="var(--halo)" />

      {/* shoulders */}
      <path d="M6 72c0-15 10.5-23 24-23s24 8 24 23z" fill={wear} />
      {hijab ? (
        <path d="M6 72c0-15 10.5-23 24-23s24 8 24 23z" fill="#000" opacity=".16" />
      ) : (
        <>
          <rect x="25.8" y="38" width="8.4" height="13" rx="3.5" fill={skin} />
          <rect x="25.8" y="38" width="8.4" height="13" rx="3.5" fill="#000" opacity=".1" />
          <path d="M23.5 49.6 30 57.5l6.5-7.9" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" strokeLinejoin="round" />
        </>
      )}

      {/* the hijab, draped from the crown to the shoulders */}
      {hijab && (
        <>
          <path d="M30 12.5C17 12.5 13.6 24 14.2 34c.4 7-2.8 12.2-5.8 18.2C14.6 56.4 22.4 58.5 30 58.5s15.4-2.1 21.6-6.3c-3-6-6.2-11.2-5.8-18.2C46.4 24 43 12.5 30 12.5z" fill={wear} />
          <path d="M15.6 47.5c4.6 4.2 9.4 6.4 14.4 6.6M44.4 47.5c-2.4 2.2-5 3.8-7.8 4.8" fill="none" stroke="#000" strokeOpacity=".14" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}

      {/* ears */}
      {!hijab && (
        <>
          <ellipse cx="18.8" cy="31.8" rx="2.4" ry="3.1" fill={skin} />
          <ellipse cx="41.2" cy="31.8" rx="2.4" ry="3.1" fill={skin} />
        </>
      )}

      {/* face */}
      <ellipse cx="30" cy="31" rx={hijab ? 9.8 : 11} ry={hijab ? 11.2 : 12.5} fill={skin} />
      {hijab && (
        <>
          <path d="M20.4 28C21.3 21.2 25.2 19.6 30 19.6s8.7 1.6 9.6 8.4c-2.8-3.1-6-4.3-9.6-4.3s-6.8 1.2-9.6 4.3z" fill="#fff" opacity=".82" />
          <ellipse cx="30" cy="31" rx="9.8" ry="11.2" fill="none" stroke="#000" strokeOpacity=".08" strokeWidth="1.4" />
        </>
      )}

      {/* hair or kufi */}
      {look.kind === 'hair' && look.hair === 'short' && (
        <path d="M18.8 30.5C17.9 20.6 23 16.4 30 16.4s12.1 4.2 11.2 14.1c-1.5-4.6-4.4-7-8-7.8-3.4 2.3-8.6 3.1-13 2.5-.7 1.6-1.2 3.4-1.4 5.3z" fill={hairC} />
      )}
      {look.kind === 'hair' && look.hair === 'wavy' && (
        <>
          <path d="M18.5 32C16.6 19.4 22.8 15 30.6 15.4c7.4.4 12.4 5.4 11 16-1.1-4.8-3-8-6.2-9.6-2.8 2.8-7.8 3.9-12.6 3-2.4 1.6-3.8 4.2-4.3 7.2z" fill={hairC} />
          <path d="M33.5 17.6c2.6.4 4.6 2 5.4 4.4" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      {look.kind === 'hair' && look.hair === 'curly' && (
        <g fill={hairC}>
          {[[19.6, 27.5, 3.6], [20.6, 22.4, 4], [24.4, 18.4, 4.3], [30, 16.6, 4.6], [35.6, 18.2, 4.3], [39.6, 22.2, 4], [40.6, 27.4, 3.6], [27.4, 21, 3.6], [33, 21, 3.6]].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      )}
      {look.kind === 'kufi' && (
        <>
          <path d="M18.6 26.8C18.8 18.6 23.8 15 30 15s11.2 3.6 11.4 11.8z" fill={look.cap ?? '#f6f5fb'} />
          <path d="M18.6 26.8h22.8" stroke="#000" strokeOpacity=".12" strokeWidth="2" />
          <g fill="#000" opacity=".1">
            <circle cx="24" cy="21" r=".9" />
            <circle cx="30" cy="19" r=".9" />
            <circle cx="36" cy="21" r=".9" />
            <circle cx="27" cy="23.4" r=".9" />
            <circle cx="33" cy="23.4" r=".9" />
          </g>
        </>
      )}

      {/* beard */}
      {beard === 'short' && (
        <path d="M19 31c.4 8.8 4.8 13.6 11 13.6S40.6 39.8 41 31c-1.6 3.6-3.4 5.4-5.6 5.9-1.8-1.1-3.4-1.6-5.4-1.6s-3.6.5-5.4 1.6C22.4 36.4 20.6 34.6 19 31z" fill={hairC} />
      )}
      {beard === 'full' && (
        <path d="M18.8 30c-.3 11 4.5 18.6 11.2 18.6S41.5 41 41.2 30c-1.6 4.4-3.6 6.4-5.8 6.9-1.8-1.1-3.4-1.6-5.4-1.6s-3.6.5-5.4 1.6c-2.2-.5-4.2-2.5-5.8-6.9z" fill={hairC} />
      )}
      {/* no facial features: the face is left blank on purpose */}
    </g>
  );
}

/** The member avatar: the illustration inside an arch-shaped frame (sized by the CSS around it) */
export function Portrait({ look }: { look: Look }) {
  return (
    <svg className={s.portrait} viewBox="0 0 60 70" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <Figure look={look} />
    </svg>
  );
}

/** A round portrait for the hero and the app sketch */
export function Person({ look, tint = 0, size = 56, ring }: { look: Look; tint?: number; size?: number; ring?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="8 10 44 44"
      aria-hidden="true"
      className={s.person}
      style={{ background: TINTS[tint % 5], boxShadow: `0 0 0 ${size > 40 ? 3 : 2}px ${ring ?? 'var(--surface)'}` }}
    >
      <Figure look={look} />
    </svg>
  );
}

/** Looks for the drawn people in the hero and the app sketch */
const CAST: Look[] = [
  { kind: 'hijab', skin: 1, wear: 2 },
  { kind: 'kufi', skin: 3, wear: 1, beard: 'short', hairColor: 2 },
  { kind: 'hair', skin: 2, wear: 4, hair: 'short' },
  { kind: 'hijab', skin: 4, wear: 3 },
  { kind: 'hair', skin: 0, wear: 0, hair: 'curly', hairColor: 1 },
  { kind: 'hijab', skin: 2, wear: 7 },
  { kind: 'kufi', skin: 1, wear: 5, beard: 'full', hairColor: 3 },
];

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
  { tint: 4, x: 3, y: 4, ring: '#c9b7f6', look: CAST[0] },
  { tint: 1, x: 8, y: 58, ring: '#ffd27a', look: CAST[1], typing: true },
  { tint: 3, x: 89, y: 6, ring: '#b9cdf6', look: CAST[2], bubble: 'Assalamu alaikum!' },
  { tint: 2, x: 79, y: 66, ring: '#ffb9a3', look: CAST[3] },
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
          <Person look={p.look} tint={p.tint} ring={p.ring} />
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
          <Person look={CAST[4]} tint={3} size={26} />
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
                <Person key={t} look={CAST[t + 1]} tint={t} size={40} />
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
              <Person look={CAST[t + 3]} tint={t} size={24} />
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
