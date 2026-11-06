/**
 * Live Quran radio — real 24/7 streams, from two open sources:
 *  - MP3Quran.net: dedicated recitation, translation and tafsir channels (mp3quran.net/api/v3/radios)
 *  - Radio Browser: the community directory of broadcast stations worldwide (radio-browser.info)
 * Only Quran-related channels are kept, and only https streams (an https page can't play http audio).
 */

export type Category = 'recitation' | 'translation' | 'tafsir' | 'station';

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'recitation', label: 'Recitations', icon: 'graphic_eq' },
  { id: 'translation', label: 'Translations', icon: 'translate' },
  { id: 'tafsir', label: 'Tafsir', icon: 'menu_book' },
  { id: 'station', label: 'Stations worldwide', icon: 'public' },
];

export interface LiveStation {
  id: string;
  name: string;
  nameAr: string | null;
  streamUrl: string;
  category: Category;
  source: 'MP3Quran' | 'Radio Browser';
  countryCode: string | null;
  country: string | null;
  codec: string | null;
  bitrate: number | null;
  image: string | null;
  homepage: string | null;
  /** listener popularity from Radio Browser; used for ordering */
  votes: number;
}

export interface LiveResponse {
  stations: LiveStation[];
  fetchedAt: string;
  /** a source that couldn't be reached this time */
  missing: string[];
}

// ---------- MP3Quran ----------

export interface Mp3QuranRadio { id: number; name: string; url: string }

/** Channels about other topics (fiqh, seerah, adhkar…) — not Quran */
const NOT_QURAN = /fatwa|biograph|seerah|sira|jurisprud|sahabah|tabe'?een|remembrance|adhkar|azkar|takbe+r|hadith|lecture|stories/i;

export function classifyMp3Quran(name: string): Category | null {
  if (NOT_QURAN.test(name)) return null;
  if (/translat|\bin urdu\b|\bin english\b|translated/i.test(name)) return 'translation';
  if (/tafs|interpretation/i.test(name)) return 'tafsir';
  return 'recitation';
}

/** "Radio Shaik Abu Bakr Al Shatri" → "Shaik Abu Bakr Al Shatri"; "--Quran Tafseer--" → "Quran Tafseer" */
export const cleanName = (s: string) =>
  s.replace(/^[\s-]*radio\s+/i, '').replace(/\s*-\s*radio\s*$/i, '').replace(/^[\s\-–—]+|[\s\-–—]+$/g, '').replace(/\s+/g, ' ').trim();

export function fromMp3Quran(en: Mp3QuranRadio[], ar: Mp3QuranRadio[]): LiveStation[] {
  const arName = new Map(ar.map(r => [r.id, cleanName(r.name)]));
  return en.flatMap(r => {
    const category = classifyMp3Quran(r.name);
    if (!category || !isHttps(r.url)) return [];
    return [{
      id: `mq-${r.id}`,
      name: cleanName(r.name),
      nameAr: arName.get(r.id) || null,
      streamUrl: r.url,
      category,
      source: 'MP3Quran' as const,
      countryCode: null,
      country: null,
      codec: 'MP3',
      bitrate: null,
      image: null,
      homepage: 'https://mp3quran.net',
      votes: 0,
    }];
  });
}

// ---------- Radio Browser ----------

export interface RbStation {
  stationuuid: string;
  name: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  codec: string;
  bitrate: number;
  votes: number;
  clickcount: number;
  lastcheckok: number;
}

const QURAN_WORDS = /qur.?an|koran|coran|kuran|قرآن|قران|tilawa|tilawat|tajw[ie]ed|tarteel|تلاوة|ترتيل/i;
const RECITER_WORDS = /sheikh|shaikh|shaykh|\bqari\b|الشيخ|القارئ/i;
/** stations that only carry a "quran" tag among general programming */
const GENERAL = new Set(['news', 'talk', 'music', 'islamic music', 'pop', 'hadith', 'sport', 'sports', 'national', 'culture']);

/** Quran-related: the name says so, or it's a reciter's channel — not a general station that merely airs some Quran */
export function isQuranStation(s: Pick<RbStation, 'name' | 'tags'>): boolean {
  if (QURAN_WORDS.test(s.name)) return true;
  const tags = s.tags.toLowerCase().split(',').map(t => t.trim());
  if (tags.some(t => GENERAL.has(t))) return false;
  return RECITER_WORDS.test(s.name) || tags.includes('reciter') || tags.includes('recitation');
}

export function fromRadioBrowser(list: RbStation[]): LiveStation[] {
  return list
    .filter(s => s.lastcheckok === 1 && isHttps(s.url_resolved) && isQuranStation(s))
    .map(s => ({
      id: `rb-${s.stationuuid}`,
      name: s.name.replace(/\s+/g, ' ').trim(),
      nameAr: null,
      streamUrl: s.url_resolved,
      category: 'station' as const,
      source: 'Radio Browser' as const,
      countryCode: s.countrycode || null,
      country: s.country || null,
      codec: s.codec || null,
      bitrate: s.bitrate || null,
      image: isHttps(s.favicon) ? s.favicon : null,
      homepage: isHttps(s.homepage) ? s.homepage : null,
      votes: s.votes + s.clickcount,
    }));
}

// ---------- merging ----------

export function isHttps(u: string | null | undefined): u is string {
  try { return !!u && new URL(u).protocol === 'https:'; } catch { return false; }
}

const streamKey = (u: string) => {
  try { const x = new URL(u); return (x.host.replace(/^(www|backup)\./, '') + x.pathname).replace(/\/+$/, '').toLowerCase(); } catch { return u; }
};
const nameKey = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]/gu, '');

/**
 * One entry per stream and per station name. MP3Quran wins over directory copies of its own
 * streams; among same-named directory entries the most popular one stays.
 */
export function mergeStations(mp3quran: LiveStation[], radioBrowser: LiveStation[]): LiveStation[] {
  const out: LiveStation[] = [];
  const streams = new Set<string>();
  const names = new Set<string>();
  const sorted = [...radioBrowser].sort((a, b) => b.votes - a.votes);
  for (const s of [...mp3quran, ...sorted]) {
    const sk = streamKey(s.streamUrl), nk = `${s.category === 'station' ? 's' : 'm'}:${nameKey(s.name)}`;
    if (streams.has(sk) || names.has(nk)) continue;
    streams.add(sk);
    names.add(nk);
    out.push(s);
  }
  return out;
}
