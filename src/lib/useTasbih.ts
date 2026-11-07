'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { STORE_KEY, applyTap, applyUndo, blankState, parseState, switchDhikr, type TasbihState } from './tasbih';

/**
 * Shared counter state for every tasbeeh theme (garden, noor, …).
 * All themes read/write the same storage key, so switching keeps your count.
 */
export function useTasbih(onTap?: (next: TasbihState, hit: boolean) => void) {
  const [st, setSt] = useState<TasbihState>(blankState);
  const [ready, setReady] = useState(false);
  const stRef = useRef(st);
  stRef.current = st;
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;

  useEffect(() => {
    try { setSt(parseState(localStorage.getItem(STORE_KEY))); } catch { /* storage blocked */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(st)); } catch { /* storage blocked */ }
  }, [st, ready]);

  const tap = useCallback(() => {
    const { next, hit } = applyTap(stRef.current);
    stRef.current = next; // fast double-taps before re-render still count
    setSt(next);
    onTapRef.current?.(next, hit);
  }, []);

  const undo = useCallback(() => {
    const next = applyUndo(stRef.current);
    stRef.current = next;
    setSt(next);
  }, []);

  /** Each dhikr keeps its own count, goal and tree. */
  const switchTo = useCallback((id: string, custom?: string) => {
    const next = switchDhikr(stRef.current, id, custom);
    stRef.current = next;
    setSt(next);
    return next;
  }, []);

  return { st, setSt, ready, tap, undo, switchTo };
}

// ── tiny WebAudio synth, no files needed ──
let ctx: AudioContext | null = null;
export function tone(freq: number, dur: number, vol = 0.06, delay = 0, type: OscillatorType = 'sine', glide = 0.6) {
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * glide, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch { /* audio unavailable */ }
}

export function buzz(pattern: number | number[]) {
  try { navigator.vibrate?.(pattern); } catch { /* unsupported */ }
}
