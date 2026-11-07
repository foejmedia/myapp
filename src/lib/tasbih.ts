/** Pure logic for the Tasbeeh Garden (/tasbih). No DOM access here. */

export interface Dhikr {
  id: string;
  label: string;
  ar?: string;
  meaning?: string;
}

export const DHIKR: Dhikr[] = [
  { id: 'subhanallah', label: 'SubhanAllah', ar: 'سُبْحَانَ ٱللَّٰهِ', meaning: 'Glory be to Allah' },
  { id: 'subhanallahibihamdihi', label: 'SubhanAllahi wa bihamdihi', ar: 'سُبْحَانَ ٱللَّٰهِ وَبِحَمْدِهِ', meaning: 'Glory and praise be to Allah' },
  { id: 'alhamdulillah', label: 'Alhamdulillah', ar: 'ٱلْحَمْدُ لِلَّٰهِ', meaning: 'All praise is due to Allah' },
  { id: 'allahuakbar', label: 'Allahu Akbar', ar: 'ٱللَّٰهُ أَكْبَرُ', meaning: 'Allah is the Greatest' },
  { id: 'astaghfirullah', label: 'Astaghfirullah', ar: 'أَسْتَغْفِرُ ٱللَّٰهَ', meaning: 'I seek forgiveness from Allah' },
  { id: 'tahleel', label: 'La ilaha illallah', ar: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', meaning: 'There is no god but Allah' },
  { id: 'salawat', label: 'Salawat', ar: 'ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', meaning: 'O Allah, send blessings upon Muhammad ﷺ' },
  { id: 'hawqala', label: 'La hawla wa la quwwata', ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ', meaning: 'There is no power nor strength except through Allah' },
];

export const CUSTOM_ID = 'custom';

export const GOALS = [11, 33, 70, 99, 100, 200, 313, 500, 1000];
export const DEFAULT_GOAL = 100;

/** Garden layout: rows planted back-to-front, each row left-to-right. */
export const ROWS = 4;
export const PER_ROW = 11;
export const SLOTS = ROWS * PER_ROW;

/** Flower colours; a new colour is planted each time the garden fills up. */
export const BLOOMS = ['#f472b6', '#facc15', '#a78bfa', '#fb7185', '#fb923c', '#60a5fa'];

/**
 * Which "layer" of flower currently stands in garden slot `i` after `count`
 * taps, or -1 if nothing has been planted there yet. Tap n (1-based) plants
 * slot (n-1) % SLOTS, so once the garden is full the next taps replant it in
 * a new colour.
 */
export function slotLayer(i: number, count: number, slots = SLOTS): number {
  if (count <= i) return -1;
  return Math.floor((count - 1 - i) / slots);
}

/** Progress through the current round, 0..1. Exactly on a goal reads as full. */
export function roundProgress(count: number, goal: number): number {
  if (count <= 0 || goal <= 0) return 0;
  return (((count - 1) % goal) + 1) / goal;
}

export const roundsDone = (count: number, goal: number) => (goal > 0 ? Math.floor(count / goal) : 0);

/** Per-dhikr progress: every dhikr grows its own tree. */
export interface DhikrProgress { count: number; goal: number }
/** A tree planted in the grove when a round is completed. */
export interface Planted { d: string; t: number }

export interface TasbihState {
  /** the active dhikr; `count`/`goal` below always belong to it */
  dhikrId: string;
  custom: string;
  goal: number;
  count: number;
  sound: boolean;
  haptics: boolean;
  /** keep the screen awake while this page is open */
  wake: boolean;
  todayDate: string;
  today: number;
  total: number;
  /** saved progress of the dhikr that are not active */
  perDhikr: Record<string, DhikrProgress>;
  grove: Planted[];
  /** counts per local day, keyed YYYY-MM-DD */
  history: Record<string, number>;
}

export const STORE_KEY = 'tasbihGarden-v1';
export const dayKey = (d = new Date()) => d.toDateString();
/** Local calendar day as YYYY-MM-DD. */
export const isoDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const HISTORY_DAYS = 120;
const GROVE_CAP = 2000;

export const blankState = (): TasbihState => ({
  dhikrId: DHIKR[0].id,
  custom: '',
  goal: DEFAULT_GOAL,
  count: 0,
  sound: true,
  haptics: true,
  wake: false,
  todayDate: dayKey(),
  today: 0,
  total: 0,
  perDhikr: {},
  grove: [],
  history: {},
});

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : d);
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);

/** Parse stored JSON defensively and roll the daily counter over at midnight. */
export function parseState(raw: string | null, today = dayKey(), todayIso = isoDay()): TasbihState {
  const base = { ...blankState(), todayDate: today };
  if (!raw) return base;
  try {
    const s = JSON.parse(raw) as Partial<TasbihState>;
    const perDhikr: Record<string, DhikrProgress> = {};
    if (s.perDhikr && typeof s.perDhikr === 'object') {
      for (const [k, v] of Object.entries(s.perDhikr)) {
        if (v && typeof v === 'object') perDhikr[k] = { count: num(v.count, 0), goal: num(v.goal, DEFAULT_GOAL) || DEFAULT_GOAL };
      }
    }
    const grove = Array.isArray(s.grove)
      ? s.grove.filter((g): g is Planted => !!g && typeof g.d === 'string' && typeof g.t === 'number').slice(-GROVE_CAP)
      : [];
    const history: Record<string, number> = {};
    if (s.history && typeof s.history === 'object') {
      for (const [k, v] of Object.entries(s.history)) if (/^\d{4}-\d{2}-\d{2}$/.test(k)) history[k] = num(v, 0);
    }
    const out: TasbihState = {
      dhikrId: typeof s.dhikrId === 'string' ? s.dhikrId : base.dhikrId,
      custom: typeof s.custom === 'string' ? s.custom.slice(0, 40) : '',
      goal: num(s.goal, DEFAULT_GOAL) || DEFAULT_GOAL,
      count: num(s.count, 0),
      sound: bool(s.sound, true),
      haptics: bool(s.haptics, true),
      wake: bool(s.wake, false),
      todayDate: typeof s.todayDate === 'string' ? s.todayDate : today,
      today: num(s.today, 0),
      total: num(s.total, 0),
      perDhikr,
      grove,
      history,
    };
    // older saves only knew today's total — seed the history with it
    if (out.todayDate === today && out.today > 0 && !history[todayIso]) history[todayIso] = out.today;
    if (out.todayDate !== today) {
      out.todayDate = today;
      out.today = 0;
    }
    return out;
  } catch {
    return base;
  }
}

/** One count. Plants a tree in the grove when the round completes. */
export function applyTap(s: TasbihState, now = new Date()): { next: TasbihState; hit: boolean } {
  const today = dayKey(now);
  const iso = isoDay(now);
  const base = s.todayDate === today ? s : { ...s, todayDate: today, today: 0 };
  const count = base.count + 1;
  const hit = count % base.goal === 0;

  let history = { ...base.history, [iso]: (base.history[iso] ?? 0) + 1 };
  const days = Object.keys(history);
  if (days.length > HISTORY_DAYS) {
    history = Object.fromEntries(days.sort().slice(-HISTORY_DAYS).map(k => [k, history[k]]));
  }

  const grove = hit ? [...base.grove, { d: base.dhikrId, t: now.getTime() }].slice(-GROVE_CAP) : base.grove;
  return { next: { ...base, count, today: base.today + 1, total: base.total + 1, history, grove }, hit };
}

/** Take back one count — and the tree it planted, if it completed a round. */
export function applyUndo(s: TasbihState, now = new Date()): TasbihState {
  if (s.count === 0) return s;
  let grove = s.grove;
  if (s.count % s.goal === 0) {
    for (let i = grove.length - 1; i >= 0; i--) {
      if (grove[i].d === s.dhikrId) { grove = [...grove.slice(0, i), ...grove.slice(i + 1)]; break; }
    }
  }
  const iso = isoDay(now);
  const history = s.history[iso] ? { ...s.history, [iso]: s.history[iso] - 1 } : s.history;
  return {
    ...s,
    count: s.count - 1,
    today: Math.max(0, s.today - 1),
    total: Math.max(0, s.total - 1),
    grove,
    history,
  };
}

/** Switch dhikr, parking the current tree's progress and resuming the new one's. */
export function switchDhikr(s: TasbihState, id: string, custom?: string): TasbihState {
  const nextCustom = custom ?? s.custom;
  if (id === s.dhikrId) return { ...s, custom: nextCustom };
  const parked = { ...s.perDhikr, [s.dhikrId]: { count: s.count, goal: s.goal } };
  const resume = parked[id] ?? { count: 0, goal: s.goal };
  return { ...s, dhikrId: id, custom: nextCustom, count: resume.count, goal: resume.goal, perDhikr: parked };
}

/** Progress of any dhikr, active or parked. */
export function progressOf(s: TasbihState, id: string): DhikrProgress {
  return id === s.dhikrId ? { count: s.count, goal: s.goal } : s.perDhikr[id] ?? { count: 0, goal: DEFAULT_GOAL };
}

/** Consecutive days with at least one count, ending today (or yesterday if today is still empty). */
export function streak(history: Record<string, number>, now = new Date()): number {
  const d = new Date(now);
  if (!history[isoDay(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (history[isoDay(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/** The last `n` days, oldest first, for the week chart. */
export function lastDays(history: Record<string, number>, n = 7, now = new Date()) {
  const out: { iso: string; label: string; count: number; today: boolean }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const iso = isoDay(d);
    out.push({ iso, label: d.toLocaleDateString('en', { weekday: 'narrow' }), count: history[iso] ?? 0, today: i === 0 });
  }
  return out;
}
