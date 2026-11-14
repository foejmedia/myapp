'use client';
/**
 * The active learner and their Qaida progress. Reads storage only after mount,
 * saves every change, and follows changes made in other tabs.
 * All actions are stable and read the latest state, so audio callbacks can call them safely.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dayKey } from '@/learn1min/lib/dates';
import * as P from './progress';
import * as A from './profiles';

type Status = 'loading' | 'guest' | 'ready';

export function useQaidaTracker() {
  const [status, setStatus] = useState<Status>('loading');
  const [profile, setProfile] = useState<A.Profile | null>(null);
  const [profiles, setProfiles] = useState<A.Profile[]>([]);
  const [progress, setProgress] = useState<P.QaidaProgress>(() => P.emptyProgress(new Date(0)));
  const [saveError, setSaveError] = useState(false);
  const [today, setToday] = useState('');

  const profileRef = useRef<A.Profile | null>(null);
  const progressRef = useRef(progress);

  const refresh = useCallback(() => {
    const { profiles: list, current } = A.listProfiles();
    setProfiles(list);
    setProfile(current);
    profileRef.current = current;
    const p = current ? P.loadProgress(current.id) : P.emptyProgress();
    progressRef.current = p;
    setProgress(p);
    setStatus(current ? 'ready' : 'guest');
  }, []);

  useEffect(() => {
    refresh();
    const tick = () => setToday(dayKey(new Date()));
    tick();
    const t = setInterval(tick, 60_000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === A.PROFILES_STORAGE_KEY || (profileRef.current && e.key === P.storageKey(profileRef.current.id))) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      clearInterval(t);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const update = useCallback((fn: (p: P.QaidaProgress, day: string) => P.QaidaProgress) => {
    const who = profileRef.current;
    if (!who) return;
    const next = fn(progressRef.current, dayKey(new Date()));
    if (next === progressRef.current) return;
    progressRef.current = next;
    setProgress(next);
    setSaveError(!P.saveProgress(who.id, next));
  }, []);

  const actions = useMemo(
    () => ({
      heard: (lesson: number, itemId: string, total: number) => update((p, d) => P.markHeard(p, lesson, itemId, total, d)),
      setDone: (lesson: number, done: boolean) => update((p, d) => P.setDone(p, lesson, done, d)),
      open: (lesson: number) => update(p => P.openLesson(p, lesson, new Date())),
      reset: (lesson: number) => update(p => P.resetLesson(p, lesson)),
      signIn: (id: string) => {
        A.signIn(id);
        refresh();
      },
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
    [update, refresh],
  );

  return { status, profile, profiles, progress, today, saveError, ...actions };
}

export type QaidaTracker = ReturnType<typeof useQaidaTracker>;
