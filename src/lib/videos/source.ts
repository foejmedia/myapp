/**
 * Server-side loading of the Watch catalogue. Per channel: the RSS feed first, and when YouTube
 * has the feed switched off, the channel's public /videos and /shorts pages.
 */
import { CHANNELS, parseFeed, type Channel, type Video } from './catalog';
import { PAGE_HEADERS, pageUrl, parseChannelPage } from './page';

const PER_CHANNEL = 15;
const SHORTS_PER_CHANNEL = 8;

async function text(url: string, headers?: Record<string, string>) {
  const res = await fetch(url, { cache: 'no-store', headers, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function fromFeed(c: Channel) {
  const videos = parseFeed(await text(`https://www.youtube.com/feeds/videos.xml?channel_id=${c.id}`), c);
  if (!videos.length) throw new Error(`empty feed ${c.id}`);
  return videos;
}

async function fromPages(c: Channel) {
  const [long, short] = await Promise.allSettled([
    text(pageUrl(c, 'videos'), PAGE_HEADERS).then(h => parseChannelPage(h, c, 'videos')),
    text(pageUrl(c, 'shorts'), PAGE_HEADERS).then(h => parseChannelPage(h, c, 'shorts')),
  ]);
  const videos = [
    ...(long.status === 'fulfilled' ? long.value.slice(0, PER_CHANNEL) : []),
    ...(short.status === 'fulfilled' ? short.value.slice(0, SHORTS_PER_CHANNEL) : []),
  ];
  if (!videos.length) throw new Error(`no videos on page ${c.id}`);
  return videos;
}

export async function loadChannel(c: Channel): Promise<Video[]> {
  try { return await fromFeed(c); } catch { return fromPages(c); }
}

/** newest first; undated items (Shorts from channel pages) go last, alternating between channels */
export function order(videos: Video[]): Video[] {
  const dated = videos.filter(v => v.published).sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
  const byChannel = new Map<string, Video[]>();
  for (const v of videos) if (!v.published) byChannel.set(v.channelId, [...(byChannel.get(v.channelId) ?? []), v]);
  const undated: Video[] = [];
  for (let i = 0; undated.length < videos.length - dated.length; i++)
    for (const list of byChannel.values()) if (list[i]) undated.push(list[i]);
  return [...dated, ...undated];
}

export async function loadAll(channels = CHANNELS) {
  const results = await Promise.allSettled(channels.map(loadChannel));
  return {
    videos: results.flatMap(r => (r.status === 'fulfilled' ? r.value : [])),
    missing: channels.filter((_, i) => results[i].status === 'rejected'),
  };
}
