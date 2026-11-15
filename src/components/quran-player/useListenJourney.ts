'use client';
/** The current learner's translation-listening journey (surah 1 → 114). Actions are stable. */
import { useMemo } from 'react';
import { dayKey } from '@/learn1min/lib/dates';
import { useLearnerDoc, useToday } from '@/lib/useLearnerDoc';
import * as J from '@/lib/listenJourney';

export function useListenJourney() {
  const { doc: journey, update, ...learner } = useLearnerDoc(J.STORAGE_PREFIX, J.emptyJourney, J.migrate);
  const today = useToday();
  const actions = useMemo(
    () => ({
      at: (surah: number, ayah: number, lang: string) => update(j => J.setPosition(j, surah, ayah, lang, new Date())),
      heard: (surah: number, ayah: number, total: number) => update(j => J.ayahHeard(j, surah, ayah, total, dayKey(new Date()))),
      setDone: (surah: number, done: boolean, total: number) => update(j => J.setSurahDone(j, surah, done, total, dayKey(new Date()))),
    }),
    [update],
  );
  return { ...learner, journey, today, ...actions };
}

export type ListenJourney = ReturnType<typeof useListenJourney>;
