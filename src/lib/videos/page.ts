/**
 * Reads a channel's public YouTube page (youtube.com/channel/<id>/videos or /shorts) — used when
 * the RSS feed is unavailable (YouTube switches those feeds off from time to time).
 * The page embeds its listing as `ytInitialData` JSON; only public fields are read:
 * id, title, view count and the "3 days ago" label.
 */
import type { Channel, Video } from './catalog';

type Json = Record<string, unknown>;

export const PAGE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  // skips the EU cookie-consent interstitial, which has no video data
  Cookie: 'CONSENT=YES+1; SOCS=CAI',
};

export const pageUrl = (c: Channel, tab: 'videos' | 'shorts') => `https://www.youtube.com/channel/${c.id}/${tab}?hl=en&gl=US`;

export function initialData(html: string): Json | null {
  const start = html.search(/(?:var ytInitialData|window\["ytInitialData"\])\s*=\s*\{/);
  if (start < 0) return null;
  const from = html.indexOf('{', start);
  // the JSON ends at the first `};` followed by the closing script tag
  const end = html.indexOf('};</script>', from);
  if (end < 0) return null;
  try { return JSON.parse(html.slice(from, end + 1)) as Json; } catch { return null; }
}

/** every object stored under `key`, anywhere in the tree */
function collect(node: unknown, key: string, out: Json[] = []): Json[] {
  if (Array.isArray(node)) node.forEach(n => collect(n, key, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Json)) {
      if (k === key && v && typeof v === 'object') out.push(v as Json);
      else collect(v, key, out);
    }
  }
  return out;
}

const get = (o: unknown, ...path: (string | number)[]): unknown =>
  path.reduce<unknown>((n, k) => (n && typeof n === 'object' ? (n as Json)[k as string] : undefined), o);

const UNIT_S: Record<string, number> = { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2592000, year: 31536000 };

/** "8 hours ago" / "Streamed 2 days ago" → an ISO date (approximate, as precise as the label) */
export function fromRelative(label: string, now = Date.now()): string {
  const m = label.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
  return m ? new Date(now - Number(m[1]) * UNIT_S[m[2].toLowerCase()] * 1000).toISOString() : '';
}

/** "4.7 thousand views" / "1.2M views" / "95K views" / "1,234 views" / "No views" → a number */
export function parseViews(label: string): number | null {
  if (/^no views/i.test(label.trim())) return 0;
  const m = label.replace(/,/g, '').match(/([\d.]+)\s*(thousand|million|billion|K|M|B)?\s*views?/i);
  if (!m) return null;
  const mult = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, billion: 1e9 }[(m[2] ?? '').toLowerCase()] ?? 1;
  return Math.round(Number(m[1]) * mult);
}

const ID = /^[\w-]{11}$/;

export function parseChannelPage(html: string, channel: Channel, tab: 'videos' | 'shorts', now = Date.now()): Video[] {
  const data = initialData(html);
  if (!data) return [];
  const base = { channel: channel.name, channelId: channel.id, row: channel.row, summary: '' };

  if (tab === 'shorts') {
    return collect(data, 'shortsLockupViewModel').flatMap(s => {
      const id = get(s, 'onTap', 'innertubeCommand', 'reelWatchEndpoint', 'videoId');
      const title = get(s, 'overlayMetadata', 'primaryText', 'content');
      if (typeof id !== 'string' || !ID.test(id) || typeof title !== 'string' || !title) return [];
      const v = get(s, 'overlayMetadata', 'secondaryText', 'content');
      return [{ ...base, id, title, published: '', views: typeof v === 'string' ? parseViews(v) : null, short: true }];
    });
  }

  return collect(data, 'lockupViewModel').flatMap(l => {
    const id = l.contentId;
    if (l.contentType !== 'LOCKUP_CONTENT_TYPE_VIDEO' || typeof id !== 'string' || !ID.test(id)) return [];
    const meta = get(l, 'metadata', 'lockupMetadataViewModel');
    const title = get(meta, 'title', 'content');
    if (typeof title !== 'string' || !title) return [];
    const parts = ((get(meta, 'metadata', 'contentMetadataViewModel', 'metadataRows') as Json[] | undefined) ?? [])
      .flatMap(r => (r.metadataParts as Json[] | undefined) ?? [])
      .map(p => String(p.accessibilityLabel ?? get(p, 'text', 'content') ?? ''));
    const viewLabel = parts.find(p => /views?$/i.test(p));
    const timeLabel = parts.find(p => /ago$/i.test(p));
    return [{
      ...base, id, title,
      published: timeLabel ? fromRelative(timeLabel, now) : '',
      views: viewLabel ? parseViews(viewLabel) : null,
      short: false,
    }];
  });
}
