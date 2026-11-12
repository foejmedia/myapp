/*
 * Filled two-tone icons for the community preview, drawn in the same style as the homepage
 * preview (src/home-v2/icons.tsx): a coloured disc with a simple glyph.
 * Also the member avatar: a flat figure with no facial features, so no real person is implied.
 */
import type { ReactNode } from 'react';
import type { CircleIcon } from '@/community/data/circles';
import type { GatheringFormat } from '@/community/data/gatherings';
import type { Look } from '@/community/components/Art';

const Y = '#ffce00';
const B = '#0061ef';
const I = '#3b197f';
const C = '#00a4ff';
const P = '#ffa1cc';
const M = '#8144a8';
const W = '#ffffff';

export type GlyphName = CircleIcon | GatheringFormat['icon'];

const PETALS = Array.from({ length: 5 }, (_, i) => {
  const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
  return { x: +(24 + Math.cos(a) * 6.5).toFixed(2), y: +(22 + Math.sin(a) * 6.5).toFixed(2) };
});

const GLYPHS: Record<GlyphName, { base: string; art: ReactNode }> = {
  sprout: {
    base: Y,
    art: (
      <>
        <rect x="22.6" y="21" width="2.8" height="15" rx="1.4" fill={I} />
        <path fill={W} d="M24 26c0-6.5-4.2-10.5-11.5-10.5 0 6.5 4.2 10.5 11.5 10.5z" />
        <path fill={I} d="M24 23c0-5.5 3.6-9 10.5-9 0 5.5-3.6 9-10.5 9z" />
        <rect x="14.5" y="35" width="19" height="3" rx="1.5" fill={I} />
      </>
    ),
  },
  mic: {
    base: C,
    art: (
      <>
        <rect x="19" y="9.5" width="10" height="18" rx="5" fill={W} />
        <path d="M14.5 23a9.5 9.5 0 0 0 19 0" fill="none" stroke={I} strokeWidth="3" strokeLinecap="round" />
        <rect x="22.6" y="32" width="2.8" height="5" fill={I} />
        <rect x="18" y="36" width="12" height="2.8" rx="1.4" fill={I} />
      </>
    ),
  },
  bookmark: {
    base: M,
    art: (
      <>
        <path fill={W} d="M17.5 11.5h13a2.5 2.5 0 0 1 2.5 2.5v20.8a1 1 0 0 1-1.6.8L24 30.5l-7.4 5.1a1 1 0 0 1-1.6-.8V14a2.5 2.5 0 0 1 2.5-2.5z" />
        <circle cx="24" cy="20.5" r="4" fill={Y} />
      </>
    ),
  },
  repeat: {
    base: B,
    art: (
      <>
        <path d="M14 23a10 10 0 0 1 16.5-7.6" fill="none" stroke={W} strokeWidth="3.6" strokeLinecap="round" />
        <path fill={W} d="M34 11.5v8.5h-8.5z" />
        <path d="M34 25a10 10 0 0 1-16.5 7.6" fill="none" stroke={Y} strokeWidth="3.6" strokeLinecap="round" />
        <path fill={Y} d="M14 36.5V28h8.5z" />
      </>
    ),
  },
  languages: {
    base: P,
    art: (
      <>
        <path fill={I} d="M13.5 11h14a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-8l-4.5 3.6V25h-1.5a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4z" />
        <path fill={W} d="M34.5 21h-9a4 4 0 0 0-4 4v5a4 4 0 0 0 4 4h6.5l4 3.2V34a4 4 0 0 0 2.5-3.7V25a4 4 0 0 0-4-4z" />
      </>
    ),
  },
  lightbulb: {
    base: Y,
    art: (
      <>
        <path fill={W} d="M24 10.5a9.5 9.5 0 0 0-5.5 17.2V29h11v-1.3A9.5 9.5 0 0 0 24 10.5z" />
        <rect x="19" y="30.5" width="10" height="3" rx="1.5" fill={I} />
        <rect x="20.5" y="35" width="7" height="3" rx="1.5" fill={I} />
      </>
    ),
  },
  flower: {
    base: P,
    art: (
      <>
        <rect x="22.8" y="26" width="2.4" height="12" rx="1.2" fill={I} />
        {PETALS.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="5" fill={W} />
        ))}
        <circle cx="24" cy="22" r="4" fill={Y} />
      </>
    ),
  },
  home: {
    base: C,
    art: (
      <>
        <path fill={W} d="M24 11 10.5 22.5h3.5V36a1.5 1.5 0 0 0 1.5 1.5h17a1.5 1.5 0 0 0 1.5-1.5V22.5h3.5z" />
        <rect x="20.5" y="27.5" width="7" height="10" rx="2" fill={Y} />
      </>
    ),
  },
  cap: {
    base: I,
    art: (
      <>
        <path fill={Y} d="M15.5 24.5v6.2c0 .5.2.9.6 1.2 4.6 3.3 11.2 3.3 15.8 0 .4-.3.6-.7.6-1.2v-6.2L24 29z" />
        <path fill={W} d="M23.1 13.3 9.8 20.1a1 1 0 0 0 0 1.8l13.3 6.8a2 2 0 0 0 1.8 0l13.3-6.8a1 1 0 0 0 0-1.8l-13.3-6.8a2 2 0 0 0-1.8 0z" />
      </>
    ),
  },
  door: {
    base: B,
    art: (
      <>
        <path fill={W} d="M14.5 37.5V20a9.5 9.5 0 0 1 19 0v17.5z" />
        <path fill={Y} d="M19.5 37.5v-16a4.5 4.5 0 0 1 9 0v16z" />
        <circle cx="26" cy="30" r="1.4" fill={I} />
      </>
    ),
  },
  users: {
    base: Y,
    art: (
      <>
        <circle cx="31" cy="18.5" r="4.5" fill={I} />
        <path fill={I} d="M23.5 35a7.5 7.5 0 0 1 15 0z" />
        <circle cx="18.5" cy="18" r="5.5" fill={W} />
        <path fill={W} d="M9 36a9.5 9.5 0 0 1 19 0z" />
      </>
    ),
  },
  ear: {
    base: P,
    art: (
      <>
        <path d="M17 21a7.5 7.5 0 0 1 15 0c0 4.5-3.8 6-4.8 9.3-.9 3-2.2 6.2-5.7 6.2" fill="none" stroke={I} strokeWidth="3.6" strokeLinecap="round" />
        <path d="M22 21.5a2.6 2.6 0 0 1 5.2 0" fill="none" stroke={I} strokeWidth="3" strokeLinecap="round" />
        <path d="M35.5 14.5a12 12 0 0 1 0 13" fill="none" stroke={W} strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  },
  sparkles: {
    base: I,
    art: (
      <>
        <path fill={Y} d="m21 10 2.7 7.3L31 20l-7.3 2.7L21 30l-2.7-7.3L11 20l7.3-2.7z" />
        <path fill={W} d="m32.5 26 1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z" />
      </>
    ),
  },
  pin: {
    base: C,
    art: (
      <>
        <path fill={W} d="M24 9.5A10.5 10.5 0 0 0 13.5 20c0 7.4 10.5 18.5 10.5 18.5S34.5 27.4 34.5 20A10.5 10.5 0 0 0 24 9.5z" />
        <circle cx="24" cy="20" r="4.2" fill={Y} />
      </>
    ),
  },
};

/** `base` replaces the disc colour, for a glyph that sits on a block of its own colour */
export function Glyph({ name, size = 48, base }: { name: GlyphName; size?: number; base?: string }) {
  const g = GLYPHS[name];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="24" fill={base ?? g.base} />
      {g.art}
    </svg>
  );
}

/* ---------- member avatars ---------- */

const SKIN = ['#f7d5b5', '#eab38c', '#cf9068', '#a8704b', '#7a4c33'];
const WEAR = [I, B, M, '#281466', '#2d2c2b', '#5f2b89', '#0086d1', '#3b197f'];
const HAIR = ['#2a1d16', '#5a3a26', '#17151f', '#9a98a6'];
const BACK = [Y, P, '#9fd8ff', '#ffe58a', '#ffd0e5'];

const backOf = (name: string) => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return BACK[h % BACK.length];
};

/**
 * A flat figure on a coloured disc: head, hair or hijab, shoulders. No eyes, nose or mouth.
 * The look comes from the data (never guessed from a name); without one, a plain figure is drawn.
 */
export function Member({ name, look, size = 56 }: { name: string; look?: Look; size?: number }) {
  const skin = SKIN[(look?.skin ?? 1) % SKIN.length];
  const wear = WEAR[(look?.wear ?? 0) % WEAR.length];
  const hair = HAIR[(look?.hairColor ?? 0) % HAIR.length];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" style={{ borderRadius: '50%' }}>
      <rect width="48" height="48" fill={backOf(name)} />
      {look?.kind === 'hijab' ? (
        <>
          <path fill={wear} d="M7 50c0-10 7.5-16 17-16s17 6 17 16z" />
          <path fill={wear} d="M12.5 40V23.5a11.5 11.5 0 0 1 23 0V40z" />
          <ellipse cx="24" cy="23.5" rx="6" ry="7" fill={skin} />
        </>
      ) : (
        <>
          <path fill={wear} d="M7 50c0-10 7.5-16 17-16s17 6 17 16z" />
          <rect x="21" y="27" width="6" height="8" rx="3" fill={skin} />
          <circle cx="24" cy="21.5" r="8" fill={skin} />
          {look?.kind === 'kufi' && <path fill={look.cap ?? W} d="M16 20a8 8 0 0 1 16 0z" />}
          {look?.kind === 'hair' && <path fill={hair} d="M15.8 21.5a8.2 8.2 0 0 1 16.4 0c-2.2-3-5-4.3-8.2-4.3s-6 1.3-8.2 4.3z" />}
          {look && look.kind !== 'hijab' && look.beard && (
            <path fill={hair} d={look.beard === 'full' ? 'M16 22.5a8 8 0 0 0 16 0c-2.2 1.4-5 2.2-8 2.2s-5.8-.8-8-2.2z' : 'M17.5 25.5a7.5 7.5 0 0 0 13 0c-2 .8-4.2 1.2-6.5 1.2s-4.5-.4-6.5-1.2z'} />
          )}
        </>
      )}
    </svg>
  );
}
