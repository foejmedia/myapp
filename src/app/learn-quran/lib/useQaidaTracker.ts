'use client';
/**
 * The active learner and their Qaida progress (one document per device profile).
 * All actions are stable and read the latest state, so audio callbacks can call them safely.
 */
import { useMemo } from 'react';
import { dayKey } from '@/learn1min/lib/dates';
import { useLearnerDoc, useToday } from '@/lib/useLearnerDoc';
import * as P from './progress';

const fresh = () => P.emptyProgress();

export function useQaidaTracker() {
  const { doc: progress, update, ...learner } = useLearnerDoc(P.STORAGE_PREFIX, fresh, P.migrate);
  const today = useToday();

  const actions = useMemo(() => {
    const day = () => dayKey(new Date());
    return {
      heard: (lesson: number, itemId: string, total: number) => update(p => P.markHeard(p, lesson, itemId, total, day())),
      setDone: (lesson: number, done: boolean) => update(p => P.setDone(p, lesson, done, day())),
      open: (lesson: number) => update(p => P.openLesson(p, lesson, new Date())),
      reset: (lesson: number) => update(p => P.resetLesson(p, lesson)),
    };
  }, [update]);

  return { ...learner, progress, today, ...actions };
}

export type QaidaTracker = ReturnType<typeof useQaidaTracker>;
