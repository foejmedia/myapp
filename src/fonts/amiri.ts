import localFont from 'next/font/local';

/*
 * Amiri, self-hosted (SIL Open Font License).
 *
 * Why not next/font/google: during builds Google Fonts intermittently serves
 * fonts from its dynamic `fonts.gstatic.com/l/font?kit=…` endpoint, whose URLs
 * have no file extension. next/font (15.4) assumes every URL ends in .woff2/.ttf
 * and crashes ("Cannot read properties of null (reading '1')"), failing the
 * whole build at random. Shipping the files avoids the network (see fraunces.ts).
 *
 * next/font needs literal options per call, so each CSS variable gets its own
 * call; the font files are shared and emitted once.
 * Arabic subset, weights 400 and 700.
 */

export const amiriMosques = localFont({
  src: [
    { path: './amiri/Amiri-arabic-400.woff2', weight: '400', style: 'normal' },
    { path: './amiri/Amiri-arabic-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--mq-font-ar',
});

export const amiriNamaz = localFont({
  src: [
    { path: './amiri/Amiri-arabic-400.woff2', weight: '400', style: 'normal' },
    { path: './amiri/Amiri-arabic-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--nt-font-ar',
});

export const amiriQibla = localFont({
  src: [
    { path: './amiri/Amiri-arabic-400.woff2', weight: '400', style: 'normal' },
    { path: './amiri/Amiri-arabic-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--qb-font-ar',
});

export const amiriRadio = localFont({
  src: [
    { path: './amiri/Amiri-arabic-400.woff2', weight: '400', style: 'normal' },
    { path: './amiri/Amiri-arabic-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--lr-font-ar',
});

export const amiriNoor = localFont({
  src: [
    { path: './amiri/Amiri-arabic-400.woff2', weight: '400', style: 'normal' },
    { path: './amiri/Amiri-arabic-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--nr-font-ar',
});

export const amiriTasbih = localFont({
  src: [
    { path: './amiri/Amiri-arabic-400.woff2', weight: '400', style: 'normal' },
    { path: './amiri/Amiri-arabic-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--tg-font-ar',
});

export const amiriTooba = localFont({
  src: [
    { path: './amiri/Amiri-arabic-400.woff2', weight: '400', style: 'normal' },
    { path: './amiri/Amiri-arabic-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--tb-font-ar',
});

export const amiriGame = localFont({
  src: [
    { path: './amiri/Amiri-arabic-400.woff2', weight: '400', style: 'normal' },
    { path: './amiri/Amiri-arabic-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--gd-font-ar',
});
