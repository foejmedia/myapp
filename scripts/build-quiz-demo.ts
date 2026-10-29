/**
 * Builds the Quran Quiz offline demo snapshot from the Quran.com API, through the same
 * loader and checks the live quiz uses. Run: npx tsx scripts/build-quiz-demo.ts
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { loadContent } from '../src/lib/quiz/source';

const SURAHS = [1, 67, 97, 103, 105, 106, 108, 109, 110, 111, 112, 113, 114];

async function main() {
  const content = await loadContent(SURAHS, 'en');
  const out = join(__dirname, '..', 'src', 'lib', 'quiz', 'demo-content.json');
  writeFileSync(out, JSON.stringify({ ...content, demo: true, snapshotDate: new Date().toISOString().slice(0, 10) }));
  console.log(`Wrote ${content.surahs.length} surahs, ${content.surahs.reduce((n, s) => n + s.verses.length, 0)} ayahs → ${out}`);
}

main().catch(e => { console.error(e); process.exit(1); });
