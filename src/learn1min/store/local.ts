/**
 * LOCAL DEVELOPMENT STORAGE — browser localStorage implementations of the repository seams.
 *
 * Profiles here are device-local: there are no passwords, because anything stored in the
 * browser would not actually protect an account. Progress never leaves the device.
 * To add real accounts and sync, implement AuthAdapter / ProgressRepository against a
 * backend and swap them in ./index.ts.
 */
import { emptyData, migrate, type UserData } from './model';
import type { AuthAdapter, Profile, ProgressRepository } from './repository';

const PROFILES_KEY = 'l1m:profiles';
const DATA_PREFIX = 'l1m:data:';
const LEGACY_KEY = 'learn-1-min:v1';

type ProfilesDoc = { profiles: Profile[]; current: string | null };

const read = <T>(key: string): T | null => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const write = (key: string, value: unknown) => {
  window.localStorage.setItem(key, JSON.stringify(value)); // throws when blocked or full; callers surface it
};

const newId = () => {
  try {
    const a = new Uint32Array(2);
    crypto.getRandomValues(a);
    return Array.from(a, n => n.toString(36)).join('');
  } catch {
    return Math.random().toString(36).slice(2);
  }
};

export class LocalProgressRepository implements ProgressRepository {
  async load(profileId: string): Promise<UserData | null> {
    const raw = read<unknown>(DATA_PREFIX + profileId);
    if (!raw) return null;
    try {
      return migrate(raw);
    } catch {
      return null;
    }
  }

  async save(profileId: string, data: UserData): Promise<void> {
    write(DATA_PREFIX + profileId, data);
  }

  async remove(profileId: string): Promise<void> {
    try {
      window.localStorage.removeItem(DATA_PREFIX + profileId);
    } catch {
      /* nothing stored */
    }
  }

  subscribe(profileId: string, onChange: (data: UserData) => void) {
    const handler = (e: StorageEvent) => {
      if (e.key !== DATA_PREFIX + profileId || !e.newValue) return;
      try {
        onChange(migrate(JSON.parse(e.newValue)));
      } catch {
        /* ignore foreign writes */
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

export class LocalAuthAdapter implements AuthAdapter {
  readonly kind = 'Saved on this device';

  private doc(): ProfilesDoc {
    return read<ProfilesDoc>(PROFILES_KEY) ?? { profiles: [], current: null };
  }

  async listProfiles() {
    return this.doc().profiles;
  }

  async currentProfile() {
    const d = this.doc();
    return d.profiles.find(p => p.id === d.current) ?? null;
  }

  async signIn(profileId: string) {
    const d = this.doc();
    const p = d.profiles.find(x => x.id === profileId);
    if (!p) throw new Error('Profile not found');
    write(PROFILES_KEY, { ...d, current: p.id });
    return p;
  }

  async signUp(name: string) {
    const clean = name.trim().slice(0, 40);
    if (!clean) throw new Error('Please enter a name');
    const d = this.doc();
    const p: Profile = { id: newId(), name: clean, createdAt: new Date().toISOString() };
    write(PROFILES_KEY, { profiles: [...d.profiles, p], current: p.id });
    // Carry over progress from the first release of Learn in 1 Minute into the first profile.
    if (d.profiles.length === 0) {
      const legacy = read<unknown>(LEGACY_KEY);
      if (legacy) {
        try {
          write(DATA_PREFIX + p.id, migrate(legacy));
        } catch {
          /* unreadable legacy data: start fresh */
        }
      }
    }
    return p;
  }

  async signOut() {
    write(PROFILES_KEY, { ...this.doc(), current: null });
  }

  async rename(profileId: string, name: string) {
    const clean = name.trim().slice(0, 40);
    if (!clean) throw new Error('Please enter a name');
    const d = this.doc();
    const profiles = d.profiles.map(p => (p.id === profileId ? { ...p, name: clean } : p));
    write(PROFILES_KEY, { ...d, profiles });
    return profiles.find(p => p.id === profileId)!;
  }

  async deleteProfile(profileId: string) {
    const d = this.doc();
    write(PROFILES_KEY, { profiles: d.profiles.filter(p => p.id !== profileId), current: d.current === profileId ? null : d.current });
  }
}

/** True when an earlier version left progress behind (shown on the welcome screen). */
export const hasLegacyProgress = () => !!read(LEGACY_KEY);

export { emptyData };
