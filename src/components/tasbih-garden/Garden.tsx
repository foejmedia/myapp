'use client';
import { memo } from 'react';
import { BLOOMS, PER_ROW, ROWS, slotLayer } from '@/lib/tasbih';

/*
 * A lotus pond at dawn. Every count opens a lotus on its own lily pad; the pond
 * fills back-to-front, and once every pad has a flower the next round replants
 * them in a new colour (see slotLayer).
 */

/** Row placement, far bank to near bank: pad centre y and scale. */
const ROW_GEO = [
  { y: 236, s: 0.66 },
  { y: 268, s: 0.8 },
  { y: 306, s: 0.9 },
  { y: 348, s: 1 },
];
const MARGIN = 14;
const STEP = (360 - MARGIN * 2) / PER_ROW;

function slotPos(i: number) {
  const r = Math.floor(i / PER_ROW);
  const c = i % PER_ROW;
  const g = ROW_GEO[r];
  // stagger alternate rows so the pads interleave instead of hiding each other
  return { x: MARGIN + STEP * (c + 0.25 + (r % 2) * 0.5), y: g.y, s: g.s, r, c };
}

const PETAL = 'M0 0 C -7 -5, -7.5 -16, 0 -21 C 7.5 -16, 7 -5, 0 0 Z';

function Lotus({ color, delay }: { color: string; delay: number }) {
  return (
    <g className="tg-bob" style={{ animationDelay: `${delay}s` }}>
      <g className="tg-pad">
        <ellipse cx="0" cy="3" rx="17" ry="6.5" className="tg-pad-shade" />
        <ellipse cx="0" cy="0" rx="16" ry="6" className="tg-pad-leaf" />
        <ellipse cx="-3" cy="-1.5" rx="9" ry="3" className="tg-pad-hi" />
        <path d="M0 0 L 11 -4.6" className="tg-pad-vein" />
      </g>
      <g className="tg-head">
        {/* outer petals, then a paler inner ring, then the seed pod */}
        <g fill={color} transform="translate(0 -2)">
          {[-56, -28, 0, 28, 56].map(a => <path key={a} d={PETAL} transform={`rotate(${a})`} />)}
        </g>
        <g fill={color} transform="translate(0 -3) scale(0.78)">
          {[-40, -13, 13, 40].map(a => <path key={a} d={PETAL} transform={`rotate(${a})`} />)}
        </g>
        <g fill="#fff" opacity="0.38" transform="translate(0 -3) scale(0.78)">
          {[-40, -13, 13, 40].map(a => <path key={a} d={PETAL} transform={`rotate(${a})`} />)}
        </g>
        <ellipse cx="0" cy="-9" rx="3.4" ry="2.4" fill="#f6d35b" />
      </g>
    </g>
  );
}

function PondScene({ count, celebrate }: { count: number; celebrate: number }) {
  const flowers: React.ReactNode[] = [];
  for (let i = 0; i < ROWS * PER_ROW; i++) {
    const layer = slotLayer(i, count);
    if (layer < 0) continue;
    const { x, y, s, r, c } = slotPos(i);
    flowers.push(
      // key includes the layer so a replanted pad blooms again
      <g key={`${i}-${layer}`} transform={`translate(${x.toFixed(1)} ${y}) scale(${s})`}>
        <Lotus color={BLOOMS[layer % BLOOMS.length]} delay={-((c * 0.37 + r * 0.61) % 4)} />
      </g>,
    );
  }

  return (
    <svg className="tg-scene" viewBox="0 0 360 370" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="tg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dff3ee" />
          <stop offset="0.7" stopColor="#f6efe0" />
          <stop offset="1" stopColor="#fbe6cf" />
        </linearGradient>
        <linearGradient id="tg-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fd9cf" />
          <stop offset="0.45" stopColor="#6cc0b0" />
          <stop offset="1" stopColor="#3f9d8c" />
        </linearGradient>
        <radialGradient id="tg-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff4c4" />
          <stop offset="0.5" stopColor="#ffe9a8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* dawn sky, sun and a few soft clouds */}
      <rect width="360" height="370" fill="url(#tg-sky)" />
      <circle cx="286" cy="128" r="54" fill="url(#tg-sun)" />
      <circle cx="286" cy="128" r="17" fill="#fff1b8" />
      {celebrate > 0 && <circle key={`sun${celebrate}`} className="tg-sunburst" cx="286" cy="128" r="80" fill="url(#tg-sun)" />}
      <g fill="#ffffff" opacity="0.7">
        <ellipse cx="70" cy="96" rx="30" ry="8" />
        <ellipse cx="86" cy="90" rx="18" ry="9" />
        <ellipse cx="206" cy="78" rx="22" ry="6" />
        <ellipse cx="218" cy="73" rx="12" ry="6.5" />
      </g>

      {/* misty far hills */}
      <path d="M0 184 C 40 160, 80 156, 120 170 C 160 184, 200 150, 250 158 C 300 166, 330 176, 360 170 L 360 214 L 0 214 Z" fill="#b7dcd0" />
      <path d="M0 196 C 50 186, 100 194, 150 190 C 210 186, 260 176, 360 190 L 360 214 L 0 214 Z" fill="#9fcdbf" opacity="0.8" />

      {/* the water */}
      <path d="M0 204 C 60 198, 120 206, 180 202 C 240 198, 300 204, 360 200 L 360 370 L 0 370 Z" fill="url(#tg-water)" />
      <g fill="none" stroke="#ffffff" strokeLinecap="round" strokeWidth="1.4" opacity="0.32">
        <path d="M30 228 C 50 225, 70 231, 90 228" />
        <path d="M250 222 C 272 219, 290 226, 312 222" />
        <path d="M120 258 C 142 254, 160 262, 184 258" />
        <path d="M292 296 C 312 292, 330 300, 350 296" />
        <path d="M18 330 C 40 326, 58 334, 80 330" />
        <path d="M190 344 C 212 340, 232 348, 254 344" />
      </g>
      {/* the sun's path on the water */}
      <path d="M268 206 L 304 206 L 320 370 L 248 370 Z" fill="#fff2bd" opacity="0.14" />

      {/* reeds and cattails on either bank */}
      <g className="tg-reeds" fill="none" stroke="#3b8a6a" strokeWidth="2.2" strokeLinecap="round">
        <path d="M14 214 C 12 190, 16 170, 10 150" />
        <path d="M26 214 C 28 194, 24 176, 30 160" />
        <path d="M38 214 C 36 196, 40 182, 34 168" />
        <path d="M334 212 C 336 190, 330 174, 338 156" />
        <path d="M348 212 C 346 192, 352 178, 344 164" />
      </g>
      <g fill="#8a5a2b">
        <rect x="7" y="140" width="5" height="18" rx="2.5" />
        <rect x="27" y="152" width="5" height="16" rx="2.5" />
        <rect x="335" y="146" width="5" height="18" rx="2.5" />
      </g>

      {flowers}

      {celebrate > 0 && (
        <g key={`ripple${celebrate}`} className="tg-ripples" fill="none" stroke="#ffffff" strokeWidth="1.6">
          <ellipse className="tg-ripple" cx="180" cy="290" rx="20" ry="7" />
          <ellipse className="tg-ripple" cx="180" cy="290" rx="20" ry="7" style={{ animationDelay: '0.3s' }} />
          <ellipse className="tg-ripple" cx="180" cy="290" rx="20" ry="7" style={{ animationDelay: '0.6s' }} />
        </g>
      )}

      {celebrate > 0 && (
        <g key={`fly${celebrate}`} className="tg-flutter">
          {[0, 1, 2].map(i => (
            <g key={i} className={`tg-bfly tg-bfly-${i}`}>
              {/* a dragonfly: two pairs of wings and a slim body */}
              <ellipse cx="-7" cy="-2" rx="8" ry="2.6" fill={BLOOMS[(i + 2) % BLOOMS.length]} opacity="0.85" />
              <ellipse cx="7" cy="-2" rx="8" ry="2.6" fill={BLOOMS[(i + 2) % BLOOMS.length]} opacity="0.85" />
              <ellipse cx="-6" cy="2" rx="6.5" ry="2.2" fill={BLOOMS[(i + 3) % BLOOMS.length]} opacity="0.75" />
              <ellipse cx="6" cy="2" rx="6.5" ry="2.2" fill={BLOOMS[(i + 3) % BLOOMS.length]} opacity="0.75" />
              <rect x="-0.9" y="-4" width="1.8" height="14" rx="0.9" fill="#2f5d52" />
              <circle cx="0" cy="-4.5" r="1.6" fill="#2f5d52" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

export default memo(PondScene);

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
