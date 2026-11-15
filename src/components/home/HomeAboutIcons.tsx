/**
 * Illustrated icons for the homepage feature cards (HomeAbout), in the flat two-tone style of
 * the Quick Access tiles, in a neutral palette: charcoal, warm grey and stone (no green).
 * Each is a 48×48 SVG meant to sit on a light rounded tile.
 */
const F = '#1c1917'; // charcoal: outlines
const T = '#78716c'; // warm grey: detail lines
const E = '#a8a29e'; // stone: accent fills
const S = '#e7e5e4'; // light stone
const M = '#f5f5f4'; // near-white stone
const W = '#ffffff';

type P = { className?: string };
const svg = (p: P, children: React.ReactNode) => (
  <svg className={p.className} viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

/** Open mushaf on a rehal (stand), with a bookmark ribbon */
export const ReadIcon = (p: P) =>
  svg(p, <>
    <path d="M24 13c-4.5-3-10.5-3.6-16-2v25c5.5-1.6 11.5-1 16 2 4.5-3 10.5-3.6 16-2V11c-5.5-1.6-11.5-1-16 2Z" fill={S} />
    <path d="M24 13c-4.5-3-10.5-3.6-16-2v25c5.5-1.6 11.5-1 16 2V13Z" fill={W} stroke={F} strokeWidth="2" strokeLinejoin="round" />
    <path d="M24 13c4.5-3 10.5-3.6 16-2v25c-5.5-1.6-11.5-1-16 2V13Z" fill={M} stroke={F} strokeWidth="2" strokeLinejoin="round" />
    <path d="M12.5 18.5c2.6-.6 5.4-.4 7.5.6M12.5 23c2.6-.6 5.4-.4 7.5.6M12.5 27.5c2.6-.6 5.4-.4 7.5.6" stroke={T} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M28 19.1c2.1-1 4.9-1.2 7.5-.6M28 23.6c2.1-1 4.9-1.2 7.5-.6" stroke={T} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M31 9.5v10l2.5-2 2.5 2v-10" fill={E} stroke={F} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="m15 41 9-4 9 4" stroke={F} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </>);

/** A Qaida board with Alif and Ba, and a sound wave */
export const QaidaIcon = (p: P) =>
  svg(p, <>
    <rect x="6" y="9" width="30" height="30" rx="6" fill={W} stroke={F} strokeWidth="2" />
    <rect x="10" y="13" width="22" height="22" rx="3.5" fill={M} />
    {/* Alif */}
    <path d="M26.5 17v12" stroke={F} strokeWidth="3" strokeLinecap="round" />
    {/* Ba with its dot */}
    <path d="M13.5 25.5c.3 2.6 2.3 3.6 5.2 3.6h1.4c2.6 0 3.4-1.4 3.2-3.6" stroke={F} strokeWidth="2.6" strokeLinecap="round" fill="none" />
    <circle cx="18.6" cy="32" r="1.6" fill={E} />
    {/* sound */}
    <path d="M40 18c1.8 1.6 2.8 3.7 2.8 6s-1 4.4-2.8 6" stroke={E} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M37.8 21c1 .8 1.5 1.9 1.5 3s-.5 2.2-1.5 3" stroke={T} strokeWidth="2.2" strokeLinecap="round" />
  </>);

/** Headphones with a recitation wave between the ear cups */
export const ListenIcon = (p: P) =>
  svg(p, <>
    <path d="M9 27v-3a15 15 0 0 1 30 0v3" stroke={F} strokeWidth="2.6" strokeLinecap="round" />
    <rect x="6" y="25" width="9" height="14" rx="4" fill={E} stroke={F} strokeWidth="2" />
    <rect x="33" y="25" width="9" height="14" rx="4" fill={E} stroke={F} strokeWidth="2" />
    <rect x="10" y="27.5" width="3" height="9" rx="1.5" fill={W} opacity=".55" />
    <path d="M19 32v-2M22 34v-6M25 35v-8M28 33v-4" stroke={T} strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="36" cy="12" r="5" fill={S} />
    <path d="M34.6 9.6v4.2l3.4-2.1-3.4-2.1Z" fill={F} />
  </>);

/** A heart held in a loop of repetition: what is learned by heart stays */
export const MemorizeIcon = (p: P) =>
  svg(p, <>
    <circle cx="24" cy="24" r="17" fill={M} />
    <path d="M38.5 18A15 15 0 0 0 11 14.5" stroke={T} strokeWidth="2.4" strokeLinecap="round" />
    <path d="m36.6 11.7 2 6.4-6.4 1.4" stroke={T} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.5 30A15 15 0 0 0 37 33.5" stroke={E} strokeWidth="2.4" strokeLinecap="round" />
    <path d="m11.4 36.3-2-6.4 6.4-1.4" stroke={E} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 33.5s-8.5-5-8.5-10.6a4.6 4.6 0 0 1 8.5-2.4 4.6 4.6 0 0 1 8.5 2.4c0 5.6-8.5 10.6-8.5 10.6Z" fill={W} stroke={F} strokeWidth="2" strokeLinejoin="round" />
    <path d="m20.6 24 2.4 2.4 4.4-4.4" stroke={E} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </>);

/** Colour-coded ayah lines (tajweed colours) with a microphone */
export const TajweedIcon = (p: P) =>
  svg(p, <>
    <rect x="5" y="8" width="30" height="26" rx="6" fill={W} stroke={F} strokeWidth="2" />
    <path d="M14 34v6l6-6" fill={W} stroke={F} strokeWidth="2" strokeLinejoin="round" />
    <path d="M10 16h8" stroke={E} strokeWidth="3" strokeLinecap="round" />
    <path d="M21.5 16H30" stroke={F} strokeWidth="3" strokeLinecap="round" />
    <path d="M10 22h5" stroke={F} strokeWidth="3" strokeLinecap="round" />
    <path d="M18 22h12" stroke={T} strokeWidth="3" strokeLinecap="round" />
    <path d="M10 28h11" stroke={S} strokeWidth="3" strokeLinecap="round" />
    <path d="M24 28h3" stroke={E} strokeWidth="3" strokeLinecap="round" />
    <rect x="35" y="20" width="8" height="13" rx="4" fill={E} stroke={F} strokeWidth="2" />
    <path d="M32.5 29a6.5 6.5 0 0 0 13 0M39 35.5V40" stroke={F} strokeWidth="2" strokeLinecap="round" />
  </>);

/** A lamp of understanding over an open page */
export const TafseerIcon = (p: P) =>
  svg(p, <>
    <circle cx="24" cy="17" r="12" fill={M} />
    <path d="M24 6.5a9.5 9.5 0 0 0-5.6 17.2c1 .7 1.6 1.8 1.6 3V28h8v-1.3c0-1.2.6-2.3 1.6-3A9.5 9.5 0 0 0 24 6.5Z" fill={W} stroke={F} strokeWidth="2" strokeLinejoin="round" />
    <path d="M21 17.5 24 21l3-3.5" stroke={E} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20.5 31h7" stroke={F} strokeWidth="2.2" strokeLinecap="round" />
    <path d="M24 34c-4-2.2-9.6-2.7-15-1.4V41c5.4-1.3 11-.8 15 1.4 4-2.2 9.6-2.7 15-1.4v-8.4c-5.4-1.3-11-.8-15 1.4Z" fill={S} stroke={F} strokeWidth="2" strokeLinejoin="round" />
    <path d="M24 34v8.4" stroke={F} strokeWidth="1.6" />
    <path d="M10 11.5 7.5 10M38 11.5l2.5-1.5M24 3V1.5" stroke={E} strokeWidth="2" strokeLinecap="round" />
  </>);

export const HOME_ABOUT_ICONS = {
  read: ReadIcon,
  qaida: QaidaIcon,
  listen: ListenIcon,
  memorize: MemorizeIcon,
  tajweed: TajweedIcon,
  tafseer: TafseerIcon,
} as const;

export type HomeAboutIconKey = keyof typeof HOME_ABOUT_ICONS;
