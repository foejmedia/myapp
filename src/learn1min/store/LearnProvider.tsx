'use client';
/**
 * App state: the signed-in profile and their progress. Reads storage only after mount,
 * persists every change through the repository, and follows changes from other tabs.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { dayKey } from '../lib/dates';
import { auth, progressRepository, type Profile } from '.';
import { apply, emptyData, migrate, type Action, type UserData } from './model';

type Status = 'loading' | 'signedOut' | 'ready';

type Ctx = {
  status: Status;
  profile: Profile | null;
  profiles: Profile[];
  data: UserData;
  /** today's day key and the current time, refreshed every minute; null before mount */
  clock: { now: Date; today: string } | null;
  saveError: string | null;
  authKind: string;
  dispatch: (a: Action) => void;
  signIn: (id: string) => Promise<void>;
  signUp: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
  rename: (name: string) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  importData: (raw: unknown) => void;
};

const LearnContext = createContext<Ctx | null>(null);
const EMPTY = emptyData(new Date(0));

function useClock() {
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
  return useMemo(() => (now ? { now, today: dayKey(now) } : null), [now]);
}

export function LearnProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [data, setData] = useState<UserData>(EMPTY);
  const [saveError, setSaveError] = useState<string | null>(null);
  const clock = useClock();
  const dataRef = useRef(data);
  dataRef.current = data;

  const openProfile = useCallback(async (p: Profile | null) => {
    setProfiles(await auth.listProfiles());
    setProfile(p);
    if (!p) {
      setData(EMPTY);
      setStatus('signedOut');
      return;
    }
    setData((await progressRepository.load(p.id)) ?? emptyData());
    setStatus('ready');
  }, []);

  useEffect(() => {
    auth.currentProfile().then(openProfile).catch(() => setStatus('signedOut'));
  }, [openProfile]);

  useEffect(() => {
    if (!profile) return;
    return progressRepository.subscribe(profile.id, setData);
  }, [profile]);

  const persist = useCallback(
    (next: UserData) => {
      if (!profile) return;
      progressRepository
        .save(profile.id, next)
        .then(() => setSaveError(null))
        .catch(() => setSaveError('Your progress could not be saved in this browser (storage is blocked or full).'));
    },
    [profile],
  );

  const dispatch = useCallback(
    (a: Action) => {
      const next = apply(dataRef.current, a);
      if (next === dataRef.current) return;
      dataRef.current = next;
      setData(next);
      persist(next);
    },
    [persist],
  );

  const value = useMemo<Ctx>(
    () => ({
      status, profile, profiles, data, clock, saveError, authKind: auth.kind, dispatch,
      signIn: async id => openProfile(await auth.signIn(id)),
      signUp: async name => openProfile(await auth.signUp(name)),
      signOut: async () => {
        await auth.signOut();
        await openProfile(null);
      },
      rename: async name => {
        if (!profile) return;
        const p = await auth.rename(profile.id, name);
        setProfile(p);
        setProfiles(await auth.listProfiles());
      },
      deleteProfile: async id => {
        await progressRepository.remove(id);
        await auth.deleteProfile(id);
        await openProfile(await auth.currentProfile());
      },
      importData: raw => {
        const next = migrate(raw); // throws on foreign files; the caller shows the message
        dataRef.current = next;
        setData(next);
        persist(next);
      },
    }),
    [status, profile, profiles, data, clock, saveError, dispatch, openProfile, persist],
  );

  return <LearnContext.Provider value={value}>{children}</LearnContext.Provider>;
}

export function useLearn(): Ctx {
  const ctx = useContext(LearnContext);
  if (!ctx) throw new Error('useLearn must be used inside <LearnProvider>');
  return ctx;
}
