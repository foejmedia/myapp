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

export interface TasbihState {
  dhikrId: string;
  custom: string;
  goal: number;
  count: number;
  sound: boolean;
  todayDate: string;
  today: number;
  total: number;
}

export const STORE_KEY = 'tasbihGarden-v1';
export const dayKey = (d = new Date()) => d.toDateString();

export const blankState = (): TasbihState => ({
  dhikrId: DHIKR[0].id,
  custom: '',
  goal: DEFAULT_GOAL,
  count: 0,
  sound: true,
  todayDate: dayKey(),
  today: 0,
  total: 0,
});

/** Parse stored JSON defensively and roll the daily counter over at midnight. */
export function parseState(raw: string | null, today = dayKey()): TasbihState {
  const base = { ...blankState(), todayDate: today };
  if (!raw) return base;
  try {
    const s = JSON.parse(raw) as Partial<TasbihState>;
    const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : d);
    const out: TasbihState = {
      dhikrId: typeof s.dhikrId === 'string' ? s.dhikrId : base.dhikrId,
      custom: typeof s.custom === 'string' ? s.custom.slice(0, 40) : '',
      goal: num(s.goal, DEFAULT_GOAL) || DEFAULT_GOAL,
      count: num(s.count, 0),
      sound: typeof s.sound === 'boolean' ? s.sound : true,
      todayDate: typeof s.todayDate === 'string' ? s.todayDate : today,
      today: num(s.today, 0),
      total: num(s.total, 0),
    };
    if (out.todayDate !== today) {
      out.todayDate = today;
      out.today = 0;
    }
    return out;
  } catch {
    return base;
  }
}
