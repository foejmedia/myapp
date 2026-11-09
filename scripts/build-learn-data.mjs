/**
 * Builds the verified data for Learn in 1 Minute (src/learn1min/data/*.json).
 *
 *   node scripts/build-learn-data.mjs
 *
 * Nothing here is written by hand. Sources:
 *  - Roots, lemmas and occurrence counts: Quranic Arabic Corpus morphology (corpus.quran.com),
 *    via the corrected mirror github.com/mustafa0x/quran-morphology.
 *  - Arabic word forms, transliteration, word-by-word meanings, word audio, ayah text (text_qpc_hafs,
 *    the encoding the site's UthmanicHafs font is made for — same font as Read Quran)
 *    and the Saheeh International translation: Quran.com API v4.
 *  - Chapter names, meanings and ayah counts: Quran.com API v4.
 * Every example is cross-checked: the Corpus segments at a location must spell the same word
 * that Quran.com returns at that location, otherwise the example is dropped.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/learn1min/data');
const MORPHOLOGY = 'https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt';
const API = 'https://api.quran.com/api/v4';
const TRANSLATION = 20; // Saheeh International
const TARGET = 160;     // vocabulary size
const EXAMPLES = 2;

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (res.ok) return res;
      if (res.status < 500 && res.status !== 429) throw new Error(`${res.status} ${url}`);
    } catch (e) {
      if (i === tries - 1) throw e;
    }
    await sleep(800 * (i + 1));
  }
  throw new Error(`failed ${url}`);
}

/** Arabic compared without diacritics, Quranic marks, tatweel or alef variants (same as src/lib/quiz/content.ts). */
const bare = s =>
  s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿـ]/g, '')
    .replace(/[آأإٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/[٠-٩۰-۹\s]/g, '');

const POS = { N: 'noun', V: 'verb' };

// ---------- 1. Corpus morphology ----------
console.log('Downloading Corpus morphology…');
const text = await (await get(MORPHOLOGY)).text();
const words = new Map(); // "s:a:w" -> { segs: string[], lemma, root, pos, tags }
for (const line of text.split('\n')) {
  const [loc, form, tag, feats] = line.split('\t');
  if (!loc || !feats) continue;
  const [s, a, w] = loc.split(':');
  const key = `${s}:${a}:${w}`;
  const entry = words.get(key) ?? { segs: [], lemma: null, root: null, pos: null, pn: false };
  entry.segs.push(form);
  const f = Object.fromEntries(feats.split('|').map(x => x.split(':')).filter(x => x.length === 2));
  // The stem segment (noun or verb) carries the word's lemma and root.
  if ((tag === 'N' || tag === 'V') && f.LEM && !entry.lemma) {
    entry.lemma = f.LEM;
    entry.root = f.ROOT ?? null;
    entry.pos = POS[tag];
    entry.pn = feats.split('|').includes('PN');
    entry.adj = feats.split('|').includes('ADJ');
  }
  words.set(key, entry);
}
console.log(`  ${words.size} words`);

// ---------- 2. Count lemmas ----------
const lemmas = new Map(); // `${pos}|${lemma}` -> { lemma, root, pos, count, locs[] }
for (const [loc, w] of words) {
  if (!w.lemma || !w.root || w.pn) continue; // roots only; proper nouns aside (names are learned elsewhere)
  const id = `${w.pos}|${w.lemma}`;
  const l = lemmas.get(id) ?? { lemma: w.lemma, root: w.root, pos: w.adj ? 'adjective' : w.pos, count: 0, locs: [] };
  l.count++;
  l.locs.push(loc);
  lemmas.set(id, l);
}
// The verb "to be" and a few auxiliaries dominate the list but teach little on their own.
const SKIP = new Set(['verb|كانَ', 'verb|قالَ']);
const ranked = [...lemmas.entries()].filter(([id]) => !SKIP.has(id)).map(([, l]) => l).sort((a, b) => b.count - a.count);
console.log(`  ${lemmas.size} lemmas; taking the top ${TARGET}`);

// ---------- 3. Chapters ----------
const { chapters } = await (await get(`${API}/chapters?language=en`)).json();
if (chapters.length !== 114) throw new Error('chapter list incomplete');
const chapterOut = chapters.map(c => ({
  id: c.id, nameSimple: c.name_simple, nameArabic: c.name_arabic, meaning: c.translated_name.name, versesCount: c.verses_count,
}));
const verseCount = Object.fromEntries(chapterOut.map(c => [c.id, c.versesCount]));

// ---------- 4. Verses from Quran.com (cached) ----------
const verseCache = new Map();
async function verse(key) {
  if (verseCache.has(key)) return verseCache.get(key);
  const url = `${API}/verses/by_key/${key}?language=en&words=true&translations=${TRANSLATION}` +
    `&fields=text_qpc_hafs&word_fields=text_qpc_hafs,location,audio_url,char_type_name`;
  const { verse: v } = await (await get(url)).json();
  const tr = v.translations?.find(t => t.resource_id === TRANSLATION)?.text;
  const out = {
    key,
    ar: v.text_qpc_hafs,
    translation: tr ? tr.replace(/<sup[^>]*>.*?<\/sup>/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : null,
    words: v.words.filter(w => w.char_type_name === 'word').map(w => ({
      ar: w.text_qpc_hafs, location: w.location, audio: w.audio_url,
      meaning: w.translation?.text ?? null, translit: w.transliteration?.text ?? null,
    })),
  };
  verseCache.set(key, out);
  return out;
}

// Prefer short ayat (easier to learn from), spread across the Qur'an.
function candidates(locs) {
  const byVerse = new Map();
  for (const loc of locs) {
    const [s, a] = loc.split(':');
    const vk = `${s}:${a}`;
    if (!byVerse.has(vk)) byVerse.set(vk, loc);
  }
  return [...byVerse.values()]
    .map(loc => {
      const [s, a] = loc.split(':').map(Number);
      // shorter surahs first; within those, earlier ayat
      return { loc, score: verseCount[s] > 0 ? (s >= 78 ? 0 : 1) * 1000 + a : 9999 };
    })
    .sort((x, y) => x.score - y.score)
    .slice(0, 8)
    .map(x => x.loc);
}

const vocab = [];
let checked = 0, dropped = 0;
for (const l of ranked) {
  if (vocab.length >= TARGET) break;
  const examples = [];
  let display = null;
  for (const loc of candidates(l.locs)) {
    if (examples.length >= EXAMPLES) break;
    const [s, a, w] = loc.split(':').map(Number);
    const v = await verse(`${s}:${a}`);
    checked++;
    const qw = v.words.find(x => x.location === `${s}:${a}:${w}`);
    const corpusWord = words.get(loc).segs.join('');
    if (!qw || !v.translation || bare(qw.ar) !== bare(corpusWord)) {
      dropped++;
      continue; // locations disagree: never guess
    }
    if (!display && qw.meaning) display = qw;
    examples.push({ key: `${s}:${a}`, wordIndex: w - 1, ar: v.ar, translation: v.translation, words: v.words.map(x => x.ar) });
  }
  if (!display || !examples.length) continue;
  vocab.push({
    id: `v${vocab.length + 1}`,
    lemma: l.lemma,
    root: [...l.root].join(' '),
    pos: l.pos,
    occurrences: l.count,
    form: display.ar,
    translit: display.translit,
    meaning: display.meaning,
    meaningAt: display.location,
    audio: display.audio ? `https://audio.qurancdn.com/${display.audio}` : null,
    examples,
  });
  if (vocab.length % 20 === 0) console.log(`  ${vocab.length} words…`);
  await sleep(40);
}
console.log(`  ${vocab.length} words; ${checked} examples checked, ${dropped} dropped on mismatch`);

// ---------- 5. Write ----------
mkdirSync(OUT, { recursive: true });
const meta = {
  generatedAt: new Date().toISOString().slice(0, 10),
  sources: {
    morphology: 'Quranic Arabic Corpus (corpus.quran.com), corrected mirror github.com/mustafa0x/quran-morphology',
    text: 'Quran.com API v4 — Uthmani Hafs text (text_qpc_hafs, King Fahd Complex), shown in the KFGQPC Uthmanic Hafs font',
    translation: 'Saheeh International (Quran.com resource 20)',
    words: 'Quran.com word-by-word meanings, transliteration and audio',
  },
};
writeFileSync(join(OUT, 'vocabulary.json'), JSON.stringify({ meta, words: vocab }));
writeFileSync(join(OUT, 'chapters.json'), JSON.stringify({ meta: { generatedAt: meta.generatedAt, source: 'Quran.com API v4' }, chapters: chapterOut }));
console.log('Wrote src/learn1min/data/vocabulary.json and chapters.json');
