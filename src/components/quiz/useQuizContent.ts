'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Content, Lang } from '@/lib/quiz/content';

export type ContentState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; content: Content }
  | { status: 'error'; message: string };

/** Loads verified content for the given surahs; `loadDemo` swaps in the bundled offline snapshot */
export function useQuizContent(surahs: number[] | null, lang: Lang) {
  const [state, setState] = useState<ContentState>({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);
  const key = surahs?.join(',') ?? '';

  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    setState({ status: 'loading' });
    fetch(`/api/quiz/content?surahs=${key}&lang=${lang}`, { signal: ctrl.signal })
      .then(async res => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? 'Quran content is unavailable right now.');
        setState({ status: 'ready', content: json as Content });
      })
      .catch(e => {
        if (ctrl.signal.aborted) return;
        setState({ status: 'error', message: e instanceof TypeError ? 'You appear to be offline.' : (e as Error).message });
      });
    return () => ctrl.abort();
  }, [key, lang, attempt]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);

  const loadDemo = useCallback(async () => {
    setState({ status: 'loading' });
    const demo = (await import('@/lib/quiz/demo-content.json')).default as unknown as Content;
    setState({ status: 'ready', content: { ...demo, demo: true } });
  }, []);

  return { state, retry, loadDemo };
}
