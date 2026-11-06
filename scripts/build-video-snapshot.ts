/**
 * Builds the Watch offline snapshot (src/lib/videos/snapshot.json) — the public videos served for
 * any channel YouTube can't be reached for. Uses the same loader as /api/videos, then keeps only
 * videos YouTube's oEmbed endpoint confirms are public and embeddable.
 * Run: npx tsx scripts/build-video-snapshot.ts
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { CHANNELS, type Video } from '../src/lib/videos/catalog';
import { loadAll, order } from '../src/lib/videos/source';

async function embeddable(id: string) {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.status === 200) return true;
      if (res.status === 401 || res.status === 403 || res.status === 404) return false; // embedding off / private / removed
    } catch { /* retry */ }
  }
  return false;
}

async function main() {
  const { videos, missing } = await loadAll();
  if (missing.length) console.warn(`Not reachable: ${missing.map(c => c.name).join(', ')}`);

  const kept: Video[] = [];
  for (let i = 0; i < videos.length; i += 10) {
    const batch = videos.slice(i, i + 10);
    const ok = await Promise.all(batch.map(v => embeddable(v.id)));
    kept.push(...batch.filter((_, j) => ok[j]));
  }

  const out = join(__dirname, '..', 'src', 'lib', 'videos', 'snapshot.json');
  writeFileSync(out, `${JSON.stringify({ snapshotDate: new Date().toISOString(), videos: order(kept) })}\n`);
  const per = CHANNELS.map(c => `${c.name}: ${kept.filter(v => v.channelId === c.id).length}`).join(', ');
  console.log(`Kept ${kept.length}/${videos.length} public videos → ${out}\n${per}`);
}

main().catch(e => { console.error(e); process.exit(1); });
