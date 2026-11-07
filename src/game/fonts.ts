import { Amiri, Manrope } from 'next/font/google';
import localFont from 'next/font/local';

/* next/font self-hosts these at build time, so nothing is fetched from Google at runtime. */
export const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--gd-font-ar', display: 'swap' });
export const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--gd-font-ui', display: 'swap' });
/* Fraunces from the repo's own font files (Google sometimes serves it in a way next/font cannot parse). */
export const fraunces = localFont({
  src: [{ path: '../fonts/fraunces/Fraunces-latin-normal.woff2', weight: '100 900', style: 'normal' }],
  variable: '--gd-font-serif',
  display: 'swap',
});
