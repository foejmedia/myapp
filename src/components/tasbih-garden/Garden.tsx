'use client';
import { memo } from 'react';
import { BLOOMS, PER_ROW, ROWS, slotLayer } from '@/lib/tasbih';

/** Row placement, back (horizon) to front: baseline y and scale. */
const ROW_GEO = [
  { y: 262, s: 0.78 },
  { y: 288, s: 0.88 },
  { y: 316, s: 0.98 },
  { y: 346, s: 1.08 },
];
const MARGIN = 20;
const STEP = (360 - MARGIN * 2) / PER_ROW;

function slotPos(i: number) {
  const r = Math.floor(i / PER_ROW);
  const c = i % PER_ROW;
  const g = ROW_GEO[r];
  // stagger alternate rows so flowers interleave instead of hiding each other
  return { x: MARGIN + STEP * (c + 0.25 + (r % 2) * 0.5), y: g.y, s: g.s, r, c };
}

function Flower({ color, delay }: { color: string; delay: number }) {
  return (
    <g className="tg-sway" style={{ animationDelay: `${delay}s` }}>
      <g className="tg-grow">
        <path d="M0 0 C -2 -18, 2 -34, 0 -48" className="tg-stem" />
        <path d="M0 -8 C -11 -12, -16 -24, -15 -31 C -8 -25, -2 -19, 0 -13 Z" className="tg-leaf" />
        <path d="M0 -17 C 10 -21, 14 -31, 13 -37 C 7 -31, 2 -26, 0 -22 Z" className="tg-leaf tg-leaf-b" />
        <g className="tg-head">
          <path
            d="M-8 -50 C -10 -60, -6 -67, -4 -66 L 0 -59 L 4 -66 C 6 -67, 10 -60, 8 -50 C 6 -44, -6 -44, -8 -50 Z"
            fill={color}
          />
          <path d="M-3 -58 L 0 -66 L 3 -58 C 2 -52, -2 -52, -3 -58 Z" fill="#fff" opacity="0.35" />
        </g>
      </g>
    </g>
  );
}

function GardenScene({ count, celebrate }: { count: number; celebrate: number }) {
  const flowers: React.ReactNode[] = [];
  for (let i = 0; i < ROWS * PER_ROW; i++) {
    const layer = slotLayer(i, count);
    if (layer < 0) continue;
    const { x, y, s, r, c } = slotPos(i);
    flowers.push(
      // key includes the layer so a replanted slot grows again
      <g key={`${i}-${layer}`} transform={`translate(${x.toFixed(1)} ${y}) scale(${s})`}>
        <Flower color={BLOOMS[layer % BLOOMS.length]} delay={-((c * 0.37 + r * 0.61) % 4)} />
      </g>,
    );
  }

  return (
    <svg className="tg-scene" viewBox="0 0 360 370" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="tg-sky" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#d3f4da" />
          <stop offset="1" stopColor="#e6f8ee" />
        </linearGradient>
        <linearGradient id="tg-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e3aa42" />
          <stop offset="1" stopColor="#d9973a" />
        </linearGradient>
        <radialGradient id="tg-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff7c2" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff7c2" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="360" height="370" fill="url(#tg-sky)" />
      {celebrate > 0 && <circle key={`sun${celebrate}`} className="tg-sun" cx="290" cy="110" r="70" fill="url(#tg-sun)" />}

      {/* far hills */}
      <path
        d="M0 252 C 30 216, 60 200, 92 212 C 124 224, 136 252, 176 250 C 214 248, 250 222, 268 196 C 284 172, 300 158, 318 166 C 336 174, 350 196, 360 214 L 360 300 L 0 300 Z"
        fill="#9cc796"
      />
      <path d="M0 262 C 60 248, 120 262, 190 254 C 250 248, 300 258, 360 250 L 360 300 L 0 300 Z" fill="#88bb7f" opacity="0.6" />

      {/* soil + grass bands */}
      <path d="M0 262 C 70 254, 140 266, 210 258 C 280 252, 320 262, 360 256 L 360 370 L 0 370 Z" fill="url(#tg-soil)" />
      <path d="M0 268 C 50 262, 90 274, 150 270 C 210 266, 250 260, 360 266 L 360 276 C 280 272, 220 282, 150 280 C 90 278, 40 276, 0 280 Z" fill="#8fb534" />
      <path d="M0 300 C 40 292, 110 304, 170 298 C 230 292, 300 302, 360 296 L 360 304 C 300 310, 240 302, 170 308 C 110 312, 40 302, 0 308 Z" fill="#9cbf3c" opacity="0.85" />
      <path d="M10 338 C 60 330, 120 342, 190 334 C 240 328, 300 338, 350 332 C 300 344, 230 340, 180 346 C 120 352, 60 344, 10 348 Z" fill="#c98a2f" opacity="0.55" />

      {/* bushes on the horizon */}
      <g fill="#6aa84f">
        <ellipse cx="34" cy="258" rx="22" ry="9" />
        <ellipse cx="236" cy="254" rx="28" ry="10" />
        <ellipse cx="330" cy="256" rx="30" ry="12" fill="#86c25a" />
      </g>
      <g fill="#4e8f3a">
        <ellipse cx="250" cy="257" rx="16" ry="6" />
        <ellipse cx="318" cy="360" rx="34" ry="8" />
      </g>

      {flowers}

      {celebrate > 0 && (
        <g key={`fly${celebrate}`} className="tg-flutter">
          {[0, 1, 2].map(i => (
            <g key={i} className={`tg-bfly tg-bfly-${i}`}>
              <ellipse cx="-4" cy="0" rx="5" ry="7" fill={BLOOMS[(i + 2) % BLOOMS.length]} />
              <ellipse cx="4" cy="0" rx="5" ry="7" fill={BLOOMS[(i + 3) % BLOOMS.length]} />
              <rect x="-0.8" y="-5" width="1.6" height="10" rx="0.8" fill="#3b3b3b" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

export default memo(GardenScene);

/** Decorative filigree for the card corners. */
export function Corner({ flip }: { flip?: boolean }) {
  return (
    <svg className={`tg-corner${flip ? ' tg-corner-r' : ''}`} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M4 60 V4 H60" />
      <path d="M10 54 V12 C10 10 11 10 13 10 H54" opacity="0.6" />
      <path d="M18 20 C 18 12, 28 12, 28 18 C 28 23, 21 23, 22 18" />
      <path d="M28 18 C 34 8, 46 10, 44 18 C 42 24, 35 21, 37 17" />
      <path d="M20 28 C 12 34, 14 44, 20 42 C 24 40, 22 35, 19 37" />
    </svg>
  );
}
