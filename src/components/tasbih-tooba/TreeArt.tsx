'use client';
import { memo } from 'react';
import { VB, type Slot } from '@/lib/tasbih-tree';
import { treeOf, type Species } from '@/lib/tasbih-species';

const LEAF = 'M0 0 C3 -4.6, 9 -5.2, 13.5 0 C9 5.2, 3 4.6, 0 0 Z';

function Leaf({ s, sp }: { s: Slot; sp: Species }) {
  const palm = sp.shape === 'palm';
  const k = palm ? 1.5 : 1.75 - s.depth * 0.12;
  return (
    <g transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.rot.toFixed(0)}) scale(${k.toFixed(2)} ${(palm ? k * 0.5 : k).toFixed(2)})`}>
      <g className="tb-sprout">
        <path d={LEAF} fill={sp.leaves[s.shade]} />
        <path d="M0.5 0 L11 0" className="tb-rib" />
      </g>
    </g>
  );
}

function Blossom({ s, sp }: { s: Slot; sp: Species }) {
  if (sp.shape === 'palm') {
    // a hanging cluster of dates
    return (
      <g transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)})`}>
        <g className="tb-bloom">
          {[[0, 0], [-4, 3], [4, 3], [0, 6], [-2, 9], [3, 9]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="2.6" ry="3.4" fill={i % 2 ? sp.centre : sp.blossom} />
          ))}
        </g>
      </g>
    );
  }
  return (
    <g transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.rot.toFixed(0)}) scale(1.35)`}>
      <g className="tb-bloom">
        {[0, 72, 144, 216, 288].map(a => (
          <ellipse key={a} cx="0" cy="-3.6" rx="2.9" ry="3.8" transform={`rotate(${a})`} fill={sp.blossom} className="tb-petal" />
        ))}
        <circle r="1.9" fill={sp.centre} />
      </g>
    </g>
  );
}

function TreeArt({ sp, shown, full }: { sp: Species; shown: number; full: boolean }) {
  const tree = treeOf(sp);
  return (
    <svg className={`tb-tree${full ? ' full' : ''}`} viewBox={`0 0 ${VB} ${VB}`} aria-hidden="true">
      <defs>
        <linearGradient id="tb-bark" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#86705c" />
          <stop offset="1" stopColor="#b39f89" />
        </linearGradient>
        <radialGradient id="tb-aura" cx="0.5" cy="0.4" r="0.55">
          <stop offset="0" stopColor="#e9f9df" stopOpacity="0.95" />
          <stop offset="1" stopColor="#e9f9df" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="150" r="170" fill="url(#tb-aura)" className="tb-aura" />

      {/* ground */}
      <ellipse cx="200" cy="356" rx="132" ry="11" fill="#e6efe0" />
      <ellipse cx="200" cy="354" rx="58" ry="6" fill="#d6e6cf" />
      <g className="tb-grass">
        <path d="M118 356 q3 -10 7 -12 M124 356 q0 -8 -4 -13 M268 357 q2 -9 6 -11 M274 357 q-1 -8 -5 -12 M160 358 q2 -7 5 -9 M238 358 q-2 -7 -5 -9" />
      </g>

      <g className="tb-branches">
        {tree.branches.map((b, i) => (
          <path key={i} d={b.d} strokeWidth={b.w} className={b.depth === 9 ? 'tb-ring-mark' : b.depth === 3 && sp.shape === 'palm' ? 'tb-frond' : undefined} />
        ))}
      </g>

      {tree.slots.slice(0, shown).map((s, i) =>
        s.kind === 'blossom' ? <Blossom key={i} s={s} sp={sp} /> : <Leaf key={i} s={s} sp={sp} />,
      )}
    </svg>
  );
}

export default memo(TreeArt);

/** A small tree for the grove, in its species' colours. */
export function MiniTree({ sp, fresh, title }: { sp: Species; fresh?: boolean; title?: string }) {
  return (
    <svg className={`tb-mini${fresh ? ' fresh' : ''}`} viewBox="0 0 40 48" role="img" aria-label={title}>
      {title && <title>{title}</title>}
      <ellipse cx="20" cy="45" rx="11" ry="2.5" fill="#e3ecdd" />
      {sp.shape === 'palm' ? (
        <>
          <path d="M20 45 Q17 32 21 18" stroke="#9b8775" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          {[-160, -125, -90, -55, -20].map(a => {
            const r = (a * Math.PI) / 180;
            return <path key={a} d={`M21 18 q${(Math.cos(r) * 8).toFixed(1)} ${(Math.sin(r) * 8 - 4).toFixed(1)} ${(Math.cos(r) * 14).toFixed(1)} ${(Math.sin(r) * 9 + 4).toFixed(1)}`} stroke={sp.leaves[a % 2 ? 0 : 1]} strokeWidth="3.2" strokeLinecap="round" fill="none" />;
          })}
          <circle cx="19" cy="22" r="2" fill={sp.blossom} />
          <circle cx="23" cy="22" r="2" fill={sp.centre} />
        </>
      ) : (
        <>
          <path d="M20 45 V28 M20 34 L14 28 M20 31 L26 25" stroke="#9b8775" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <circle cx="20" cy="18" r="12" fill={sp.leaves[0]} />
          <circle cx="12" cy="24" r="7.5" fill={sp.leaves[1]} />
          <circle cx="28" cy="23" r="8" fill={sp.leaves[2]} />
          <circle cx="16" cy="13" r="2.4" fill={sp.blossom} stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
          <circle cx="27" cy="17" r="2" fill={sp.blossom} stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
          <circle cx="13" cy="25" r="1.8" fill={sp.blossom} stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
        </>
      )}
    </svg>
  );
}
