'use client';
import { memo, useMemo } from 'react';
import { VB, buildTree, type Slot } from '@/lib/tasbih-tree';

const LEAF = 'M0 0 C3 -4.6, 9 -5.2, 13.5 0 C9 5.2, 3 4.6, 0 0 Z';

function Leaf({ s }: { s: Slot }) {
  const k = 1.75 - s.depth * 0.12;
  return (
    <g transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.rot.toFixed(0)}) scale(${k.toFixed(2)})`}>
      <g className="tb-sprout">
        <path d={LEAF} className={`tb-leaf tb-shade-${s.shade}`} />
        <path d="M0.5 0 L11 0" className="tb-rib" />
      </g>
    </g>
  );
}

function Blossom({ s }: { s: Slot }) {
  return (
    <g transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.rot.toFixed(0)}) scale(1.35)`}>
      <g className="tb-bloom">
        {[0, 72, 144, 216, 288].map(a => (
          <ellipse key={a} cx="0" cy="-3.6" rx="2.9" ry="3.8" transform={`rotate(${a})`} className="tb-petal" />
        ))}
        <circle r="1.9" className="tb-pollen" />
      </g>
    </g>
  );
}

function TreeArt({ shown, full }: { shown: number; full: boolean }) {
  const tree = useMemo(() => buildTree(), []);
  return (
    <svg className={`tb-tree${full ? ' full' : ''}`} viewBox={`0 0 ${VB} ${VB}`} aria-hidden="true">
      <defs>
        <linearGradient id="tb-bark" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#8d7a68" />
          <stop offset="1" stopColor="#b9a894" />
        </linearGradient>
        <radialGradient id="tb-aura" cx="0.5" cy="0.4" r="0.55">
          <stop offset="0" stopColor="#fff3cf" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff3cf" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="150" r="170" fill="url(#tb-aura)" className="tb-aura" />

      {/* ground */}
      <ellipse cx="200" cy="356" rx="132" ry="11" fill="#ebe8de" />
      <ellipse cx="200" cy="354" rx="58" ry="6" fill="#e0dccf" />
      <g className="tb-grass">
        <path d="M118 356 q3 -10 7 -12 M124 356 q0 -8 -4 -13 M268 357 q2 -9 6 -11 M274 357 q-1 -8 -5 -12 M160 358 q2 -7 5 -9 M238 358 q-2 -7 -5 -9" />
      </g>
      <ellipse cx="146" cy="359" rx="5" ry="2.6" fill="#ddd8cb" />
      <ellipse cx="262" cy="361" rx="4" ry="2" fill="#ddd8cb" />

      {/* branches, thickest first so joints look continuous */}
      <g className="tb-branches">
        {tree.branches.map((b, i) => (
          <path key={i} d={b.d} strokeWidth={b.w} />
        ))}
      </g>

      {tree.slots.slice(0, shown).map((s, i) =>
        s.kind === 'blossom' ? <Blossom key={i} s={s} /> : <Leaf key={i} s={s} />,
      )}
    </svg>
  );
}

export default memo(TreeArt);

/** A small tree for the grove row. */
export function MiniTree({ fresh }: { fresh?: boolean }) {
  return (
    <svg className={`tb-mini${fresh ? ' fresh' : ''}`} viewBox="0 0 40 48" aria-hidden="true">
      <ellipse cx="20" cy="45" rx="11" ry="2.5" fill="#e6e2d6" />
      <path d="M20 45 V28 M20 34 L14 28 M20 31 L26 25" stroke="#9b8775" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="18" r="12" fill="#a9c8a4" />
      <circle cx="12" cy="24" r="7.5" fill="#8fb796" />
      <circle cx="28" cy="23" r="8" fill="#7fa98a" />
      <circle cx="16" cy="13" r="2.2" fill="#f6cfd5" />
      <circle cx="27" cy="17" r="1.8" fill="#f6cfd5" />
    </svg>
  );
}
