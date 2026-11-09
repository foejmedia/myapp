'use client';
/** Progress state for Learn in 1 Minute: loaded after mount, saved on change, synced across tabs. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { STORAGE_KEY, dayKey, emptySaved, load, save, type Saved } from './lib/progress';

export function useLearn() {
  const [state, setState] = useState<Saved | null>(null);
  const [storageOk, setStorageOk] = useState(true);
  const skip = useRef(true);

  useEffect(() => {
    setState(load() ?? emptySaved());
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const fresh = load();
      if (fresh) {
        skip.current = true;
        setState(fresh);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!state) return;
    if (skip.current) {
      skip.current = false;
      // first load: persist only if nothing was stored yet
      if (!window.localStorage.getItem(STORAGE_KEY)) setStorageOk(save(state));
      return;
    }
    setStorageOk(save(state));
  }, [state]);

  const markLearned = useCallback((day: string, lessonId: string) => {
    setState(s => (!s || s.learned[day] ? s : { ...s, learned: { ...s.learned, [day]: lessonId } }));
  }, []);

  const toggleSaved = useCallback((lessonId: string) => {
    setState(s =>
      !s ? s : { ...s, saved: s.saved.includes(lessonId) ? s.saved.filter(x => x !== lessonId) : [...s.saved, lessonId] },
    );
  }, []);

  const addReviews = useCallback((n: number) => {
    setState(s => (!s ? s : { ...s, reviews: s.reviews + n }));
  }, []);

  return { state, storageOk, markLearned, toggleSaved, addReviews };
}

/** The current day key, refreshed every minute (and when the tab becomes visible). */
export function useToday(): { now: Date; today: string } | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    const vis = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', vis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);
  return now ? { now, today: dayKey(now) } : null;
}
