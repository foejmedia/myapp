import { describe, expect, it } from 'vitest';
import type { Channel, Video } from '../catalog';
import { fromRelative, parseChannelPage, parseViews } from '../page';
import { order } from '../source';

const channel: Channel = { id: 'UCmMcOjsVehVlEOteyrhjI2Q', handle: 'alafasy', name: 'Mishary Alafasy', row: 'recitation' };
const NOW = Date.parse('2026-11-06T12:00:00Z');

const lockup = (id: string, title: string, parts: [string, string][]) => ({
  lockupViewModel: {
    contentId: id, contentType: 'LOCKUP_CONTENT_TYPE_VIDEO',
    metadata: { lockupMetadataViewModel: {
      title: { content: title },
      metadata: { contentMetadataViewModel: { metadataRows: [{ metadataParts: parts.map(([text, label]) => ({ text: { content: text }, accessibilityLabel: label })) }] } },
    } },
  },
});
const short = (id: string, title: string, viewsText: string) => ({
  shortsLockupViewModel: {
    onTap: { innertubeCommand: { reelWatchEndpoint: { videoId: id } } },
    overlayMetadata: { primaryText: { content: title }, secondaryText: { content: viewsText } },
  },
});
const page = (items: unknown[]) =>
  `<html><script>var ytInitialData = ${JSON.stringify({ contents: { tabs: [{ richGridRenderer: { contents: items.map(content => ({ richItemRenderer: { content } })) } }] } })};</script></html>`;

describe('channel page parsing', () => {
  it('reads videos with their views and upload time', () => {
    const html = page([
      lockup('WbheiQw6PnE', 'Surah Al-Kahf', [['4.7K', '4.7 thousand views'], ['8h ago', '8 hours ago']]),
      lockup('bad', 'Broken id', []),
      { lockupViewModel: { contentId: 'PLxxxxxxxxx', contentType: 'LOCKUP_CONTENT_TYPE_PLAYLIST' } },
    ]);
    const [v, ...rest] = parseChannelPage(html, channel, 'videos', NOW);
    expect(rest).toHaveLength(0);
    expect(v).toMatchObject({ id: 'WbheiQw6PnE', title: 'Surah Al-Kahf', views: 4700, short: false, row: 'recitation', channel: 'Mishary Alafasy' });
    expect(v.published).toBe('2026-11-06T04:00:00.000Z');
  });

  it('reads Shorts', () => {
    const vids = parseChannelPage(page([short('wOPIzJ6HWFw', 'A reminder', '95K views')]), channel, 'shorts', NOW);
    expect(vids).toEqual([expect.objectContaining({ id: 'wOPIzJ6HWFw', title: 'A reminder', views: 95000, short: true, published: '' })]);
  });

  it('returns nothing for a page without data (consent wall, error page)', () => {
    expect(parseChannelPage('<html>Before you continue</html>', channel, 'videos')).toEqual([]);
  });

  it('parses view and time labels', () => {
    expect(parseViews('1,234 views')).toBe(1234);
    expect(parseViews('1.2M views')).toBe(1200000);
    expect(parseViews('3 million views')).toBe(3000000);
    expect(parseViews('No views')).toBe(0);
    expect(fromRelative('Streamed 2 days ago', NOW)).toBe('2026-11-04T12:00:00.000Z');
    expect(fromRelative('Premieres soon', NOW)).toBe('');
  });
});

describe('ordering', () => {
  const v = (id: string, channelId: string, published: string) => ({ id, channelId, published } as Video);
  it('puts newest first and alternates undated Shorts between channels', () => {
    const out = order([v('a1', 'A', ''), v('a2', 'A', ''), v('b1', 'B', ''), v('old', 'A', '2026-01-01'), v('new', 'B', '2026-11-01')]);
    expect(out.map(x => x.id)).toEqual(['new', 'old', 'a1', 'b1', 'a2']);
  });
});
