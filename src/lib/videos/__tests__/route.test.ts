import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHANNELS } from '../catalog';

describe('/api/videos when YouTube is unreachable', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('serves the bundled public videos for every channel', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { GET } = await import('@/app/api/videos/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.missing).toEqual([]);
    expect(new Set(data.videos.map((v: { channelId: string }) => v.channelId)).size).toBe(CHANNELS.length);
    expect(data.videos.some((v: { short: boolean }) => !v.short)).toBe(true);
  });
});
