'use client';
import { memo } from 'react';
import { moonShadowOffset } from '@/lib/tasbih-noor';

/** A moon that waxes from crescent to full as the round progresses. */
export const Moon = memo(function Moon({ progress, full }: { progress: number; full: boolean }) {
  const off = moonShadowOffset(progress) * 30;
  return (
    <svg className={`nr-moon${full ? ' full' : ''}`} viewBox="-60 -60 120 120" aria-hidden="true">
      <defs>
        <radialGradient id="nr-halo">
          <stop offset="0.3" stopColor="#ffe9b8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffe9b8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nr-surface" cx="0.62" cy="0.38" r="0.75">
          <stop offset="0" stopColor="#fffbea" />
          <stop offset="0.6" stopColor="#f7e4b0" />
          <stop offset="1" stopColor="#d9b56c" />
        </radialGradient>
        <mask id="nr-phase">
          <rect x="-60" y="-60" width="120" height="120" fill="black" />
          <circle r="30" fill="white" />
          <circle r="31" cx={-off} fill="black" style={{ transition: 'cx 0.6s ease' }} />
        </mask>
      </defs>
      <circle r="58" fill="url(#nr-halo)" className="nr-halo" style={{ opacity: 0.25 + progress * 0.75 }} />
      <circle r="30" fill="#e8dcc0" opacity="0.07" />
      <g mask="url(#nr-phase)">
        <circle r="30" fill="url(#nr-surface)" />
        <circle cx="8" cy="-9" r="5" fill="#d8bd82" opacity="0.45" />
        <circle cx="14" cy="8" r="3.2" fill="#d8bd82" opacity="0.4" />
        <circle cx="-4" cy="12" r="4" fill="#d8bd82" opacity="0.35" />
        <circle cx="-12" cy="-6" r="2.4" fill="#d8bd82" opacity="0.35" />
      </g>
    </svg>
  );
});

/** Dunes and a mosque silhouette with warmly lit windows. */
export const Skyline = memo(function Skyline() {
  const win = (x: number, y: number, w = 7, h = 14) =>
    `M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} Z`;
  return (
    <svg className="nr-skyline" viewBox="0 0 400 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="nr-dune-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#25306a" />
          <stop offset="1" stopColor="#141b44" />
        </linearGradient>
        <linearGradient id="nr-mosque" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141a3d" />
          <stop offset="1" stopColor="#0b1030" />
        </linearGradient>
        <filter id="nr-winglow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <path d="M0 120 C 50 100, 90 104, 140 116 C 190 128, 250 96, 310 102 C 350 106, 380 112, 400 108 V170 H0 Z" fill="url(#nr-dune-far)" />

      <g fill="url(#nr-mosque)">
        {/* minarets */}
        <rect x="104" y="58" width="12" height="100" />
        <rect x="99" y="82" width="22" height="5" rx="1" />
        <rect x="101" y="108" width="18" height="4" rx="1" />
        <path d="M103 58 L110 34 L117 58 Z" />
        <rect x="284" y="58" width="12" height="100" />
        <rect x="279" y="82" width="22" height="5" rx="1" />
        <rect x="281" y="108" width="18" height="4" rx="1" />
        <path d="M283 58 L290 34 L297 58 Z" />
        {/* hall, drum and onion dome */}
        <rect x="128" y="112" width="144" height="50" />
        <rect x="160" y="100" width="80" height="14" />
        <path d="M156 102 C 152 74, 182 66, 200 46 C 218 66, 248 74, 244 102 Z" />
        <rect x="199" y="28" width="2" height="20" />
        {/* side domes */}
        <path d="M130 114 C 130 98, 146 94, 150 86 C 154 94, 170 98, 170 114 Z" />
        <path d="M230 114 C 230 98, 246 94, 250 86 C 254 94, 270 98, 270 114 Z" />
      </g>
      <path d="M200 20 a6 6 0 1 0 4 10 a5 5 0 1 1 -4 -10 Z" fill="#f3d28b" />

      <g className="nr-windows" fill="#ffc96b" filter="url(#nr-winglow)">
        <path d={win(185, 126, 9, 22)} />
        <path d={win(206, 126, 9, 22)} />
        <path d={win(142, 128)} />
        <path d={win(158, 128)} />
        <path d={win(235, 128)} />
        <path d={win(251, 128)} />
        <path d={win(107, 92, 6, 10)} className="nr-flick" />
        <path d={win(287, 92, 6, 10)} className="nr-flick nr-flick-b" />
      </g>

      <path d="M0 150 C 60 136, 120 146, 200 150 C 280 154, 340 138, 400 144 V170 H0 Z" fill="#080c24" />
    </svg>
  );
});

/** Fanoos lanterns that drift up when a round completes. */
export function Lanterns({ id }: { id: number }) {
  const spots = [
    { x: 12, d: 0, s: 0.9 }, { x: 28, d: 0.5, s: 1.1 }, { x: 44, d: 0.2, s: 0.8 },
    { x: 58, d: 0.8, s: 1.2 }, { x: 72, d: 0.35, s: 0.95 }, { x: 87, d: 0.65, s: 0.85 },
  ];
  return (
    <div key={id} className="nr-lanterns" aria-hidden="true">
      {spots.map((p, i) => (
        <svg
          key={i}
          className="nr-lantern"
          viewBox="0 0 40 70"
          style={{ left: `${p.x}%`, animationDelay: `${p.d}s`, ['--s' as string]: p.s }}
        >
          <path d="M20 2 V8" stroke="#c99a4a" strokeWidth="1.5" />
          <path d="M12 14 L20 7 L28 14 Z" fill="#b07a2c" />
          <path d="M10 16 H30 L33 40 L28 56 H12 L7 40 Z" fill="#ffb84d" />
          <path d="M14 18 H26 L28 40 L24 53 H16 L12 40 Z" fill="#fff1c4" opacity="0.85" />
          <path d="M20 18 V53 M10 28 H30 M8 40 H32" stroke="#b07a2c" strokeWidth="1.2" opacity="0.7" />
          <path d="M12 56 H28 L20 66 Z" fill="#b07a2c" />
        </svg>
      ))}
    </div>
  );
}
