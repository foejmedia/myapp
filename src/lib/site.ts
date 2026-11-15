/**
 * The site's public address and name — the single source for canonical URLs, the sitemap,
 * robots.txt, Open Graph and structured data. Set NEXT_PUBLIC_SITE_URL to override
 * (e.g. on a staging deploy); no trailing slash.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://learnquran.app').replace(/\/+$/, '');
export const SITE_NAME = 'Learn Quran';

/** Absolute URL for a path on this site. */
export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
