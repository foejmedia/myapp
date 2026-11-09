import localFont from 'next/font/local';

/*
 * Manrope, self-hosted (SIL Open Font License).
 *
 * Why not next/font/google: during builds Google Fonts intermittently serves
 * fonts from its dynamic `fonts.gstatic.com/l/font?kit=…` endpoint, whose URLs
 * have no file extension. next/font (15.4) assumes every URL ends in .woff2/.ttf
 * and crashes ("Cannot read properties of null (reading '1')"), failing the
 * whole build at random. Shipping the files avoids the network (see fraunces.ts).
 *
 * next/font needs literal options per call, so each CSS variable gets its own
 * call; the font files are shared and emitted once.
 * Latin subset, variable weight 200–800.
 */

export const manropeBooks = localFont({
  src: [{ path: './manrope/Manrope-latin-variable.woff2', weight: '200 800', style: 'normal' }],
  display: 'swap',
  variable: '--bk-font',
});

export const manropeMosques = localFont({
  src: [{ path: './manrope/Manrope-latin-variable.woff2', weight: '200 800', style: 'normal' }],
  display: 'swap',
  variable: '--mq-font',
});

export const manropeNamaz = localFont({
  src: [{ path: './manrope/Manrope-latin-variable.woff2', weight: '200 800', style: 'normal' }],
  display: 'swap',
  variable: '--nt-font',
});

export const manropeQibla = localFont({
  src: [{ path: './manrope/Manrope-latin-variable.woff2', weight: '200 800', style: 'normal' }],
  display: 'swap',
  variable: '--qb-font',
});

export const manropeQuiz = localFont({
  src: [{ path: './manrope/Manrope-latin-variable.woff2', weight: '200 800', style: 'normal' }],
  display: 'swap',
  variable: '--qz-font',
});

export const manropeRadio = localFont({
  src: [{ path: './manrope/Manrope-latin-variable.woff2', weight: '200 800', style: 'normal' }],
  display: 'swap',
  variable: '--lr-font',
});

export const manropeNoor = localFont({
  src: [{ path: './manrope/Manrope-latin-variable.woff2', weight: '200 800', style: 'normal' }],
  display: 'swap',
  variable: '--nr-font',
});

export const manropeTasbih = localFont({
  src: [{ path: './manrope/Manrope-latin-variable.woff2', weight: '200 800', style: 'normal' }],
  display: 'swap',
  variable: '--tg-font',
});

export const manropeTooba = localFont({
  src: [{ path: './manrope/Manrope-latin-variable.woff2', weight: '200 800', style: 'normal' }],
  display: 'swap',
  variable: '--tb-font',
});

export const manropeVideo = localFont({
  src: [{ path: './manrope/Manrope-latin-variable.woff2', weight: '200 800', style: 'normal' }],
  display: 'swap',
  variable: '--wt-font',
});

export const manropeGame = localFont({
  src: [{ path: './manrope/Manrope-latin-variable.woff2', weight: '200 800', style: 'normal' }],
  display: 'swap',
  variable: '--gd-font-ui',
});

export const manropeLearn = localFont({
  src: [{ path: './manrope/Manrope-latin-variable.woff2', weight: '200 800', style: 'normal' }],
  display: 'swap',
  variable: '--l1-font',
});
