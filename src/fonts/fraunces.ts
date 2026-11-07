import localFont from 'next/font/local';

/*
 * Fraunces, self-hosted (SIL Open Font License; latin subset, variable 100–900).
 *
 * Why not next/font/google: during builds Google Fonts intermittently serves
 * Fraunces from its dynamic `fonts.gstatic.com/l/font?kit=…` endpoint, whose
 * URLs have no file extension. next/font (15.4) assumes every URL ends in
 * .woff2/.ttf and crashes ("Cannot read properties of null (reading '1')"),
 * failing the whole build at random. Shipping the files avoids the network.
 *
 * next/font needs literal options per call, so each CSS variable gets its own
 * call; the font files are shared and emitted once.
 */

export const frauncesBooks = localFont({
  src: [
    { path: './fraunces/Fraunces-latin-normal.woff2', weight: '100 900', style: 'normal' },
    { path: './fraunces/Fraunces-latin-italic.woff2', weight: '100 900', style: 'italic' },
  ],
  display: 'swap',
  variable: '--bk-serif',
});

export const frauncesNoor = localFont({
  src: [
    { path: './fraunces/Fraunces-latin-normal.woff2', weight: '100 900', style: 'normal' },
    { path: './fraunces/Fraunces-latin-italic.woff2', weight: '100 900', style: 'italic' },
  ],
  display: 'swap',
  variable: '--nr-serif',
});

export const frauncesTooba = localFont({
  src: [
    { path: './fraunces/Fraunces-latin-normal.woff2', weight: '100 900', style: 'normal' },
    { path: './fraunces/Fraunces-latin-italic.woff2', weight: '100 900', style: 'italic' },
  ],
  display: 'swap',
  variable: '--tb-serif',
});

export const frauncesGame = localFont({
  src: [{ path: './fraunces/Fraunces-latin-normal.woff2', weight: '100 900', style: 'normal' }],
  display: 'swap',
  variable: '--gd-font-serif',
});
