/**
 * Learner profiles on this device. Shares the same storage as "Learn in 1 Minute"
 * (`l1m:profiles`), so a family member who picks their name in one place is known in the other.
 * Kept separate from '@/learn1min/store' so this page doesn't load that feature's word lists.
 */
export type Profile = { id: string; name: string; createdAt: string };
type ProfilesDoc = { profiles: Profile[]; current: string | null };

const PROFILES_KEY = 'l1m:profiles';
export const PROFILES_STORAGE_KEY = PROFILES_KEY;

function readDoc(): ProfilesDoc {
  try {
    const raw = window.localStorage.getItem(PROFILES_KEY);
    const d = raw ? JSON.parse(raw) : null;
    if (d && Array.isArray(d.profiles)) {
      const profiles = (d.profiles as unknown[]).filter(
        (p): p is Profile => !!p && typeof p === 'object' && typeof (p as Profile).id === 'string' && typeof (p as Profile).name === 'string',
      );
      return { profiles, current: typeof d.current === 'string' ? d.current : null };
    }
  } catch {
    /* blocked or unreadable */
  }
  return { profiles: [], current: null };
}

const writeDoc = (d: ProfilesDoc) => window.localStorage.setItem(PROFILES_KEY, JSON.stringify(d));

const newId = () => {
  try {
    const a = new Uint32Array(2);
    crypto.getRandomValues(a);
    return Array.from(a, n => n.toString(36)).join('');
  } catch {
    return Math.random().toString(36).slice(2);
  }
};

export function listProfiles() {
  const d = readDoc();
  return { profiles: d.profiles, current: d.profiles.find(p => p.id === d.current) ?? null };
}

export function signIn(id: string) {
  const d = readDoc();
  if (d.profiles.some(p => p.id === id)) writeDoc({ ...d, current: id });
}

export function signUp(name: string): Profile {
  const clean = name.trim().slice(0, 40);
  if (!clean) throw new Error('Please enter a name');
  const d = readDoc();
  const p: Profile = { id: newId(), name: clean, createdAt: new Date().toISOString() };
  writeDoc({ profiles: [...d.profiles, p], current: p.id });
  return p;
}

export function signOut() {
  writeDoc({ ...readDoc(), current: null });
}
