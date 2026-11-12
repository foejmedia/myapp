/**
 * Where the community lives and how it reaches the rest of Learn Quran.
 *
 * Today it is mounted at learnquran.app/community. To move it to a subdomain
 * (community.learnquran.app), set in that deployment's environment:
 *
 *   NEXT_PUBLIC_COMMUNITY_BASE=""                       (pages sit at the root)
 *   NEXT_PUBLIC_MAIN_SITE="https://learnquran.app"      (tool links become absolute)
 *
 * Every link in this module goes through `to()` or `site()`, so nothing else changes.
 */
export const BASE = process.env.NEXT_PUBLIC_COMMUNITY_BASE ?? '/community';
export const MAIN_SITE = process.env.NEXT_PUBLIC_MAIN_SITE ?? '';

/** A page inside the community: to('/join') */
export const to = (page = '') => `${BASE}${page}` || '/';

/** A page on the main Learn Quran site: site('/tajweed') */
export const site = (page = '/') => `${MAIN_SITE}${page}`;

/**
 * Applications are sent to this WhatsApp number as a pre-filled message, because there is
 * no backend yet. It is the number the homepage already publishes. Digits only, with country code.
 */
export const WHATSAPP_NUMBER = '916204130133';

/**
 * While true, the example members and stories in `data/` are shown, each marked "Example",
 * with a note at the top of those pages. Set it to false once real members exist: the pages
 * then show only real entries, or a short "opening soon" state when there are none.
 */
export const PREVIEW = true;

export const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/learnquranapp_' },
  { label: 'X', href: 'https://x.com/learnquranapp_' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/learnquranapp' },
];
