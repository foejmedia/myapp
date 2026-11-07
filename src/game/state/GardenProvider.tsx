'use client';
/**
 * The single source of truth while the app is open.
 * Storage is read only after mount, so the static HTML never touches window.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  STORAGE_KEY, createState, eraseAll, loadState, saveState, writeNow, type SavedState,
} from '../lib/storage';
import { reducer, type Action } from './reducer';

type Ctx = {
  state: SavedState;
  ready: boolean;
  firstVisit: boolean;
  storageOk: boolean;
  dispatch: (a: Action) => void;
  count: (dhikrId: string) => SavedState;
  finishOnboarding: () => void;
  eraseEverything: () => void;
};

const GardenContext = createContext<Ctx | null>(null);

// A deterministic placeholder for the first (server) render.
const PLACEHOLDER = createState(0, 'placeholder');

export function GardenProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, PLACEHOLDER);
  const [ready, setReady] = useState(false);
  const [firstVisit, setFirstVisit] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const stateRef = useRef(state);
  const skipSave = useRef(false);

  // Keep a synchronous copy so count() can return the new state immediately.
  const dispatch = useCallback((a: Action) => {
    stateRef.current = reducer(stateRef.current, a);
    rawDispatch(a);
  }, []);

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      skipSave.current = true;
      dispatch({ type: 'hydrate', state: saved });
    } else {
      dispatch({ type: 'hydrate', state: createState() });
      setFirstVisit(true);
    }
    setReady(true);
  }, [dispatch]);

  useEffect(() => {
    if (!ready) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    saveState(state, setStorageOk);
  }, [state, ready]);

  useEffect(() => {
    if (!ready) return;
    const flush = () => setStorageOk(writeNow(stateRef.current));
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const fresh = loadState();
      if (fresh) {
        skipSave.current = true;
        dispatch({ type: 'hydrate', state: fresh });
      }
    };
    window.addEventListener('pagehide', flush);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('storage', onStorage);
    };
  }, [ready, dispatch]);

  const count = useCallback(
    (dhikrId: string) => {
      dispatch({ type: 'count', dhikrId, at: Date.now() });
      return stateRef.current;
    },
    [dispatch],
  );

  const finishOnboarding = useCallback(() => setFirstVisit(false), []);

  const eraseEverything = useCallback(() => {
    eraseAll();
    dispatch({ type: 'reset', state: createState() });
    setFirstVisit(true);
  }, [dispatch]);

  const value = useMemo(
    () => ({ state, ready, firstVisit, storageOk, dispatch, count, finishOnboarding, eraseEverything }),
    [state, ready, firstVisit, storageOk, dispatch, count, finishOnboarding, eraseEverything],
  );
  return <GardenContext.Provider value={value}>{children}</GardenContext.Provider>;
}

export function useGarden(): Ctx {
  const ctx = useContext(GardenContext);
  if (!ctx) throw new Error('useGarden must be used inside <GardenProvider>');
  return ctx;
}
