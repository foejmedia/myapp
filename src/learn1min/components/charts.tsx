'use client';
/** Small interactive SVG charts for the dashboard (no chart library). */
import { useEffect, useState } from 'react';
import { keyToDate } from '../lib/dates';
import s from '../learn.module.css';

const pct = (v: number) => `${Math.round(Math.max(0, Math.min(1, v)) * 100)}%`;

/**
 * Arc from angle a0 to a1 (degrees, SVG coordinates: 0 = right, 90 = down).
 * a1 < a0 draws counter-clockwise on screen; a1 > a0 draws clockwise.
 */
function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const rad = (a: number) => (a * Math.PI) / 180;
  const p = (a: number) => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))].map(n => n.toFixed(2)).join(' ');
  const span = Math.abs(a1 - a0);
  return `M ${p(a0)} A ${r} ${r} 0 ${span > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${p(a1)}`;
}

/** Animate from 0 to the real value once mounted (respects reduced motion via CSS transition). */
function useGrow() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(t);
  }, []);
  return on;
}

export type Ring = { key: string; label: string; value: number; detail: string; color: string };

/** Concentric progress rings. Each starts at the bottom and grows counter-clockwise up to 300°. */
export function RadialRings({ rings, center }: { rings: Ring[]; center: { label: string; value: string; detail: string } }) {
  const [sel, setSel] = useState<string | null>(null);
  const grow = useGrow();
  const cx = 200;
  const cy = 200;
  const MAX = 300;
  const active = rings.find(r => r.key === sel);
  return (
    <div className={s.rings}>
      <svg viewBox="0 0 400 400" className={s.ringsSvg} role="img" aria-label={rings.map(r => `${r.label} ${pct(r.value)}`).join(', ')}>
        {[0, 45, 90, 135].map(a => (
          <line key={a} x1={cx} y1={cy} x2={cx + 190 * Math.cos((a * Math.PI) / 180 - Math.PI / 2)} y2={cy + 190 * Math.sin((a * Math.PI) / 180 - Math.PI / 2)} className={s.ringsGuide} />
        ))}
        {rings.map((r, i) => {
          const radius = 178 - i * 24;
          const dim = sel && sel !== r.key;
          return (
            <g
              key={r.key}
              className={s.ringGroup}
              style={{ opacity: dim ? 0.28 : 1 }}
              onMouseEnter={() => setSel(r.key)}
              onMouseLeave={() => setSel(null)}
              onClick={() => setSel(sel === r.key ? null : r.key)}
            >
              <path d={arc(cx, cy, radius, 90, 90 - MAX)} className={s.ringTrack} />
              <path
                d={arc(cx, cy, radius, 90, 90 - MAX)}
                pathLength={100}
                className={s.ringArc}
                stroke={r.color}
                strokeWidth={sel === r.key ? 17 : 13}
                strokeDasharray={`${grow ? Math.max(r.value > 0 ? 1.2 : 0, r.value * 100) : 0} 100`}
                style={{ transitionDelay: `${i * 90}ms` }}
              />
              <text x={cx - 14} y={cy + radius + 5} textAnchor="end" className={sel === r.key ? s.ringLabelOn : s.ringLabel} style={sel === r.key ? { fill: r.color } : undefined}>
                {r.label}
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={60} className={s.ringsCenter} />
        <text x={cx} y={cy - 16} textAnchor="middle" className={s.ringsCenterLabel}>
          {(active?.label ?? center.label).toUpperCase()}
        </text>
        <text x={cx} y={cy + 22} textAnchor="middle" className={s.ringsCenterValue}>
          {active ? pct(active.value) : center.value}
        </text>
        <text x={cx} y={cy + 44} textAnchor="middle" className={s.ringsCenterDetail}>
          {active?.detail ?? center.detail}
        </text>
      </svg>
      <ul className={s.ringsLegend} aria-label="Progress by area">
        {rings.map(r => (
          <li key={r.key}>
            <button
              type="button"
              className={sel === r.key ? s.legendOn : s.legendBtn}
              aria-pressed={sel === r.key}
              onClick={() => setSel(sel === r.key ? null : r.key)}
              onFocus={() => setSel(r.key)}
            >
              <i style={{ background: r.color }} />
              <span>{r.label}</span>
              <b>{pct(r.value)}</b>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 240° gauge with a dotted inner track. */
export function Gauge({ value, label, left, right }: { value: number | null; label: string; left: [string, string]; right: [string, string] }) {
  const grow = useGrow();
  const cx = 120;
  const cy = 118;
  const v = value ?? 0;
  return (
    <div className={s.gauge}>
      <svg viewBox="0 0 240 170" role="img" aria-label={value === null ? `${label}: no data yet` : `${label}: ${pct(v)}`}>
        <path d={arc(cx, cy, 92, 150, 390)} className={s.gaugeTrack} />
        <path d={arc(cx, cy, 92, 150, 390)} pathLength={100} className={s.gaugeArc} strokeDasharray={`${grow ? v * 100 : 0} 100`} />
        <path d={arc(cx, cy, 72, 150, 390)} className={s.gaugeDots} />
        <text x={cx} y={cy + 8} textAnchor="middle" className={s.gaugeValue}>
          {value === null ? '—' : pct(v)}
        </text>
      </svg>
      <div className={s.gaugeFoot}>
        <span>
          <small>{left[0]}</small>
          <strong>{left[1]}</strong>
        </span>
        <span>
          <small>{right[0]}</small>
          <strong>{right[1]}</strong>
        </span>
      </div>
    </div>
  );
}

/** Seven bars, one per day; focus or hover a bar to see its value. */
export function ActivityBars({ days, unit }: { days: { day: string; count: number }[]; unit: [string, string] }) {
  const [sel, setSel] = useState<number | null>(null);
  const grow = useGrow();
  const max = Math.max(4, ...days.map(d => d.count));
  const ticks = [max, Math.round(max / 2)];
  return (
    <div className={s.bars}>
      <div className={s.barsAxis} aria-hidden>
        {ticks.map(t => (
          <span key={t}>{t}</span>
        ))}
        <span>0</span>
      </div>
      <div className={s.barsPlot}>
        {days.map((d, i) => {
          const date = keyToDate(d.day);
          const name = date.toLocaleDateString(undefined, { weekday: 'long' });
          const h = d.count ? Math.max(8, (d.count / max) * 100) : 0;
          return (
            <div key={d.day} className={s.barCol}>
              {sel === i && (
                <span className={s.barTip} role="status">
                  {d.count} {d.count === 1 ? unit[0] : unit[1]}
                </span>
              )}
              <button
                type="button"
                className={`${s.bar} ${d.count ? '' : s.barEmpty} ${sel === i ? s.barOn : ''}`}
                style={{ height: grow ? `${h}%` : d.count ? '4%' : undefined, transitionDelay: `${i * 60}ms` }}
                aria-label={`${name}: ${d.count} ${d.count === 1 ? unit[0] : unit[1]}`}
                onMouseEnter={() => setSel(i)}
                onMouseLeave={() => setSel(null)}
                onFocus={() => setSel(i)}
                onBlur={() => setSel(null)}
              />
              <span className={s.barDay} aria-hidden>
                {date.toLocaleDateString(undefined, { weekday: 'narrow' })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
