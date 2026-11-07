'use client';
/** The chahar bagh in SVG: four quadrants, two water channels, a fountain, two gates. */
import { memo, useMemo } from 'react';
import type { Look } from '../content/seasons';
import { ARM, C, FOUNTAIN_R, INNER, QUADS, VIEW, WATER, type Placed } from '../lib/layout';
import { mulberry32 } from '../lib/random';
import type { Phase } from '../lib/sky';
import { Plant, PlantShape } from './Plant';
import s from '../game.module.css';

export type GardenViewProps = {
  placed: Placed[];
  goodTreeScale: number;
  goodTreeSeed: string;
  phase: Phase;
  rain: number;
  fountain: 'flowing' | 'still' | 'paused';
  looks: Look[];
  gates: { dawn: boolean; moon: boolean };
  label: string;
  onSelect?: (dhikrId: string) => void;
};

function octagon(r: number, cx = C, cy = C) {
  return Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
}

/** An eight-point star (two overlapping squares) for the path tiles. */
const STAR = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? 9 : 5.2;
    const a = (Math.PI / 8) * i;
    pts.push(`${(12 + Math.cos(a) * r).toFixed(2)},${(12 + Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(' ');
})();

const Gate = memo(function Gate({ x, y, open, label, night }: { x: number; y: number; open: boolean; label: string; night: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} data-gate={label}>
      <title>{`${label}${open ? ' (open)' : ''}`}</title>
      {open && <circle cx={0} cy={-14} r={52} fill="url(#gd-glow)" opacity={night ? 0.9 : 0.6} />}
      <path d="M-40 20L-40-12Q-40-40 0-56Q40-40 40-12L40 20Z" fill="#c99d5f" stroke="#8b6a3d" strokeWidth={3} />
      {/* muqarnas hint */}
      <path d="M-30-14q7-9 15 0q7-9 15 0q8-9 15 0q8-9 15 0" fill="none" stroke="#8b6a3d" strokeWidth={2} />
      <path
        d="M-24 20L-24-6Q-24-26 0-38Q24-26 24-6L24 20Z"
        fill={open ? '#f7dc8f' : '#5b4632'}
        stroke="#7a5c35"
        strokeWidth={2}
      />
      {open ? (
        <>
          <path d="M-24 20L-24-6L-34 0L-34 22Z" fill="#7b5a37" />
          <path d="M24 20L24-6L34 0L34 22Z" fill="#7b5a37" />
        </>
      ) : (
        <line x1={0} y1={-34} x2={0} y2={20} stroke="#3d2f21" strokeWidth={2} />
      )}
    </g>
  );
});

function GardenViewImpl({
  placed, goodTreeScale, goodTreeSeed, phase, rain, fountain, looks, gates, label, onSelect,
}: GardenViewProps) {
  const night = phase === 'night' || phase === 'maghrib' || phase === 'fajr';
  const tint = phase === 'night' ? 0.38 : phase === 'maghrib' ? 0.3 : phase === 'fajr' ? 0.16 : 0;
  const has = (l: Look) => looks.includes(l);
  const lanterns = has('friday') || has('ramadan') || has('lastTen') || has('eid');

  // Good Tree is sorted in with the plants so depth overlaps look right.
  const items = useMemo(() => {
    const gt = { kind: 'good' as const, y: C + 4 };
    const list: ({ kind: 'plant'; p: Placed; y: number } | typeof gt)[] = placed.map(p => ({ kind: 'plant' as const, p, y: p.y }));
    list.push(gt);
    return list.sort((a, b) => a.y - b.y);
  }, [placed]);

  const drops = useMemo(() => {
    const n = Math.round(rain * 70);
    const rnd = mulberry32(7);
    return Array.from({ length: n }, (_, i) => ({
      i, x: rnd() * 1100, delay: -rnd() * 1.4, dur: 0.8 + rnd() * 0.5, len: 14 + rnd() * 10, ry: 60 + rnd() * 940,
    }));
  }, [rain]);

  const lanternPts = useMemo(() => {
    const pts: [number, number][] = [];
    for (let t = FOUNTAIN_R + 60; t < C - INNER; t += 84) {
      pts.push([C - ARM + 4, C - t], [C + ARM - 4, C + t], [C - t, C + ARM - 4], [C + t, C - ARM + 4]);
    }
    return pts;
  }, []);

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      className={s.gardenSvg}
      role="img"
      aria-label={label}
      onClick={e => {
        const el = (e.target as Element).closest('[data-dhikr]');
        const id = el?.getAttribute('data-dhikr');
        if (id && onSelect) onSelect(id);
      }}
    >
      <defs>
        <linearGradient id="gd-water" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6fd6cc" />
          <stop offset="1" stopColor="#2f9fa8" />
        </linearGradient>
        <radialGradient id="gd-soil" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0" stopColor="#b3c294" />
          <stop offset="1" stopColor="#93a877" />
        </radialGradient>
        <radialGradient id="gd-glow">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <pattern id="gd-tiles" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="#ecdcbc" />
          <polygon points={STAR} fill="#dcc596" stroke="#c7aa76" strokeWidth="0.8" />
        </pattern>
      </defs>

      {/* wall and ground */}
      <rect x={12} y={12} width={976} height={976} rx={30} fill="#c8a678" stroke="#a7855a" strokeWidth={6} />
      <rect x={INNER - 8} y={INNER - 8} width={VIEW - 2 * INNER + 16} height={VIEW - 2 * INNER + 16} rx={16} fill="#e9dcc2" />
      {Object.entries(QUADS).map(([id, q]) => (
        <rect
          key={id}
          x={q.x0 + 6}
          y={q.y0 + 6}
          width={q.x1 - q.x0 - 12}
          height={q.y1 - q.y0 - 12}
          rx={20}
          fill="url(#gd-soil)"
          stroke="#7f9466"
          strokeWidth={3}
        />
      ))}

      {/* paths with eight-point-star tiles */}
      <rect x={C - ARM} y={INNER - 8} width={ARM * 2} height={VIEW - 2 * INNER + 16} fill="url(#gd-tiles)" />
      <rect x={INNER - 8} y={C - ARM} width={VIEW - 2 * INNER + 16} height={ARM * 2} fill="url(#gd-tiles)" />

      {/* the four rivers */}
      <rect x={C - WATER} y={INNER} width={WATER * 2} height={VIEW - 2 * INNER} fill="url(#gd-water)" stroke="#2a8590" strokeWidth={2} />
      <rect x={INNER} y={C - WATER} width={VIEW - 2 * INNER} height={WATER * 2} fill="url(#gd-water)" stroke="#2a8590" strokeWidth={2} />
      <g className={fountain === 'paused' ? undefined : s.shimmer} stroke="#e9fffb" strokeWidth={2} strokeDasharray="8 34" opacity={0.65}>
        <line x1={C} y1={INNER} x2={C} y2={C - FOUNTAIN_R} />
        <line x1={C} y1={VIEW - INNER} x2={C} y2={C + FOUNTAIN_R} />
        <line x1={INNER} y1={C} x2={C - FOUNTAIN_R} y2={C} />
        <line x1={VIEW - INNER} y1={C} x2={C + FOUNTAIN_R} y2={C} />
      </g>

      {/* octagonal fountain */}
      <polygon points={octagon(FOUNTAIN_R)} fill="#dccaa4" stroke="#b39a6a" strokeWidth={4} />
      <polygon points={octagon(FOUNTAIN_R - 14)} fill="url(#gd-water)" />
      {has('fullmoon') && night && <circle cx={C + 44} cy={C - 26} r={11} fill="#f8f3dc" opacity={0.9} />}
      {fountain === 'flowing' && (
        <g fill="none" stroke="#f1fffc" strokeWidth={2}>
          {[0, 1, 2].map(i => (
            <circle key={i} cx={C} cy={C} r={40} className={s.ripple} style={{ animationDelay: `${i * 1}s` }} />
          ))}
        </g>
      )}
      <circle cx={C} cy={C} r={30} fill="#b9a071" stroke="#9a7f50" strokeWidth={3} />

      {/* gates: Dawn at the top, Moon at the bottom */}
      <Gate x={C} y={60} open={gates.dawn || has('eid')} label="Dawn Gate: morning adhkar" night={night} />
      <Gate x={C} y={VIEW - 24} open={gates.moon || has('eid')} label="Moon Gate: evening adhkar" night={night} />

      {/* plants and the Good Tree, back to front */}
      {items.map(it =>
        it.kind === 'plant' ? (
          <Plant key={it.p.key} p={it.p} />
        ) : (
          <g key="good-tree" transform={`translate(${C} ${C + 4})`} data-dhikr="good-tree" className={s.clickable}>
            <title>The Good Tree of La ilaha illallah. Tap to see its rings.</title>
            <ellipse cx={0} cy={0} rx={30} ry={8} fill="rgba(48,58,26,.25)" />
            <g transform={`scale(${(0.8 * goodTreeScale).toFixed(3)})`} className={s.sway}>
              <PlantShape species="goodtree" stage="tree" seed={goodTreeSeed} />
            </g>
          </g>
        ),
      )}

      {/* light of the hour */}
      {tint > 0 && <rect x={0} y={0} width={VIEW} height={VIEW} fill="#0d1336" opacity={tint} pointerEvents="none" />}
      {has('arafah') && <rect x={0} y={0} width={VIEW} height={VIEW} fill="#f3c96b" opacity={0.14} pointerEvents="none" />}

      {lanterns && (
        <g pointerEvents="none">
          {lanternPts.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={night ? 22 : 12} fill="url(#gd-glow)" opacity={has('lastTen') && night ? 1 : 0.75} />
              <rect x={x - 4} y={y - 6} width={8} height={11} rx={2} fill="#f2b34c" stroke="#8b5e1c" strokeWidth={1.5} />
            </g>
          ))}
        </g>
      )}

      {has('dhulHijjah') && (
        <g pointerEvents="none">
          {[
            [C - ARM, C - FOUNTAIN_R - 30, C + ARM, C - FOUNTAIN_R - 30],
            [C - ARM, C + FOUNTAIN_R + 30, C + ARM, C + FOUNTAIN_R + 30],
            [C - FOUNTAIN_R - 30, C - ARM, C - FOUNTAIN_R - 30, C + ARM],
            [C + FOUNTAIN_R + 30, C - ARM, C + FOUNTAIN_R + 30, C + ARM],
          ].map(([x1, y1, x2, y2], i) => (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7a5c35" strokeWidth={1.5} />
              {[0.2, 0.4, 0.6, 0.8].map(t => {
                const x = x1 + (x2 - x1) * t;
                const y = y1 + (y2 - y1) * t;
                return <path key={t} d={`M${x - 5} ${y}L${x + 5} ${y}L${x} ${y + 11}Z`} fill={t === 0.4 || t === 0.8 ? '#e8c362' : '#4f8546'} />;
              })}
            </g>
          ))}
        </g>
      )}

      {has('eid') && (
        <g pointerEvents="none">
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} cx={30 + i * 24} cy={20 + (i % 2) * 6} r={4} fill={['#e8c362', '#e2603c', '#4f8546', '#6fd6cc'][i % 4]} />
          ))}
        </g>
      )}

      {drops.length > 0 && (
        <g className={s.rain} stroke="#dff6ff" strokeWidth={2} strokeLinecap="round" opacity={0.7} pointerEvents="none">
          {drops.map(d => (
            <line
              key={d.i}
              x1={d.x}
              y1={-40}
              x2={d.x - 6}
              y2={-40 + d.len}
              style={{ animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s`, '--ry': `${d.ry.toFixed(0)}px` } as React.CSSProperties}
            />
          ))}
        </g>
      )}
    </svg>
  );
}

export default memo(GardenViewImpl);
