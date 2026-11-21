import type { SVGProps } from 'react';
import s from '../community.module.css';

/*
 * The home page "About us" illustration: a circle of learners gathered around an open Quran,
 * framed by an arch, with a few floating cards. Transparent background, so it sits on any section.
 * The people are drawn with no facial features, so no real person is implied.
 */

const GRAD: Record<string, [string, string]> = {
  teal: ['#2dd4bf', '#0f766e'],
  rose: ['#fb7185', '#be123c'],
  amber: ['#fbbf24', '#c2410c'],
  indigo: ['#818cf8', '#4338ca'],
  blue: ['#60a5fa', '#1d4ed8'],
  plum: ['#c084fc', '#7e22ce'],
};
type Grad = keyof typeof GRAD;

interface BustProps {
  x: number;
  y: number;
  s: number;
  /** extra body below the shoulders, so a figure in the back row reaches the table */
  ext?: number;
  kind: 'hijab' | 'kufi' | 'hair';
  skin: string;
  wear: Grad;
  scarf?: Grad;
  cap?: string;
  hairColor?: string;
  beard?: 'short' | 'full';
}

/** A drawn member from the chest up */
function Bust({ x, y, s: k, ext = 0, kind, skin, wear, scarf, cap = '#ffffff', hairColor = '#1f1720', beard }: BustProps) {
  const hijab = kind === 'hijab';
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      {/* body */}
      <path d={`M-84 ${ext}L-100 0C-100-70-60-110 0-110S100-70 100 0L84 ${ext}Z`} fill={`url(#ab-${wear})`} />
      <path d={`M58-94C86-76 100-44 100 0L84 ${ext}H46C58 ${ext * 0.4}-4 30 58-94Z`} fill="#000" opacity=".14" />
      <path d={`M-62 ${ext}C-64-12-62-40-56-64M62 ${ext}C64-12 62-40 56-64`} fill="none" stroke="#000" strokeOpacity=".1" strokeWidth="4" strokeLinecap="round" />
      <path d="M-96-20C-90-74-52-108 0-110" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="5" strokeLinecap="round" />

      {!hijab && (
        <>
          <path d="M-17-150h34v44c0 8-34 8-34 0z" fill={skin} />
          <path d="M-17-128c10 8 24 8 34 0v22c0 8-34 8-34 0z" fill="#000" opacity=".12" />
          <path d="M-26-107 0-74l26-33" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="5" strokeLinejoin="round" />
          <path d="M0-62v54" stroke="#fff" strokeOpacity=".5" strokeWidth="5" strokeDasharray="0.1 16" strokeLinecap="round" />
          <ellipse cx="-41" cy="-172" rx="8" ry="11" fill={skin} />
          <ellipse cx="41" cy="-172" rx="8" ry="11" fill={skin} />
        </>
      )}

      {hijab && (
        <>
          <path
            d="M0-242C-54-242-66-198-64-160c2 34-10 60-34 100 26 20 62 28 98 28s72-8 98-28c-24-40-36-66-34-100 2-38-10-82-64-82z"
            fill={`url(#ab-${scarf ?? wear})`}
          />
          <path d="M-58-92c22 26 40 36 58 38M58-92c-12 16-26 28-42 34" fill="none" stroke="#000" strokeOpacity=".16" strokeWidth="4" strokeLinecap="round" />
          <path d="M-44-210c-10 16-14 34-12 52" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="5" strokeLinecap="round" />
        </>
      )}

      {/* face, left blank on purpose */}
      <ellipse cx="0" cy="-172" rx={hijab ? 34 : 40} ry={hijab ? 40 : 46} fill={skin} />
      <ellipse cx="-12" cy="-190" rx="14" ry="17" fill="#fff" opacity=".16" />
      <circle cx="-20" cy="-158" r="8" fill="#f472b6" opacity=".16" />
      <circle cx="20" cy="-158" r="8" fill="#f472b6" opacity=".16" />

      {hijab && <path d="M-36-182c2-26 18-36 36-36s34 10 36 36c-10-14-22-20-36-20s-26 6-36 20z" fill="#fff" opacity=".9" />}

      {kind === 'hair' && <path d="M-43-176c-6-50 18-64 43-64 28 0 50 14 43 64-6-22-20-32-38-30-18 8-34 8-48 30z" fill={hairColor} />}
      {kind === 'kufi' && (
        <>
          <path d="M-42-188c0-40 20-58 42-58s42 18 42 58z" fill={cap} />
          <path d="M-42-189h84" stroke="#000" strokeOpacity=".12" strokeWidth="6" />
          <g fill="#000" opacity=".1">
            {[[-20, -214], [0, -224], [20, -214], [-10, -202], [10, -202], [-28, -199], [28, -199]].map(([cx, cy]) => (
              <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="3" />
            ))}
          </g>
        </>
      )}
      {beard === 'short' && (
        <path d="M-40-178c2 34 18 52 40 52s38-18 40-52c-6 14-14 22-22 24-6-4-12-6-18-6s-12 2-18 6c-8-2-16-10-22-24z" fill={hairColor} />
      )}
      {beard === 'full' && (
        <path d="M-41-182c-2 46 16 74 41 74s43-28 41-74c-6 18-14 26-22 28-6-4-12-6-19-6s-13 2-19 6c-8-2-16-10-22-28z" fill={hairColor} />
      )}
    </g>
  );
}

/** An eight-point star outline, as in Islamic geometric patterns */
function Star8({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const square = (rot: number) =>
    [0, 1, 2, 3]
      .map(i => {
        const a = ((rot + i * 90) * Math.PI) / 180;
        return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
      })
      .join(' ');
  return (
    <>
      <polygon points={square(0)} />
      <polygon points={square(45)} />
    </>
  );
}

const Sparkle = ({ x, y, r, ...rest }: { x: number; y: number; r: number } & SVGProps<SVGPathElement>) => (
  <path d={`M${x} ${y - r}l${r * 0.3} ${r * 0.7} ${r * 0.7} ${r * 0.3}-${r * 0.7} ${r * 0.3}-${r * 0.3} ${r * 0.7}-${r * 0.3}-${r * 0.7}-${r * 0.7}-${r * 0.3} ${r * 0.7}-${r * 0.3}z`} {...rest} />
);

export default function AboutScene() {
  return (
    <svg className={s.aboutScene} viewBox="0 0 600 560" role="img" aria-label="Members of a circle gathered around an open Quran">
      <defs>
        {Object.entries(GRAD).map(([key, [a, b]]) => (
          <linearGradient key={key} id={`ab-${key}`} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor={a} />
            <stop offset="1" stopColor={b} />
          </linearGradient>
        ))}
        <radialGradient id="ab-glow">
          <stop offset="0" stopColor="#fde68a" stopOpacity=".95" />
          <stop offset=".45" stopColor="#fde68a" stopOpacity=".35" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ab-halo">
          <stop offset="0" stopColor="var(--mint)" stopOpacity=".14" />
          <stop offset="1" stopColor="var(--mint)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ab-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e7b77a" />
          <stop offset="1" stopColor="#a8682e" />
        </linearGradient>
        <linearGradient id="ab-cover" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#065f46" />
        </linearGradient>
        <filter id="ab-shadow" x="-30%" y="-40%" width="160%" height="200%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#141a3a" floodOpacity=".14" />
        </filter>
      </defs>

      {/* arch and a quiet geometric pattern, outlines only */}
      <circle cx="300" cy="330" r="250" fill="url(#ab-halo)" />
      <path d="M100 520V262a200 200 0 0 1 400 0v258" fill="none" stroke="var(--primary-border)" strokeWidth="2" />
      <path d="M124 520V266a176 176 0 0 1 352 0v254" fill="none" stroke="var(--primary-border)" strokeWidth="1.5" strokeDasharray="2 8" strokeLinecap="round" />
      <g fill="none" stroke="var(--primary-border)" strokeWidth="1.5">
        <Star8 cx={300} cy={146} r={34} />
        <Star8 cx={300} cy={146} r={17} />
      </g>

      {/* crescent and stars */}
      <g className={s.twinkle}>
        <path d="M523 92a26 26 0 1 1-30-34 21 21 0 1 0 30 34z" fill="#fbbf24" />
        <Sparkle x={72} y={104} r={12} fill="#fbbf24" />
        <Sparkle x={560} y={300} r={9} fill="var(--mint)" />
        <circle cx="96" cy="292" r="4" fill="var(--mint)" opacity=".6" />
      </g>

      {/* back row */}
      <Bust x={152} y={430} s={0.74} ext={80} kind="hijab" skin="#e9b48c" wear="plum" scarf="teal" />
      <Bust x={300} y={402} s={0.78} ext={120} kind="hair" skin="#c98e64" wear="indigo" hairColor="#2a1d16" beard="short" />
      <Bust x={448} y={430} s={0.74} ext={80} kind="hijab" skin="#8d5a3c" wear="blue" scarf="amber" />

      {/* front row */}
      <Bust x={204} y={500} s={0.92} ext={20} kind="hijab" skin="#f3cba8" wear="indigo" scarf="rose" />
      <Bust x={396} y={500} s={0.92} ext={20} kind="kufi" skin="#b97a50" wear="blue" hairColor="#3a2b22" beard="full" />

      {/* light from the open Quran */}
      <circle cx="300" cy="448" r="120" fill="url(#ab-glow)" className={s.glowPulse} />

      {/* table */}
      <ellipse cx="300" cy="534" rx="230" ry="12" fill="#141a3a" opacity=".08" />
      <rect x="80" y="486" width="440" height="34" rx="17" fill="url(#ab-wood)" />
      <rect x="92" y="489" width="416" height="6" rx="3" fill="#fff" opacity=".25" />

      {/* rehal and the open mushaf */}
      <path d="M248 494l52-28 52 28" fill="none" stroke="#8a5424" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M300 482c-30-14-62-18-90-12l-6 4v8c32-6 66-2 96 12 30-14 64-18 96-12v-8l-6-4c-28-6-60-2-90 12z" fill="url(#ab-cover)" />
      <path d="M300 474c-28-14-58-18-84-12v-56c26-6 56-2 84 12z" fill="#fffaf0" />
      <path d="M300 474c28-14 58-18 84-12v-56c-26-6-56-2-84 12z" fill="#fff4e0" />
      <path d="M300 418v56" stroke="#e8d9b5" strokeWidth="2" />
      <g fill="none" stroke="#c9a86a" strokeWidth="2.2" strokeLinecap="round" opacity=".75">
        {[0, 1, 2, 3, 4].map(i => (
          <g key={i}>
            <path d={`M228 ${424 + i * 9}c22-3 44 0 62 8`} />
            <path d={`M372 ${424 + i * 9}c-22-3-44 0-62 8`} />
          </g>
        ))}
      </g>
      <g className={s.twinkle} fill="#f59e0b">
        <Sparkle x={300} y={380} r={10} />
        <Sparkle x={262} y={396} r={6} opacity=".7" />
        <Sparkle x={340} y={392} r={6} opacity=".7" />
      </g>

      {/* floating cards */}
      <g className={s.floatA} filter="url(#ab-shadow)">
        <rect x="14" y="168" width="184" height="60" rx="18" fill="var(--surface)" stroke="var(--line)" />
        <circle cx="44" cy="198" r="15" fill="#10b981" />
        <path d="M37 198l5 5 9-10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="68" y="194" fill="var(--ink)" fontSize="14" fontWeight="800">Lesson complete</text>
        <text x="68" y="213" fill="var(--ink-3)" fontSize="12" fontWeight="600">Recited to a partner</text>
      </g>
      <g className={s.floatB} filter="url(#ab-shadow)">
        <rect x="402" y="138" width="170" height="48" rx="24" fill="var(--surface)" stroke="var(--line)" />
        <circle cx="428" cy="162" r="14" fill="var(--mint)" />
        <path d="M424 155v14l11-7z" fill="#fff" />
        <g fill="var(--mint)">
          {[8, 16, 11, 22, 14, 26, 12, 18, 9, 20, 13, 7].map((h, i) => (
            <rect key={i} x={452 + i * 9} y={162 - h / 2} width="4" height={h} rx="2" opacity={i < 6 ? 1 : 0.35} />
          ))}
        </g>
      </g>
      <g className={s.floatC} filter="url(#ab-shadow)">
        <circle cx="530" cy="392" r="30" fill="var(--surface)" stroke="var(--line)" />
        <text x="530" y="404" textAnchor="middle" fill="var(--primary)" fontSize="30" fontWeight="700" fontFamily="'Amiri', 'Scheherazade New', 'Traditional Arabic', serif">
          ب
        </text>
      </g>
      <g className={s.floatB} filter="url(#ab-shadow)">
        <rect x="22" y="372" width="122" height="40" rx="20" fill="var(--surface)" stroke="var(--line)" />
        <circle cx="44" cy="392" r="10" fill="#fb7185" />
        <circle cx="58" cy="392" r="10" fill="#fbbf24" stroke="var(--surface)" strokeWidth="2" />
        <circle cx="72" cy="392" r="10" fill="#818cf8" stroke="var(--surface)" strokeWidth="2" />
        <text x="92" y="397" fill="var(--ink)" fontSize="13" fontWeight="800">+5</text>
      </g>
    </svg>
  );
}
