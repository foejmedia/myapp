'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { STORE_KEY, blankState, dayKey, parseState, type TasbihState } from './tasbih';

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
    const s = stRef.current;
    const today = dayKey();
    const base = s.todayDate === today ? s : { ...s, todayDate: today, today: 0 };
    const count = base.count + 1;
    const next = { ...base, count, today: base.today + 1, total: base.total + 1 };
    stRef.current = next; // fast double-taps before re-render still count
    setSt(next);
    onTapRef.current?.(next, count % base.goal === 0);
  }, []);

  const undo = useCallback(() => {
    setSt(s => (s.count === 0 ? s : { ...s, count: s.count - 1, today: Math.max(0, s.today - 1), total: Math.max(0, s.total - 1) }));
  }, []);

  return { st, setSt, ready, tap, undo };
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
