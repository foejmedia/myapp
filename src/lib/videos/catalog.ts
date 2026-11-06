/**
 * LearnQuran Watch — the video catalogue.
 *
 * Videos come from the public YouTube feeds of the channels below
 * (youtube.com/feeds/videos.xml?channel_id=…: free, no API key, latest ~15 uploads each).
 * Titles, thumbnails and dates are YouTube's own; videos play in YouTube's embedded player.
 * To add or move a channel, edit CHANNELS — the id is the channel's "UC…" id.
 */

export type RowId = 'recitation' | 'english' | 'urdu' | 'kids' | 'tv';

export const ROWS: { id: RowId; title: string; short: string; icon: string }[] = [
  { id: 'recitation', title: 'Quran Recitation', short: 'Recitation', icon: 'menu_book' },
  { id: 'english', title: 'Lectures in English', short: 'English', icon: 'record_voice_over' },
  { id: 'urdu', title: 'Urdu Bayan', short: 'Urdu', icon: 'translate' },
  { id: 'kids', title: 'Kids & Family', short: 'Kids', icon: 'child_care' },
  { id: 'tv', title: 'Islamic TV', short: 'TV', icon: 'live_tv' },
];

export interface Channel { id: string; handle: string; name: string; row: RowId }

export const CHANNELS: Channel[] = [
  { id: 'UCmMcOjsVehVlEOteyrhjI2Q', handle: 'alafasy', name: 'Mishary Alafasy', row: 'recitation' },
  { id: 'UCt2q-yViX-xRLjt3Si81EFQ', handle: 'ElMenshawiOfficial', name: 'Al-Minshawi (official)', row: 'recitation' },
  { id: 'UCaZEQtIQkmaWnj3dPeYw9xA', handle: 'MaherAlMuaiqly', name: 'Maher Al-Muaiqly', row: 'recitation' },
  { id: 'UCBc5f-MDWCEzjYD_w4F9CVw', handle: 'Haramayn', name: 'Al-Haramain', row: 'recitation' },
  { id: 'UClUa7-iHJNKEM2e_zWYSPQg', handle: 'YasirQadhi', name: 'Yasir Qadhi', row: 'english' },
  { id: 'UCfixwe9f_s9J8cY7DS7YSLw', handle: 'yaqeeninstituteofficial', name: 'Yaqeen Institute', row: 'english' },
  { id: 'UCpPDkiIaxYvztFRgsnlrKBw', handle: 'EPICMASJID', name: 'EPIC Masjid', row: 'english' },
  { id: 'UCMXTpghT0GDywgzdguz9u0w', handle: 'ShaykhZulfiqarAhmadOfficial', name: 'Shaykh Zulfiqar Ahmad', row: 'urdu' },
  { id: 'UCyjWUqLLambgJbTTMfuizvg', handle: 'DrIsrarAhmed4K', name: 'Dr. Israr Ahmed', row: 'urdu' },
  { id: 'UCiZL26ScfRZDdEAkkPJgJbA', handle: 'OmarHanaIslamicSongsforKids', name: 'Omar & Hana', row: 'kids' },
  { id: 'UCzbemOcDqEhq5TJ6vWzJsvA', handle: 'ZainBhikhaKids', name: 'Zain Bhikha Kids', row: 'kids' },
  { id: 'UC21WX49pR42x-d1tPnhSP5g', handle: 'MyUmmahKidsTV', name: 'My Ummah Kids TV', row: 'kids' },
  { id: 'UC16U9Mzm9w6gniOGXRGAEig', handle: 'IQRATVOFFICIAL', name: 'IQRA TV', row: 'tv' },
  { id: 'UCKQkz17Nh6BJZBd0eHhWdJQ', handle: 'ZikrullahTV', name: 'Zikrullah TV', row: 'tv' },
];

export interface Video {
  id: string;
  title: string;
  channel: string;
  channelId: string;
  row: RowId;
  published: string;
  /** a short summary from the description, or '' */
  summary: string;
  views: number | null;
  /** YouTube Short (vertical clip) */
  short: boolean;
}

export interface CatalogResponse {
  videos: Video[];
  fetchedAt: string;
  /** channels whose feed couldn't be read this time */
  missing: string[];
}

// ---------- feed parsing ----------

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" };
export const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e] ?? m;
  });

const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1].trim()) : '';
};

/**
 * The first real sentence or two of a description — skipping hashtags, links,
 * "please like and share" lines and divider rules.
 */
export function summarize(description: string, max = 220) {
  const lines = description.split(/\r?\n/).map(l => l.trim()).filter(l =>
    l && !/^[#►▶•*\-–—=_~]/.test(l) && !/https?:\/\//.test(l) && !/^(please\s+)?(like|subscribe|share|comment)/i.test(l)
    && !/^(credits?|follow us|donate|support)\b/i.test(l));
  const text = lines.join(' ').replace(/\s+/g, ' ').replace(/#\S+/g, '').trim();
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
}

export function parseFeed(xml: string, channel: Channel): Video[] {
  return (xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? []).flatMap(entry => {
    const id = tag(entry, 'yt:videoId');
    const title = tag(entry, 'title');
    if (!/^[\w-]{11}$/.test(id) || !title) return [];
    const views = entry.match(/<media:statistics views="(\d+)"/);
    return [{
      id,
      title,
      channel: channel.name,
      channelId: channel.id,
      row: channel.row,
      published: tag(entry, 'published'),
      summary: summarize(tag(entry, 'media:description')),
      views: views ? Number(views[1]) : null,
      short: entry.includes('href="https://www.youtube.com/shorts/'),
    }];
  });
}

// ---------- display helpers ----------

export const thumb = (id: string, size: 'card' | 'hero' | 'hq' | 'short') =>
  `https://i.ytimg.com/vi/${id}/${{ card: 'mqdefault', hero: 'maxresdefault', hq: 'hqdefault', short: 'oardefault' }[size]}.jpg`;

export function ago(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  const units: [number, string][] = [[31536000, 'year'], [2592000, 'month'], [604800, 'week'], [86400, 'day'], [3600, 'hour'], [60, 'minute']];
  for (const [sec, name] of units) {
    const n = Math.floor(s / sec);
    if (n >= 1) return `${n} ${name}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export function views(n: number | null) {
  if (n == null) return '';
  const f = (x: number, u: string) => `${x >= 10 ? Math.round(x) : Math.round(x * 10) / 10}${u}`;
  const v = n >= 1e9 ? f(n / 1e9, 'B') : n >= 1e6 ? f(n / 1e6, 'M') : n >= 1e3 ? f(n / 1e3, 'K') : String(n);
  return `${v} views`;
}
