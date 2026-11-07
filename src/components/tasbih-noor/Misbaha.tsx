'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

/*
 * A hanging string of prayer beads. The bead at the bottom of the curve is
 * "under the thumb"; each count pulls it across a small gap to the left.
 * Swipe left to pull a bead, or simply tap.
 */
const VB_W = 400;
const S = 27; // spacing between bead centres along the string
const GAP = 15; // extra space opened at the thumb
const R = 11.5;

/** The cord: a gentle parabola, sampled into an arc-length table. */
function buildCord() {
  const xs: number[] = [], ys: number[] = [], len: number[] = [];
  let acc = 0;
  for (let i = 0; i <= 480; i++) {
    const x = -40 + i;
    const y = 16 + 104 * (1 - ((x - 200) / 240) ** 2);
    if (i > 0) acc += Math.hypot(x - xs[i - 1], y - ys[i - 1]);
    xs.push(x); ys.push(y); len.push(acc);
  }
  return { xs, ys, len, L: acc };
}

function pointAt(c: ReturnType<typeof buildCord>, s: number) {
  let lo = 0, hi = c.len.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (c.len[m] < s) lo = m; else hi = m;
  }
  const k = (s - c.len[lo]) / (c.len[hi] - c.len[lo] || 1);
  return { x: c.xs[lo] + (c.xs[hi] - c.xs[lo]) * k, y: c.ys[lo] + (c.ys[hi] - c.ys[lo]) * k };
}

interface Props {
  count: number;
  onCount: () => void;
  label: string;
}

export default function Misbaha({ count, onCount, label }: Props) {
  const cord = useMemo(buildCord, []);
  const cordPath = useMemo(
    () => cord.xs.filter((_, i) => i % 8 === 0).map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${cord.ys[i * 8].toFixed(1)}`).join(' '),
    [cord],
  );

  const [u, setU] = useState(count); // animated bead position, in counts
  const anim = useRef({ u: count, v: 0, target: count, drag: 0 });
  const raf = useRef(0);
  const ref = useRef<SVGSVGElement>(null);
  const ptr = useRef<{ x: number; moved: boolean } | null>(null);

  const kick = () => {
    if (raf.current) return;
    let last = performance.now();
    const step = (t: number) => {
      const a = anim.current;
      const dt = Math.min(0.032, (t - last) / 1000);
      last = t;
      const goal = a.target + a.drag;
      // critically-damped spring
      const k = 260, c = 2 * Math.sqrt(k);
      a.v += (-(a.u - goal) * k - a.v * c) * dt;
      a.u += a.v * dt;
      if (Math.abs(a.u - goal) < 0.001 && Math.abs(a.v) < 0.01) {
        a.u = goal; a.v = 0;
        setU(goal);
        raf.current = 0;
        return;
      }
      setU(a.u);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const a = anim.current;
    // a reset (or a big jump) would spin hundreds of beads — keep it to a short spin
    if (Math.abs(count - a.u) > 12) a.u = count - Math.sign(count - a.u) * 4;
    a.target = count;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      a.u = count; a.v = 0; setU(count);
      return;
    }
    kick();
  }, [count]);

  useEffect(() => () => { cancelAnimationFrame(raf.current); raf.current = 0; }, []);

  const pxPerBead = () => ((ref.current?.getBoundingClientRect().width || VB_W) / VB_W) * S;

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    ptr.current = { x: e.clientX, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!ptr.current) return;
    const dx = e.clientX - ptr.current.x;
    if (Math.abs(dx) > 6) ptr.current.moved = true;
    if (!ptr.current.moved) return;
    // pulling left advances; pushing right only gives a little resistance
    const d = -dx / pxPerBead();
    anim.current.drag = d > 0 ? Math.min(d, 1.15) : Math.max(d * 0.25, -0.3);
    kick();
  };
  const onPointerUp = () => {
    const p = ptr.current;
    ptr.current = null;
    if (!p) return;
    const pulled = anim.current.drag;
    anim.current.drag = 0;
    if (!p.moved || pulled > 0.35) onCount();
    else kick();
  };

  const centre = cord.L / 2;
  const span = Math.ceil(centre / S) + 2;
  const beads = [];
  for (let g = Math.floor(u) - span; g <= Math.ceil(u) + span; g++) {
    // +0.5: at rest the gap sits *between* the next bead (right) and the last counted one (left)
    const d = g - u + 0.5;
    const s = centre + d * S + GAP * Math.tanh(d * 1.8);
    if (s < -R || s > cord.L + R) continue;
    const { x, y } = pointAt(cord, s);
    const marker = (g + 1) % 33 === 0; // bead g is pulled for count g+1, so every 33rd count is the divider
    const hot = Math.max(0, 1 - Math.abs(d) * 2.4); // only the bead crossing the gap glows
    beads.push(
      <g key={g} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
        {hot > 0.05 && <circle r={R * 2.1} fill="url(#nr-bead-glow)" opacity={hot} />}
        {marker ? (
          <>
            <ellipse rx={R * 0.82} ry={R * 1.18} fill="url(#nr-bead-gold)" />
            <ellipse rx={R * 0.82} ry={2} fill="#7a5418" opacity="0.5" />
          </>
        ) : (
          <circle r={R} fill="url(#nr-bead)" />
        )}
        <ellipse cx={-R * 0.32} cy={-R * 0.4} rx={R * 0.34} ry={R * 0.22} fill="#fff" opacity="0.55" transform="rotate(-30)" />
      </g>,
    );
  }

  return (
    <svg
      ref={ref}
      className="nr-misbaha"
      viewBox={`0 0 ${VB_W} 150`}
      role="button"
      tabIndex={0}
      aria-label={`Count ${label}. ${count} so far. Tap or swipe left.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { ptr.current = null; anim.current.drag = 0; kick(); }}
      onKeyDown={e => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); onCount(); }
      }}
    >
      <defs>
        <radialGradient id="nr-bead" cx="0.36" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#ffe1a1" />
          <stop offset="0.35" stopColor="#f0a842" />
          <stop offset="0.75" stopColor="#b8611a" />
          <stop offset="1" stopColor="#5e2a0b" />
        </radialGradient>
        <radialGradient id="nr-bead-gold" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff6d0" />
          <stop offset="0.45" stopColor="#e2bd62" />
          <stop offset="1" stopColor="#7c5a1a" />
        </radialGradient>
        <radialGradient id="nr-bead-glow">
          <stop offset="0" stopColor="#ffcf70" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffcf70" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={cordPath} className="nr-cord" />
      {beads}
    </svg>
  );
}
