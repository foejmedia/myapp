import { describe, expect, it } from 'vitest';
import { ago, decode, parseFeed, summarize, views, type Channel } from '../catalog';

const channel: Channel = { id: 'UClUa7-iHJNKEM2e_zWYSPQg', handle: 'YasirQadhi', name: 'Yasir Qadhi', row: 'english' };

const entry = (id: string, title: string, extra = '') => `
 <entry>
  <yt:videoId>${id}</yt:videoId>
  <title>${title}</title>
  <link rel="alternate" href="https://www.youtube.com/${extra.includes('short') ? `shorts/${id}` : `watch?v=${id}`}"/>
  <published>2026-11-05T18:30:07+00:00</published>
  <media:group>
   <media:description>#Islam #Hope

What does it mean to carry a legacy? In this talk we look at the early generations.

Please LIKE, COMMENT, &amp; SHARE!
► Credits: Maqamat</media:description>
   <media:community><media:statistics views="12345"/></media:community>
  </media:group>
 </entry>`;

const feed = `<feed>${entry('kg5bEhCpKKE', 'Will Our Generation Save Islam&#39;s Legacy?')}${entry('abcdefghijk', 'A reminder', 'short')}${entry('bad', 'Broken')}</feed>`;

describe('feed parsing', () => {
  const videos = parseFeed(feed, channel);

  it('reads every valid entry and skips malformed ids', () => {
    expect(videos.map(v => v.id)).toEqual(['kg5bEhCpKKE', 'abcdefghijk']);
  });

  it('decodes titles and keeps channel, row, date and views', () => {
    expect(videos[0]).toMatchObject({
      title: "Will Our Generation Save Islam's Legacy?", channel: 'Yasir Qadhi', row: 'english',
      published: '2026-11-05T18:30:07+00:00', views: 12345, short: false,
    });
  });

  it('marks YouTube Shorts', () => expect(videos[1].short).toBe(true));

  it('summarises the description without hashtags, calls to action or credits', () => {
    expect(videos[0].summary).toBe('What does it mean to carry a legacy? In this talk we look at the early generations.');
  });
});

describe('helpers', () => {
  it('decodes named and numeric entities', () => expect(decode('Tom &amp; Jerry &#8211; &#x27;hi&#x27;')).toBe("Tom & Jerry – 'hi'"));
  it('shortens long summaries on a word boundary', () => {
    const s = summarize('word '.repeat(100), 30);
    expect(s.endsWith('…')).toBe(true);
    expect(s.length).toBeLessThanOrEqual(31);
  });
  it('formats ages and view counts', () => {
    const now = Date.parse('2026-11-06T12:00:00Z');
    expect(ago('2026-11-06T09:00:00Z', now)).toBe('3 hours ago');
    expect(ago('2026-10-06T12:00:00Z', now)).toBe('1 month ago');
    expect(views(1234567)).toBe('1.2M views');
    expect(views(45200)).toBe('45K views');
    expect(views(null)).toBe('');
  });
});
