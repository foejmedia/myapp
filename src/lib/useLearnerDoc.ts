'use client';
/**
 * The learner chosen on this device (see ./learnerProfiles) and one saved document of theirs,
 * stored under `<prefix><profileId>`. Reads storage only after mount, saves every change,
 * and follows changes from other tabs. `update` is stable and always sees the latest document,
 * so audio callbacks can call it safely.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as A from './learnerProfiles';

export type LearnerStatus = 'loading' | 'guest' | 'ready';

export function useLearnerDoc<T>(prefix: string, empty: () => T, migrate: (raw: unknown) => T) {
  const [status, setStatus] = useState<LearnerStatus>('loading');
  const [profile, setProfile] = useState<A.Profile | null>(null);
  const [profiles, setProfiles] = useState<A.Profile[]>([]);
  const [doc, setDoc] = useState<T>(empty);
  const [saveError, setSaveError] = useState(false);

  const profileRef = useRef<A.Profile | null>(null);
  const docRef = useRef(doc);
  // the callers pass module-level functions; keep them in refs so the effect below runs once
  const fns = useRef({ empty, migrate });
  fns.current = { empty, migrate };

  const refresh = useCallback(() => {
    const { profiles: list, current } = A.listProfiles();
    setProfiles(list);
    setProfile(current);
    profileRef.current = current;
    let next = fns.current.empty();
    if (current) {
      try {
        const raw = window.localStorage.getItem(prefix + current.id);
        if (raw) next = fns.current.migrate(JSON.parse(raw));
      } catch {
        /* blocked or unreadable: start fresh */
      }
    }
    docRef.current = next;
    setDoc(next);
    setStatus(current ? 'ready' : 'guest');
  }, [prefix]);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === A.PROFILES_STORAGE_KEY || (profileRef.current && e.key === prefix + profileRef.current.id)) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh, prefix]);

  const update = useCallback(
    (fn: (d: T) => T) => {
      const who = profileRef.current;
      if (!who) return;
      const next = fn(docRef.current);
      if (next === docRef.current) return;
      docRef.current = next;
      setDoc(next);
      try {
        window.localStorage.setItem(prefix + who.id, JSON.stringify(next));
        setSaveError(false);
      } catch {
        setSaveError(true);
      }
    },
    [prefix],
  );

  const account = useMemo(
    () => ({
      signIn: (id: string) => {
        A.signIn(id);
        refresh();
      },
      /** returns false when the name is empty or storage is blocked */
      signUp: (name: string) => {
        try {
          A.signUp(name);
          refresh();
          return true;
        } catch {
          setSaveError(true);
          return false;
        }
      },
      signOut: () => {
        A.signOut();
        refresh();
      },
    }),
    [refresh],
  );

  return { status, profile, profiles, doc, saveError, update, ...account };
}

/** Today's local day key ('YYYY-MM-DD'), refreshed every minute; '' before mount. */
export function useToday() {
  const [today, setToday] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);
  return today;
}
