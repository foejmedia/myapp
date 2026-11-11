'use client';
/**
 * The vintage radio set: tuning dial, rotary knobs, push-button bank and lamp.
 * Purely presentational; LiveRadio owns the audio and the station lists.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import type { LiveStation } from '@/lib/radio/live';

export type Status = 'idle' | 'connecting' | 'playing' | 'paused' | 'error';

/* ---------- rotary knob ---------- */

const SWEEP = 270; // degrees from min to max

export function Knob({
  label, value, min, max, step = 1, onChange, onCommit, readout, big, disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** fires while dragging or on each keyboard step */
  onChange: (v: number) => void;
  /** fires when a drag or wheel gesture ends (and after each keyboard step) */
  onCommit?: (v: number) => void;
  readout?: ReactNode;
  big?: boolean;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const drag = useRef<{ y: number; v: number; last: number } | null>(null);
  const range = Math.max(0, max - min);
  const pct = range > 0 ? (value - min) / range : 0.5;
  const deg = -SWEEP / 2 + pct * SWEEP;
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));

  // wheel needs a non-passive listener to stop the page scrolling under the knob
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (disabled || range === 0) return;
      e.preventDefault();
      const next = clamp(value + (e.deltaY < 0 ? step : -step));
      if (next !== value) { onChange(next); onCommit?.(next); }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  const onDown = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (disabled || range === 0) return;
    drag.current = { y: e.clientY, v: value, last: value };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const travel = big ? 220 : 150; // px of vertical drag for the full sweep
    const next = clamp(drag.current.v + ((drag.current.y - e.clientY) / travel) * range);
    if (next !== drag.current.last) { drag.current.last = next; onChange(next); }
  };
  const onUp = () => {
    if (!drag.current) return;
    const v = drag.current.last;
    drag.current = null;
    onCommit?.(v);
  };

  return (
    <label className={`rk${big ? ' big' : ''}${disabled ? ' is-off' : ''}`}>
      <span className="rk-ticks" aria-hidden="true">
        {Array.from({ length: 11 }, (_, i) => <i key={i} style={{ transform: `rotate(${-SWEEP / 2 + (i * SWEEP) / 10}deg)` }} />)}
      </span>
      <span
        ref={ref}
        className="rk-cap"
        aria-hidden="true"
        style={{ transform: `rotate(${deg}deg)` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <i />
      </span>
      <input
        type="range"
        className="lr-sr"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled || range === 0}
        onChange={e => { const v = Number(e.target.value); onChange(v); onCommit?.(v); }}
        aria-label={label}
      />
      <span className="rk-label">{label}</span>
      {readout != null && <span className="rk-read">{readout}</span>}
    </label>
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
