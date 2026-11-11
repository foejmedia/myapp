'use client';
/**
 * The vintage radio set: tuning dial, rotary knobs, push-button bank and lamp.
 * Purely presentational; LiveRadio owns the audio and the station lists.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import type { LiveStation } from '@/lib/radio/live';

export type Status = 'idle' | 'connecting' | 'playing' | 'paused' | 'error';

/* ---------- rotary knob ---------- */

const SWEEP = 270; // degrees of travel from min to max
const TAP_PX = 6; // less movement than this is a tap, not a turn

export function Knob({
  label, value, min, max, step = 1, nudge = step, degPerStep, onChange, onCommit, readout, hint, big, disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** how far a tap on the left/right half of the knob moves it */
  nudge?: number;
  /** turn rate for stepped knobs: degrees of rotation per step (otherwise a full sweep = the whole range) */
  degPerStep?: number;
  /** fires while turning, and on each keyboard step */
  onChange: (v: number) => void;
  /** fires when the hand lets go (and after each keyboard step, tap or wheel notch) */
  onCommit?: (v: number) => void;
  readout?: ReactNode;
  /** small note under the readout, e.g. why the knob is disabled */
  hint?: ReactNode;
  big?: boolean;
  disabled?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null); // the whole knob (cap, tick ring and label) takes the finger
  const cap = useRef<HTMLSpanElement>(null); // the angle is measured around the cap's centre
  const drag = useRef<{ id: number; x: number; y: number; a0: number; v0: number; last: number; moved: boolean } | null>(null);
  const range = Math.max(0, max - min);
  const off = disabled || range === 0;
  const pct = range > 0 ? (value - min) / range : 0.5;
  const deg = -SWEEP / 2 + pct * SWEEP;
  const clamp = (v: number) => Number(Math.min(max, Math.max(min, Math.round(v / step) * step)).toFixed(4));

  // the wheel and touch listeners need to be non-passive to stop the page scrolling under the knob
  const latest = useRef({ value, onChange, onCommit });
  latest.current = { value, onChange, onCommit };
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (off) return;
      e.preventDefault();
      const { value, onChange, onCommit } = latest.current;
      const next = clamp(value + (e.deltaY < 0 ? step : -step));
      if (next !== value) { onChange(next); onCommit?.(next); }
    };
    const onTouchMove = (e: TouchEvent) => { if (drag.current) e.preventDefault(); };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchmove', onTouchMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [off, step, min, max]);

  /** the pointer's angle around the knob's centre, in degrees */
  const angleAt = (e: { clientX: number; clientY: number }) => {
    const r = cap.current!.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (off || (e.target as HTMLElement).tagName === 'INPUT') return;
    e.preventDefault(); // no text selection, no focus jump, no synthetic mouse events on touch
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, a0: angleAt(e), v0: value, last: value, moved: false };
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < TAP_PX) return;
    d.moved = true;
    let da = angleAt(e) - d.a0;
    da = ((da + 540) % 360) - 180; // shortest way round
    const next = clamp(d.v0 + (degPerStep ? (da / degPerStep) * step : (da / SWEEP) * range));
    if (next !== d.last) { d.last = next; onChange(next); }
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    if (d.moved) { onCommit?.(d.last); return; }
    // a tap: left half turns it down a notch, right half up
    const r = cap.current!.getBoundingClientRect();
    const next = clamp(value + (e.clientX < r.left + r.width / 2 ? -nudge : nudge));
    if (next !== value) { onChange(next); onCommit?.(next); }
  };

  return (
    <div
      ref={root}
      className={`rk${big ? ' big' : ''}${off ? ' is-off' : ''}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <span className="rk-ticks" aria-hidden="true">
        {Array.from({ length: 11 }, (_, i) => <i key={i} style={{ transform: `rotate(${-SWEEP / 2 + (i * SWEEP) / 10}deg)` }} />)}
      </span>
      <span ref={cap} className="rk-cap" aria-hidden="true" style={{ transform: `rotate(${deg}deg)` }}>
        <i />
      </span>
      <input
        type="range"
        className="lr-sr"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={off}
        onChange={e => { const v = Number(e.target.value); onChange(v); onCommit?.(v); }}
        aria-label={label}
      />
      <span className="rk-label">{label}</span>
      {readout != null && <span className="rk-read">{readout}</span>}
      {hint != null && <span className="rk-hint">{hint}</span>}
    </div>
  );
}

/* ---------- tuning dial ---------- */

export function Dial({
  band, index, status, onTune, maxNames = 12, children,
}: {
  /** the stations along this band, in order */
  band: LiveStation[];
  /** where the needle rests: a position in `band`, or -1 to park it */
  index: number;
  status: Status;
  onTune: (s: LiveStation) => void;
  /** how many station names are printed along the band */
  maxNames?: number;
  /** the readout strip under the glass */
  children?: ReactNode;
}) {
  const n = band.length;
  const picks = n <= maxNames ? band.map((_, i) => i) : Array.from({ length: maxNames }, (_, i) => Math.round((i * (n - 1)) / (maxNames - 1)));
  const x = (i: number) => (n > 1 ? 4 + (i / (n - 1)) * 92 : 50);
  // the first and last names hang inward from the edge instead of centring on it
  const edge = (i: number) => (n > 1 && i === 0 ? ' is-left' : n > 1 && i === n - 1 ? ' is-right' : '');
  const on = status === 'playing' || status === 'connecting';

  return (
    <div className={`rd-dial st-${status}${on ? ' is-on' : ''}`}>
      <div className="rd-glass">
        {/* station names printed along the band, like city names on an old dial */}
        {(['top', 'bottom'] as const).map((row, r) => (
          <div key={row} className={`rd-names ${row}`}>
            {picks.filter((_, i) => i % 2 === r).map(i => {
              const s = band[i];
              const lit = i === index;
              return (
                <button key={s.id} type="button" className={`rd-name${lit ? ' is-lit' : ''}${edge(i)}`} style={{ left: `${x(i)}%` }} onClick={() => onTune(s)} title={s.name}>
                  {s.name}
                </button>
              );
            })}
          </div>
        ))}

        <svg className="rd-scale" viewBox="0 0 1000 56" preserveAspectRatio="none" aria-hidden="true">
          {Array.from({ length: 41 }, (_, f) => {
            const sx = 70 + (f * 860) / 40;
            const major = f % 4 === 0;
            return (
              <g key={f}>
                <line x1={sx} x2={sx} y1={major ? 14 : 22} y2={34} className={major ? 'major' : ''} />
                {major && <text x={sx} y={50} textAnchor="middle">{88 + f / 2}</text>}
              </g>
            );
          })}
          <text x="22" y="50" className="unit">FM</text>
          <text x="978" y="50" textAnchor="end" className="unit">MHz</text>
        </svg>

        {/* the needle; parked at the left end when nothing on this band is tuned */}
        <span className={`rd-needle${index < 0 ? ' is-idle' : ''}`} style={{ left: `${index < 0 ? 1.5 : x(index)}%` }} aria-hidden="true" />
        <span className="rd-shine" aria-hidden="true" />
      </div>
      <div className="rd-read">{children}</div>
    </div>
  );
}

/* ---------- push-button bank ---------- */

export function Keys<T extends string>({ items, on, onPick }: { items: { id: T; label: string; n?: number }[]; on: T | null; onPick: (id: T) => void }) {
  return (
    <div className="rd-keys" role="tablist" aria-label="Band">
      {items.map(k => (
        <button key={k.id} type="button" role="tab" aria-selected={on === k.id} className={`rd-key${on === k.id ? ' is-down' : ''}`} onClick={() => onPick(k.id)}>
          <span className="rd-key-cap" aria-hidden="true" />
          <span className="rd-key-text">{k.label}{k.n != null && <small>{k.n}</small>}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- pilot lamp ---------- */

export function Lamp({ status }: { status: Status }) {
  const text = status === 'playing' ? 'On air' : status === 'connecting' ? 'Tuning' : status === 'error' ? 'No signal' : status === 'paused' ? 'Standby' : 'Off';
  return (
    <span className={`rd-lamp st-${status}`}>
      <i aria-hidden="true" />
      {text}
    </span>
  );
}
