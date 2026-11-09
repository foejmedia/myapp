/**
 * Every learnable thing has an item id: 'v:<word>' vocabulary, 'd:<dua>' dua, 's:<n>' surah.
 * The daily lesson path interleaves the three so each day brings something different.
 */
import { CHAPTERS, SURAH_ORDER, chapter } from '../content/chapters';
import { DUAS, DUA_BY_ID } from '../content/duas';
import { VOCAB, VOCAB_BY_ID } from '../content/vocabulary';

export type Kind = 'v' | 'd' | 's';
export const KIND_LABEL: Record<Kind, string> = { v: 'Vocabulary', d: 'Dua', s: 'Surah' };
export const KIND_PLURAL: Record<Kind, string> = { v: 'Words', d: 'Duas', s: 'Surahs' };

export const kindOf = (itemId: string) => itemId.slice(0, 1) as Kind;
export const refOf = (itemId: string) => itemId.slice(2);

export const vocabItem = (id: string) => `v:${id}`;
export const duaItem = (id: string) => `d:${id}`;
export const surahItem = (n: number) => `s:${n}`;

export function exists(itemId: string): boolean {
  const ref = refOf(itemId);
  switch (kindOf(itemId)) {
    case 'v': return !!VOCAB_BY_ID[ref];
    case 'd': return !!DUA_BY_ID[ref];
    case 's': return !!chapter(Number(ref));
    default: return false;
  }
}

/** A title and short subtitle for any item (search results, notebook, calendar labels). */
export function describe(itemId: string): { title: string; subtitle: string; arabic: string; href: string } | null {
  const ref = refOf(itemId);
  switch (kindOf(itemId)) {
    case 'v': {
      const w = VOCAB_BY_ID[ref];
      return w ? { title: w.translit ?? w.lemma, subtitle: w.meaning, arabic: w.form, href: `/learn-1-min/vocabulary?word=${w.id}` } : null;
    }
    case 'd': {
      const d = DUA_BY_ID[ref];
      return d ? { title: d.title, subtitle: d.translation, arabic: d.arabic, href: `/learn-1-min/duas?dua=${d.id}` } : null;
    }
    case 's': {
      const c = chapter(Number(ref));
      return c ? { title: `Surah ${c.nameSimple}`, subtitle: c.meaning, arabic: c.nameArabic, href: `/learn-1-min/surahs/${c.id}` } : null;
    }
    default:
      return null;
  }
}

export const LESSON_PATH: string[] = (() => {
  const tracks = [VOCAB.map(w => vocabItem(w.id)), DUAS.map(d => duaItem(d.id)), SURAH_ORDER.map(surahItem)];
  const out: string[] = [];
  const max = Math.max(...tracks.map(t => t.length));
  for (let i = 0; i < max; i++) for (const t of tracks) if (t[i]) out.push(t[i]);
  return out;
})();

/** Today's lesson: the one completed today, else the first one not yet completed on any day. */
export function lessonForToday(learned: Record<string, string>, today: string): string {
  if (learned[today] && exists(learned[today])) return learned[today];
  const done = new Set(Object.values(learned));
  return LESSON_PATH.find(id => !done.has(id)) ?? LESSON_PATH[Object.keys(learned).length % LESSON_PATH.length];
}

export function lessonForTomorrow(learned: Record<string, string>, today: string): string {
  const t = lessonForToday(learned, today);
  const done = new Set([...Object.values(learned), t]);
  return LESSON_PATH.find(id => !done.has(id)) ?? t;
}

/** Word of the day: a different word each calendar day, cycling through the vocabulary. */
export function wordOfTheDay(today: string) {
  const days = Math.floor(Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10)) / 864e5);
  return VOCAB[(days * 7) % VOCAB.length];
}

export const TOTALS = { v: VOCAB.length, d: DUAS.length, s: CHAPTERS.length };
