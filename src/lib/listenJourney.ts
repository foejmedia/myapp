/**
 * Quran Player — "listen in your language" journey, surah 1 to 114 in order.
 * One document per learner profile. Pure: no React or storage here.
 */
import { DAY_RE, addDays, streaks } from '@/learn1min/lib/dates';

export type Journey = {
  v: 1;
  /** where listening last stopped */
  pos: { surah: number; ayah: number; lang: string; at: string } | null;
  /** surah -> highest ayah listened to the end */
  heard: Record<string, number>;
  /** surah -> day it was finished */
  done: Record<string, string>;
  /** day -> ayahs listened */
  activity: Record<string, number>;
};

export type SurahInfo = { number: number; ayahs: number };

export const STORAGE_PREFIX = 'qp:journey:';

export const emptyJourney = (): Journey => ({ v: 1, pos: null, heard: {}, done: {}, activity: {} });

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const surahKey = (k: string) => /^\d{1,3}$/.test(k) && +k >= 1 && +k <= 114;
const posInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0;

export function migrate(raw: unknown): Journey {
  const j = emptyJourney();
  if (!isObj(raw) || raw.v !== 1) return j;
  const p = raw.pos;
  if (isObj(p) && posInt(p.surah) && p.surah <= 114 && posInt(p.ayah) && typeof p.lang === 'string' && typeof p.at === 'string')
    j.pos = { surah: p.surah, ayah: p.ayah, lang: p.lang, at: p.at };
  if (isObj(raw.heard)) for (const [k, v] of Object.entries(raw.heard)) if (surahKey(k) && posInt(v)) j.heard[k] = v;
  if (isObj(raw.done)) for (const [k, v] of Object.entries(raw.done)) if (surahKey(k) && typeof v === 'string' && DAY_RE.test(v)) j.done[k] = v;
  if (isObj(raw.activity)) for (const [k, v] of Object.entries(raw.activity)) if (DAY_RE.test(k) && posInt(v)) j.activity[k] = v;
  return j;
}

/** Remember where the learner is (called when an ayah starts). */
export function setPosition(j: Journey, surah: number, ayah: number, lang: string, at: Date): Journey {
  if (j.pos && j.pos.surah === surah && j.pos.ayah === ayah && j.pos.lang === lang) return j;
  return { ...j, pos: { surah, ayah, lang, at: at.toISOString() } };
}

/** An ayah (with its translation) played to the end. The last ayah finishes the surah. */
export function ayahHeard(j: Journey, surah: number, ayah: number, total: number, day: string): Journey {
  const k = String(surah);
  const heard = Math.max(j.heard[k] ?? 0, ayah);
  const finished = ayah >= total && !j.done[k];
  return {
    ...j,
    heard: { ...j.heard, [k]: Math.min(heard, total) },
    done: finished ? { ...j.done, [k]: day } : j.done,
    activity: { ...j.activity, [day]: (j.activity[day] ?? 0) + 1 },
  };
}

export function setSurahDone(j: Journey, surah: number, done: boolean, total: number, day: string): Journey {
  const k = String(surah);
  if (!!j.done[k] === done) return j;
  const doneMap = { ...j.done };
  const heard = { ...j.heard };
  if (done) {
    doneMap[k] = day;
    heard[k] = total;
  } else {
    delete doneMap[k];
    delete heard[k];
  }
  return { ...j, done: doneMap, heard };
}

/** Where to resume inside a surah: after the last ayah heard (or ayah 1). */
export function resumeAyah(j: Journey, s: SurahInfo): number {
  if (j.done[String(s.number)]) return 1;
  if (j.pos && j.pos.surah === s.number) return Math.min(j.pos.ayah, s.ayahs);
  const h = j.heard[String(s.number)] ?? 0;
  return h >= s.ayahs ? 1 : h + 1;
}

/** The next surah in order: the one in progress, else the first unfinished one after it, else from the start. */
export function nextUp(j: Journey, surahs: SurahInfo[]): { surah: SurahInfo; ayah: number } | null {
  const open = (s: SurahInfo) => !j.done[String(s.number)];
  const cur = j.pos ? surahs.find(s => s.number === j.pos!.surah) : undefined;
  const pick = (cur && open(cur) && cur) || surahs.find(s => open(s) && (!cur || s.number > cur.number)) || surahs.find(open);
  return pick ? { surah: pick, ayah: resumeAyah(j, pick) } : null;
}

export function surahPct(j: Journey, s: SurahInfo): number {
  if (j.done[String(s.number)]) return 1;
  return Math.min(1, (j.heard[String(s.number)] ?? 0) / s.ayahs);
}

export function journeySummary(j: Journey, surahs: SurahInfo[], today: string) {
  const totalAyahs = surahs.reduce((a, s) => a + s.ayahs, 0);
  const ayahsHeard = surahs.reduce((a, s) => a + Math.round(surahPct(j, s) * s.ayahs), 0);
  const { current, best } = streaks(Object.keys(j.activity), today);
  return {
    surahsDone: surahs.filter(s => j.done[String(s.number)]).length,
    totalSurahs: surahs.length,
    ayahsHeard,
    totalAyahs,
    pct: totalAyahs ? ayahsHeard / totalAyahs : 0,
    streak: current,
    bestStreak: best,
    todayAyahs: j.activity[today] ?? 0,
    week: Array.from({ length: 7 }, (_, i) => {
      const day = addDays(today, i - 6);
      return { day, count: j.activity[day] ?? 0 };
    }),
    next: nextUp(j, surahs),
  };
}
