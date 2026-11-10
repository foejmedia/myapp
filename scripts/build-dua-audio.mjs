/**
 * Links the site's hadith duas (public/data/duas) to their recitation in Hisn al-Muslim
 * (hisnmuslim.com open API: one MP3 per dua).
 *
 * A dua is linked only when its Arabic text, with vowel marks and punctuation removed,
 * matches a Hisn al-Muslim entry closely (one contains the other and the lengths are close),
 * so a recording never belongs to a different dua. Unmatched duas get no audio.
 *
 *   node scripts/build-dua-audio.mjs
 * → src/learn1min/data/dua-audio.json   { [duaId]: { url, hisnId } }
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const API = 'https://www.hisnmuslim.com/api/ar';
const https = u => u.replace(/^http:\/\//, 'https://');

const strip = t => (t ?? '').replace(/^﻿/, '');
const getJson = async url => {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(https(url), { signal: AbortSignal.timeout(20000) });
      if (r.ok) return JSON.parse(strip(await r.text()));
    } catch { /* retry */ }
  }
  throw new Error(`failed: ${url}`);
};

/** Arabic letters only, unified spellings: comparable across editions */
const norm = t =>
  t
    .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\([^()]{0,40}مر[^()]{0,20}\)/g, '') // repetition notes like "(ثلاثَ مرَّاتٍ)"
    .replace(/[^ء-ي]/g, '');

// 1. every Hisn al-Muslim dua
const index = Object.values(await getJson(`${API}/husn_ar.json`))[0];
const hisn = [];
for (const ch of index) {
  const body = Object.values(await getJson(ch.TEXT))[0] ?? [];
  for (const d of body) if (d.AUDIO && d.ARABIC_TEXT) hisn.push({ id: d.ID, url: https(d.AUDIO), n: norm(d.ARABIC_TEXT) });
}
console.log(`Hisn al-Muslim: ${hisn.length} duas with audio`);

// 2. our hadith duas
const dir = 'public/data/duas';
const ours = readdirSync(dir)
  .filter(f => f !== 'categories.json')
  .flatMap(f => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')).duas)
  .filter(d => d.source !== 'Quran' && d.arabic);

// 3. match
const out = {};
const unmatched = [];
for (const d of ours) {
  const n = norm(d.arabic);
  if (n.length < 8) {
    unmatched.push(d.id);
    continue;
  }
  let best = null;
  for (const h of hisn) {
    const ratio = Math.min(n.length, h.n.length) / Math.max(n.length, h.n.length);
    const contains = h.n.includes(n) || n.includes(h.n);
    if (contains && ratio >= 0.6 && (!best || ratio > best.ratio)) best = { ...h, ratio };
  }
  if (best) {
    out[d.id] = { url: best.url, hisnId: best.id };
    continue;
  }
  // Our text is the opening part of a longer Hisn al-Muslim dua: link the full recording,
  // flagged so the page can say it is longer — but only when ours is a substantial part of it.
  let longer = null;
  for (const h of hisn) {
    const ratio = n.length / h.n.length;
    if (h.n.includes(n) && ratio >= 0.3 && (!longer || ratio > longer.ratio)) longer = { ...h, ratio };
  }
  if (longer) out[d.id] = { url: longer.url, hisnId: longer.id, longer: true };
  else unmatched.push(d.id);
}

writeFileSync('src/learn1min/data/dua-audio.json', JSON.stringify(out, null, 1) + '\n');
console.log(`linked ${Object.keys(out).length} of ${ours.length} hadith duas`);
console.log('no recording:', unmatched.join(', '));
