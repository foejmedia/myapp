/*
 * Filled, rounded icons for the homepage preview: a coloured disc with a two-tone glyph.
 * Drawn here so the page needs no icon font and no monoline set.
 */
import type { ReactNode } from 'react';

const Y = '#ffce00';
const B = '#0061ef';
const I = '#3b197f';
const C = '#00a4ff';
const P = '#ffa1cc';
const M = '#8144a8';
const W = '#ffffff';
const K = '#2d2c2b';

export type IconName =
  | 'read'
  | 'mushaf'
  | 'wbw'
  | 'tafseer'
  | 'search'
  | 'learn'
  | 'hifz'
  | 'tajweed'
  | 'quiz'
  | 'library'
  | 'player'
  | 'radio'
  | 'headphones'
  | 'watch'
  | 'dua'
  | 'hadith'
  | 'namaz'
  | 'tasbih'
  | 'qibla'
  | 'mosque'
  | 'schedule';

const BEADS = Array.from({ length: 9 }, (_, i) => {
  const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
  return { x: +(24 + Math.cos(a) * 9.5).toFixed(2), y: +(21.5 + Math.sin(a) * 9.5).toFixed(2) };
});

const GLYPHS: Record<IconName, { base: string; art: ReactNode }> = {
  read: {
    base: I,
    art: (
      <>
        <path fill={W} d="M22.8 16.2c-3-2-6.8-2.6-10.3-1.6a1 1 0 0 0-.7 1v15.2a1 1 0 0 0 1.3 1c3.2-.9 6.6-.4 9.7 1.4z" />
        <path fill={Y} d="M25.2 16.2c3-2 6.8-2.6 10.3-1.6a1 1 0 0 1 .7 1v15.2a1 1 0 0 1-1.3 1c-3.2-.9-6.6-.4-9.7 1.4z" />
      </>
    ),
  },
  mushaf: {
    base: Y,
    art: (
      <>
        <rect x="17.5" y="11" width="18" height="23" rx="3.5" fill={I} />
        <rect x="12.5" y="14.5" width="18" height="23" rx="3.5" fill={W} />
        <rect x="16.5" y="20" width="10" height="2.6" rx="1.3" fill={I} />
        <rect x="16.5" y="25" width="10" height="2.6" rx="1.3" fill={I} />
        <rect x="16.5" y="30" width="6" height="2.6" rx="1.3" fill={I} />
      </>
    ),
  },
  wbw: {
    base: C,
    art: (
      <>
        <rect x="9.5" y="13.5" width="13.5" height="11" rx="4" fill={W} />
        <rect x="25" y="13.5" width="13.5" height="11" rx="4" fill={I} />
        <rect x="9.5" y="27" width="13.5" height="8" rx="4" fill={I} />
        <rect x="25" y="27" width="13.5" height="8" rx="4" fill={W} />
      </>
    ),
  },
  tafseer: {
    base: P,
    art: (
      <>
        <path fill={Y} d="M24 10.5a9.5 9.5 0 0 0-5.5 17.2V29h11v-1.3A9.5 9.5 0 0 0 24 10.5z" />
        <rect x="19" y="30.5" width="10" height="3" rx="1.5" fill={K} />
        <rect x="20.5" y="35" width="7" height="3" rx="1.5" fill={K} />
      </>
    ),
  },
  search: {
    base: K,
    art: (
      <>
        <circle cx="22" cy="22" r="7.5" fill="none" stroke={W} strokeWidth="4" />
        <path d="M28 28l6.5 6.5" stroke={Y} strokeWidth="4.4" strokeLinecap="round" />
      </>
    ),
  },
  learn: {
    base: B,
    art: (
      <>
        <path fill={Y} d="M15.5 24.5v6.2c0 .5.2.9.6 1.2 4.6 3.3 11.2 3.3 15.8 0 .4-.3.6-.7.6-1.2v-6.2L24 29z" />
        <path fill={W} d="M23.1 13.3L9.8 20.1a1 1 0 0 0 0 1.8l13.3 6.8a2 2 0 0 0 1.8 0l13.3-6.8a1 1 0 0 0 0-1.8l-13.3-6.8a2 2 0 0 0-1.8 0z" />
      </>
    ),
  },
  hifz: {
    base: M,
    art: (
      <>
        <path fill={W} d="M17.5 11.5h13a2.5 2.5 0 0 1 2.5 2.5v20.8a1 1 0 0 1-1.6.8L24 30.5l-7.4 5.1a1 1 0 0 1-1.6-.8V14a2.5 2.5 0 0 1 2.5-2.5z" />
        <circle cx="24" cy="20.5" r="4" fill={Y} />
      </>
    ),
  },
  tajweed: {
    base: Y,
    art: (
      <>
        <rect x="11.5" y="20.5" width="4.6" height="7" rx="2.3" fill={I} />
        <rect x="18.2" y="15" width="4.6" height="18" rx="2.3" fill={I} />
        <rect x="24.9" y="11" width="4.6" height="26" rx="2.3" fill={I} />
        <rect x="31.6" y="17.5" width="4.6" height="13" rx="2.3" fill={I} />
      </>
    ),
  },
  quiz: {
    base: C,
    art: (
      <>
        <path fill={W} d="M15.5 11.5h17a4.5 4.5 0 0 1 4.5 4.5v11a4.5 4.5 0 0 1-4.5 4.5h-7.7l-5.7 4.7a1 1 0 0 1-1.6-.8v-3.9h-2a4.5 4.5 0 0 1-4.5-4.5V16a4.5 4.5 0 0 1 4.5-4.5z" />
        <path d="M18.5 21.8l3.8 3.8 7.2-7.4" fill="none" stroke={I} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  library: {
    base: P,
    art: (
      <>
        <rect x="12" y="14" width="7" height="21" rx="2.5" fill={I} />
        <rect x="20.5" y="17.5" width="7" height="17.5" rx="2.5" fill={W} />
        <rect x="29" y="12" width="7" height="23" rx="2.5" fill={B} />
      </>
    ),
  },
  player: {
    base: I,
    art: <path fill={Y} d="M19 15.3v17.4a1.8 1.8 0 0 0 2.8 1.5l13.2-8.7a1.8 1.8 0 0 0 0-3l-13.2-8.7a1.8 1.8 0 0 0-2.8 1.5z" />,
  },
  radio: {
    base: B,
    art: (
      <>
        <path d="M15.5 18.5l15-7" stroke={W} strokeWidth="3" strokeLinecap="round" />
        <rect x="10.5" y="18" width="27" height="17.5" rx="5" fill={W} />
        <circle cx="19" cy="26.8" r="4.6" fill={B} />
        <rect x="27" y="23" width="6.5" height="2.8" rx="1.4" fill={Y} />
        <rect x="27" y="28" width="6.5" height="2.8" rx="1.4" fill={K} />
      </>
    ),
  },
  headphones: {
    base: P,
    art: (
      <>
        <path d="M13.5 28v-4a10.5 10.5 0 0 1 21 0v4" fill="none" stroke={I} strokeWidth="3.6" strokeLinecap="round" />
        <rect x="10.5" y="24.5" width="7.5" height="12" rx="3.7" fill={I} />
        <rect x="30" y="24.5" width="7.5" height="12" rx="3.7" fill={I} />
      </>
    ),
  },
  watch: {
    base: C,
    art: (
      <>
        <rect x="9.5" y="13.5" width="29" height="21" rx="5.5" fill={W} />
        <path fill={I} d="M21 19.3v9.4a1 1 0 0 0 1.5.9l7.8-4.7a1 1 0 0 0 0-1.8l-7.8-4.7a1 1 0 0 0-1.5.9z" />
      </>
    ),
  },
  dua: {
    base: M,
    art: (
      <>
        <rect x="13.2" y="14" width="9" height="21" rx="4.5" transform="rotate(-13 17.7 24.5)" fill={W} />
        <rect x="25.8" y="14" width="9" height="21" rx="4.5" transform="rotate(13 30.3 24.5)" fill={Y} />
      </>
    ),
  },
  hadith: {
    base: Y,
    art: (
      <>
        <rect x="14" y="14" width="20" height="23" rx="4" fill={W} />
        <rect x="10.5" y="10.5" width="27" height="7" rx="3.5" fill={I} />
        <rect x="18" y="21.5" width="12" height="2.6" rx="1.3" fill={I} />
        <rect x="18" y="26.5" width="12" height="2.6" rx="1.3" fill={I} />
        <rect x="18" y="31.5" width="7" height="2.6" rx="1.3" fill={I} />
      </>
    ),
  },
  namaz: {
    base: B,
    art: (
      <>
        <rect x="14.5" y="10" width="19" height="28" rx="4" fill={W} />
        <path fill={Y} d="M18.5 33.5v-9.5c0-3.5 2.5-5.5 5.5-8 3 2.5 5.5 4.5 5.5 8v9.5z" />
      </>
    ),
  },
  tasbih: {
    base: P,
    art: (
      <>
        {BEADS.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r="3" fill={i === 0 ? Y : I} />
        ))}
        <rect x="22.7" y="31" width="2.6" height="7.5" rx="1.3" fill={I} />
      </>
    ),
  },
  qibla: {
    base: I,
    art: (
      <>
        <circle cx="24" cy="24" r="12.5" fill={W} />
        <path fill={B} d="M24 14l4.2 10h-8.4z" />
        <path fill={P} d="M24 34l-4.2-10h8.4z" />
        <circle cx="24" cy="24" r="2" fill={K} />
      </>
    ),
  },
  mosque: {
    base: C,
    art: (
      <>
        <circle cx="24" cy="10.8" r="2.2" fill={Y} />
        <path fill={W} d="M13 35.5V26c0-5.5 4.5-9 11-12.5 6.5 3.5 11 7 11 12.5v9.5a1 1 0 0 1-1 1H14a1 1 0 0 1-1-1z" />
        <path fill={I} d="M20.5 36.5V30a3.5 3.5 0 0 1 7 0v6.5z" />
      </>
    ),
  },
  schedule: {
    base: Y,
    art: (
      <>
        <rect x="11.5" y="13" width="25" height="24" rx="5.5" fill={W} />
        <path fill={I} d="M11.5 18.5a5.5 5.5 0 0 1 5.5-5.5h14a5.5 5.5 0 0 1 5.5 5.5v3h-25z" />
        <circle cx="18.5" cy="27" r="2" fill={K} />
        <circle cx="24" cy="27" r="2" fill={K} />
        <circle cx="29.5" cy="27" r="2" fill={K} />
        <circle cx="18.5" cy="32.2" r="2" fill={K} />
        <circle cx="24" cy="32.2" r="2" fill={B} />
      </>
    ),
  },
};

export function Icon({ name, size = 48, bare = false }: { name: IconName; size?: number; bare?: boolean }) {
  const g = GLYPHS[name];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {!bare && <circle cx="24" cy="24" r="24" fill={g.base} />}
      {g.art}
    </svg>
  );
}

/** Learn Quran's own mark: an open book on an indigo tile */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="12" fill={I} />
      <path fill={W} d="M19 13.3c-2.6-1.7-5.8-2.2-8.8-1.4a.9.9 0 0 0-.7.9v13.4a.9.9 0 0 0 1.1.9c2.9-.7 5.8-.3 8.4 1.3z" />
      <path fill={Y} d="M21 13.3c2.6-1.7 5.8-2.2 8.8-1.4a.9.9 0 0 1 .7.9v13.4a.9.9 0 0 1-1.1.9c-2.9-.7-5.8-.3-8.4 1.3z" />
    </svg>
  );
}
