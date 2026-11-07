/**
 * The only persistence layer: one versioned JSON document in localStorage.
 * Nothing here ever leaves the device.
 */

export const STORAGE_KEY = 'garden-of-dhikr:v1';

export type Method = 'MWL' | 'ISNA' | 'Egypt' | 'Karachi' | 'UmmAlQura';
export type HijriOffset = -2 | -1 | 0 | 1 | 2;
export type Language = 'en' | 'ar' | 'ur' | 'hi';

export type Settings = {
  lat?: number;
  lng?: number;
  city?: string;
  method: Method;
  asr: 'standard' | 'hanafi';
  hijriOffset: HijriOffset;
  language: Language;
  sound: boolean;
  haptics: boolean;
  khushuMode: boolean;
  minTapGapMs: number;
};

export type DuaTree = { id: string; name: string; note?: string; createdAt: string };

export type SavedState = {
  version: 1;
  createdAt: string;
  userSeed: string;
  totals: Record<string, number>;
  milestones: Record<string, string[]>;
  days: Record<string, Record<string, number>>;
  duaTrees: DuaTree[];
  lastBackupAt?: string;
  settings: Settings;
};

export const DEFAULT_SETTINGS: Settings = {
  method: 'MWL',
  asr: 'standard',
  hijriOffset: 0,
  language: 'en',
  sound: false,
  haptics: true,
  khushuMode: false,
  minTapGapMs: 400,
};

const METHODS: Method[] = ['MWL', 'ISNA', 'Egypt', 'Karachi', 'UmmAlQura'];
const LANGS: Language[] = ['en', 'ar', 'ur', 'hi'];

export function randomSeed(): string {
  try {
    const a = new Uint32Array(2);
    crypto.getRandomValues(a);
    return Array.from(a, n => n.toString(36)).join('');
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

export function createState(now = Date.now(), userSeed = randomSeed()): SavedState {
  return {
    version: 1,
    createdAt: new Date(now).toISOString(),
    userSeed,
    totals: {},
    milestones: {},
    days: {},
    duaTrees: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const finite = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

function counts(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (isObj(v)) for (const [k, n] of Object.entries(v)) if (isCount(n)) out[k] = Math.floor(n);
  return out;
}

function sanitizeSettings(v: unknown): Settings {
  const s = isObj(v) ? v : {};
  const lat = finite(s.lat);
  const lng = finite(s.lng);
  const off = finite(s.hijriOffset);
  const gap = finite(s.minTapGapMs);
  return {
    ...(lat !== undefined && lat >= -90 && lat <= 90 ? { lat } : {}),
    ...(lng !== undefined && lng >= -180 && lng <= 180 ? { lng } : {}),
    ...(typeof s.city === 'string' && s.city ? { city: s.city.slice(0, 80) } : {}),
    method: METHODS.includes(s.method as Method) ? (s.method as Method) : DEFAULT_SETTINGS.method,
    asr: s.asr === 'hanafi' ? 'hanafi' : 'standard',
    hijriOffset: off !== undefined && [-2, -1, 0, 1, 2].includes(off) ? (off as HijriOffset) : 0,
    language: LANGS.includes(s.language as Language) ? (s.language as Language) : 'en',
    sound: typeof s.sound === 'boolean' ? s.sound : DEFAULT_SETTINGS.sound,
    haptics: typeof s.haptics === 'boolean' ? s.haptics : DEFAULT_SETTINGS.haptics,
    khushuMode: typeof s.khushuMode === 'boolean' ? s.khushuMode : DEFAULT_SETTINGS.khushuMode,
    minTapGapMs: gap !== undefined ? Math.min(2000, Math.max(0, Math.round(gap))) : DEFAULT_SETTINGS.minTapGapMs,
  };
}

/** Validate any parsed JSON and bring it up to the current schema. Throws on data that is not a garden. */
export function migrate(raw: unknown): SavedState {
  if (!isObj(raw)) throw new Error('This file is not a Garden of Dhikr backup.');
  if (raw.version !== 1) throw new Error(`Unsupported backup version: ${String(raw.version)}.`);

  const milestones: Record<string, string[]> = {};
  if (isObj(raw.milestones)) {
    for (const [k, list] of Object.entries(raw.milestones)) {
      if (Array.isArray(list)) milestones[k] = list.filter((x): x is string => typeof x === 'string' && !Number.isNaN(Date.parse(x)));
    }
  }
  const days: Record<string, Record<string, number>> = {};
  if (isObj(raw.days)) {
    for (const [k, v] of Object.entries(raw.days)) if (/^\d{4}-\d{2}-\d{2}$/.test(k)) days[k] = counts(v);
  }
  const duaTrees: DuaTree[] = Array.isArray(raw.duaTrees)
    ? raw.duaTrees
        .filter((t): t is Record<string, unknown> => isObj(t) && typeof t.id === 'string' && typeof t.name === 'string')
        .map(t => ({
          id: t.id as string,
          name: (t.name as string).slice(0, 60),
          ...(typeof t.note === 'string' && t.note ? { note: t.note.slice(0, 280) } : {}),
          createdAt: typeof t.createdAt === 'string' ? t.createdAt : new Date(0).toISOString(),
        }))
    : [];

  const out: SavedState = {
    version: 1,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date(0).toISOString(),
    userSeed: typeof raw.userSeed === 'string' && raw.userSeed ? raw.userSeed : 'garden',
    totals: counts(raw.totals),
    milestones,
    days,
    duaTrees,
    settings: sanitizeSettings(raw.settings),
  };
  if (typeof raw.lastBackupAt === 'string') out.lastBackupAt = raw.lastBackupAt;
  return out;
}

export function loadState(): SavedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? migrate(JSON.parse(raw)) : null;
  } catch {
    return null; // private mode, blocked storage or bad JSON
  }
}

/** Write immediately. Returns false when storage is blocked or full (the app keeps running in memory). */
export function writeNow(state: SavedState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;

/** Debounced save so rapid taps cost one write. */
export function saveState(state: SavedState, onResult?: (ok: boolean) => void) {
  clearTimeout(timer);
  timer = setTimeout(() => onResult?.(writeNow(state)), 300);
}

export function cancelPendingSave() {
  clearTimeout(timer);
}

export function exportBackup(state: SavedState, now = new Date()) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `garden-of-dhikr-${now.toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readBackupFile(file: File): Promise<SavedState> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  return migrate(parsed);
}

export function eraseAll() {
  cancelPendingSave();
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing stored */
  }
}
