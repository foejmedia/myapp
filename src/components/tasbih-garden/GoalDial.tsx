'use client';
import { useRef, useState } from 'react';

/*
 * A curved, swipeable goal picker. Labels sit on a large circle whose centre
 * is far below the dial; scrolling rotates them along the arc.
 */
const CX = 180;
const CY = 530;
const R_OUT = 520;
const R_IN = 446;
const R_TEXT = 478;
const STEP = 15; // degrees between labels

function arcPath() {
  const pt = (r: number, x: number) => [x, CY - Math.sqrt(r * r - (x - CX) ** 2)];
  const [x0, y0] = pt(R_OUT, 0);
  const [x1, y1] = pt(R_OUT, 360);
  const [x2, y2] = pt(R_IN, 360);
  const [x3, y3] = pt(R_IN, 0);
  return `M${x0} ${y0} A${R_OUT} ${R_OUT} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${R_IN} ${R_IN} 0 0 0 ${x3} ${y3} Z`;
}
const BAND = arcPath();

interface Props {
  values: number[];
  value: number;
  onChange: (v: number) => void;
}

export default function GoalDial({ values, value, onChange }: Props) {
  const sel = Math.max(0, values.indexOf(value));
  const [drag, setDrag] = useState<number | null>(null); // fractional index while dragging
  const ref = useRef<SVGSVGElement>(null);
  const start = useRef({ x: 0, idx: 0, moved: false });

  const pos = drag ?? sel;
  const clamp = (i: number) => Math.min(values.length - 1, Math.max(0, i));
  const pick = (i: number) => {
    const v = values[clamp(i)];
    if (v !== value) onChange(v);
  };

  /** screen px → index delta */
  const toIdx = (dxPx: number) => {
    const w = ref.current?.getBoundingClientRect().width || 360;
    const units = (dxPx * 360) / w;
    return (units / R_TEXT) * (180 / Math.PI) / STEP;
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    start.current = { x: e.clientX, idx: sel, moved: false };
    setDrag(sel);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag === null) return;
    const dx = e.clientX - start.current.x;
    if (Math.abs(dx) > 4) start.current.moved = true;
    // rubber-band past the ends
    let p = start.current.idx - toIdx(dx);
    if (p < 0) p *= 0.35;
    if (p > values.length - 1) p = values.length - 1 + (p - values.length + 1) * 0.35;
    setDrag(p);
  };
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag === null) return;
    if (start.current.moved) {
      pick(Math.round(drag));
    } else {
      // a tap: pick the label under the finger
      const r = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 360;
      const ang = (Math.asin((x - CX) / R_TEXT) * 180) / Math.PI;
      pick(Math.round(sel + ang / STEP));
    }
    setDrag(null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); pick(sel + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); pick(sel - 1); }
    if (e.key === 'Home') { e.preventDefault(); pick(0); }
    if (e.key === 'End') { e.preventDefault(); pick(values.length - 1); }
  };

  return (
    <svg
      ref={ref}
      className={`tg-dial${drag !== null ? ' dragging' : ''}`}
      viewBox="0 0 360 120"
      role="slider"
      tabIndex={0}
      aria-label="Goal"
      aria-valuemin={values[0]}
      aria-valuemax={values[values.length - 1]}
      aria-valuenow={value}
      aria-valuetext={`Goal ${value}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
      onKeyDown={onKeyDown}
    >
      <defs>
        <filter id="tg-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feFlood floodColor="#ffffff" floodOpacity="0.9" />
          <feComposite in2="b" operator="in" />
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={BAND} className="tg-band" />
      {values.map((v, i) => {
        const a = (i - pos) * STEP;
        if (Math.abs(a) > STEP * 2.2) return null;
        const active = Math.abs(i - pos) < 0.5;
        return (
          <text
            key={v}
            x={CX}
            y={CY - R_TEXT + 12}
            className={`tg-goal${active ? ' on' : ''}`}
            style={{
              transform: `rotate(${a}deg)`,
              opacity: Math.max(0, 1 - Math.max(0, Math.abs(a) - STEP) / (STEP * 1.2)),
            }}
            filter={active ? 'url(#tg-glow)' : undefined}
          >
            {v}
          </text>
        );
      })}
      <line x1={CX} x2={CX} y1={CY - R_TEXT + 22} y2={CY - R_IN} className="tg-pointer" />
    </svg>
  );
}
