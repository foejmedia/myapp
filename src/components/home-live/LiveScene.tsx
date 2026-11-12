'use client';
/**
 * A live scene that follows the visitor's local time: a lakeside mosque under a sky that moves
 * from a pink dawn to daylight, a golden afternoon, dusk, and a starlit night with lit windows.
 * Original SVG, drawn in code. Every colour comes from the phase tokens in homeLive.module.css.
 * The clock is only read after mount, never during server rendering.
 */
import Link from 'next/link';
import { useEffect, useId, useMemo, useState } from 'react';
import s from './homeLive.module.css';

type Phase = 'dawn' | 'day' | 'golden' | 'dusk' | 'night';

const COPY: Record<Phase, { greet: string; line: string }> = {
  dawn: { greet: 'A fresh morning', line: 'Begin the day with a word of the Qur’an.' },
  day: { greet: 'A bright day', line: 'One minute between tasks is enough to learn something new.' },
  golden: { greet: 'A golden afternoon', line: 'A short pause to remember before the day ends.' },
  dusk: { greet: 'The day is closing', line: 'Wind down with your evening remembrance.' },
  night: { greet: 'A quiet night', line: 'Review what you learned today, then rest.' },
};

function phaseOf(h: number): Phase {
  if (h >= 4.5 && h < 7) return 'dawn';
  if (h >= 7 && h < 15.5) return 'day';
  if (h >= 15.5 && h < 18) return 'golden';
  if (h >= 18 && h < 19.75) return 'dusk';
  return 'night';
}

/* ---- deterministic details, so the server and the browser draw the same picture ---- */
const STARS = Array.from({ length: 56 }, (_, i) => ({
  x: (i * 97.3) % 100,
  y: ((i * 53.9) % 60) + 2,
  r: i % 6 === 0 ? 1.7 : i % 3 === 0 ? 1.2 : 0.8,
  d: (i % 7) * 0.45,
}));
const RIPPLES = Array.from({ length: 30 }, (_, i) => ({
  x: (i * 397) % 2400,
  y: 330 + ((i * 29) % 62),
  w: 36 + ((i * 53) % 90),
  d: (i % 5) * 0.9,
}));
const CUTS = [333, 341, 350, 360, 371, 383];
const BIRDS: [number, number, number][] = [[14, 30, 1], [36, 18, 0.85], [60, 27, 1.1], [82, 10, 0.75], [100, 22, 0.9]];

/* ---- shapes ---- */
const C = 2020; // centre line of the mosque
const WATER = 320; // y of the waterline in the 2400 x 400 drawing
const CRESCENT = 'M4 -9.5A10 10 0 1 0 9.5 4A8 8 0 0 1 4 -9.5Z';
const FROND = 'M0 0C-12 -18 -36 -20 -52 -4C-36 -11 -16 -8 0 0Z';

/** A pointed arch standing on `base`. */
const arch = (cx: number, base: number, w: number, h: number) => {
  const l = cx - w / 2;
  const r = cx + w / 2;
  const top = base - h;
  return `M${l} ${base}V${top + w * 0.6}Q${l} ${top + w * 0.15} ${cx} ${top}Q${r} ${top + w * 0.15} ${r} ${top + w * 0.6}V${base}Z`;
};
/** A round dome sitting on `base`. */
const cap = (cx: number, base: number, w: number, h: number) =>
  `M${cx - w / 2} ${base}Q${cx - w / 2} ${base - h * 0.84} ${cx} ${base - h}Q${cx + w / 2} ${base - h * 0.84} ${cx + w / 2} ${base}Z`;
const cypress = (x: number, base: number, h: number, w: number) =>
  `M${x} ${base}C${x - w} ${base - h * 0.25} ${x - w * 0.75} ${base - h * 0.8} ${x} ${base - h}C${x + w * 0.75} ${base - h * 0.8} ${x + w} ${base - h * 0.25} ${x} ${base}Z`;

function Palm({ x, base, h, lean }: { x: number; base: number; h: number; lean: number }) {
  const tx = x + lean;
  const ty = base - h;
  return (
    <g>
      <path className={s.trunk} d={`M${x} ${base}Q${x - lean * 0.6} ${base - h * 0.5} ${tx} ${ty}`} />
      <g transform={`translate(${tx} ${ty})`}>
        <g className={s.fronds}>
          {[-20, 16, 50].map(a => (
            <path key={a} className={s.tree} transform={`rotate(${a})`} d={FROND} />
          ))}
          {[-20, 16, 50].map(a => (
            <path key={`r${a}`} className={s.tree} transform={`scale(-1 1) rotate(${a})`} d={FROND} />
          ))}
          <path className={s.tree} transform="rotate(88)" d={FROND} />
        </g>
      </g>
    </g>
  );
}

/** The mosque: white walls, emerald domes, gold trim. Drawn once upright and once as its reflection. */
function Mosque() {
  const sides = [-1, 1];
  return (
    <g>
      {/* quay */}
      <rect className={s.wall} x={C - 292} y={304} width={584} height={16} rx={2} />
      <rect className={s.shade} x={C - 292} y={304} width={584} height={16} rx={2} />
      <rect className={s.trim} x={C - 292} y={303} width={584} height={3} rx={1.5} />

      {/* low wings with their small domes */}
      {sides.map(k => {
        const x = k < 0 ? C - 250 : C + 160;
        return (
          <g key={`wing${k}`}>
            <path className={s.dome} d={cap(x + 45, 260, 54, 28)} />
            <rect className={s.wall} x={x} y={258} width={90} height={48} />
            <rect className={s.trim} x={x - 3} y={255} width={96} height={5} rx={2} />
          </g>
        );
      })}

      {/* minarets */}
      {sides.map(k => {
        const x = C + k * 264;
        return (
          <g key={`min${k}`}>
            <path className={s.wall} d={`M${x - 12} 306L${x - 9} 124H${x + 9}L${x + 12} 306Z`} />
            <path className={s.shade} d={`M${x + 1} 124H${x + 9}L${x + 12} 306H${x + 1}Z`} />
            <path className={s.wall} d={`M${x - 13} 183L${x - 9} 194H${x + 9}L${x + 13} 183Z`} />
            <rect className={s.trim} x={x - 17} y={176} width={34} height={7} rx={2} />
            <rect className={s.trim} x={x - 15} y={124} width={30} height={7} rx={2} />
            <rect className={s.wall} x={x - 7} y={98} width={14} height={27} />
            <path className={s.dome} d={`M${x - 11} 100Q${x - 5} 84 ${x} 58Q${x + 5} 84 ${x + 11} 100Z`} />
            <rect className={s.trim} x={x - 1} y={44} width={2} height={16} />
            <path className={s.trim} transform={`translate(${x} 38) scale(0.55)`} d={CRESCENT} />
          </g>
        );
      })}

      {/* prayer hall */}
      <rect className={s.wall} x={C - 160} y={212} width={320} height={94} />
      <rect className={s.shade} x={C - 160} y={294} width={320} height={12} />
      {sides.map(k => {
        const x = C + k * 117;
        const t = C + k * 158;
        return (
          <g key={`half${k}`}>
            <path className={s.dome} d={cap(x, 210, 72, 50)} />
            <rect className={s.trim} x={x - 1} y={148} width={2} height={13} />
            <circle className={s.trim} cx={x} cy={148} r={3} />
            <rect className={s.wall} x={t - 7} y={184} width={14} height={28} />
            <path className={s.dome} d={cap(t, 186, 20, 20)} />
          </g>
        );
      })}
      <rect className={s.trim} x={C - 166} y={206} width={332} height={7} rx={2} />

      {/* drum and the great dome */}
      <rect className={s.wall} x={C - 80} y={176} width={160} height={32} rx={2} />
      <path className={s.dome} d={`M${C - 76} 178C${C - 92} 130 ${C - 46} 98 ${C} 74C${C + 46} 98 ${C + 92} 130 ${C + 76} 178Z`} />
      <path className={s.shade} d={`M${C} 74C${C + 46} 98 ${C + 92} 130 ${C + 76} 178H${C + 14}C${C + 34} 140 ${C + 26} 104 ${C} 74Z`} />
      <path className={s.lite} d={`M${C - 62} 166C${C - 70} 134 ${C - 42} 110 ${C - 14} 92`} />
      <rect className={s.trim} x={C - 84} y={173} width={168} height={6} rx={3} />
      <rect className={s.trim} x={C - 1.5} y={48} width={3} height={28} />
      <circle className={s.trim} cx={C} cy={62} r={4.5} />
      <path className={s.trim} transform={`translate(${C} 38)`} d={CRESCENT} />

      {/* portal */}
      <rect className={s.wall} x={C - 50} y={214} width={100} height={92} rx={2} />
      <rect className={s.trim} x={C - 54} y={210} width={108} height={6} rx={2} />
      <path className={s.shade} d={arch(C, 306, 76, 82)} />
      <rect className={s.wall} x={C - 62} y={298} width={124} height={8} rx={1} />

      {/* doors and windows: dark by day, lit after sunset */}
      <g className={s.wins}>
        <path d={arch(C, 298, 36, 54)} />
        {sides.flatMap(k => [
          ...[70, 102, 134].map(d => <path key={`h${k}${d}`} d={arch(C + k * d, 288, 14, 42)} />),
          ...[178, 205, 232].map(d => <path key={`w${k}${d}`} d={arch(C + k * d, 304, 15, 30)} />),
          <rect key={`m1${k}`} x={C + k * 264 - 3} y={146} width={6} height={15} rx={3} />,
          <rect key={`m2${k}`} x={C + k * 264 - 3} y={214} width={6} height={16} rx={3} />,
          <rect key={`m3${k}`} x={C + k * 264 - 3} y={258} width={6} height={16} rx={3} />,
          <rect key={`m4${k}`} x={C + k * 264 - 2.5} y={104} width={5} height={14} rx={2.5} />,
        ])}
        {[-60, -30, 0, 30, 60].map(d => (
          <path key={`d${d}`} d={arch(C + d, 204, 10, 19)} />
        ))}
      </g>
    </g>
  );
}

export default function LiveScene() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const view = useMemo(() => {
    if (!now) return null;
    const h = now.getHours() + now.getMinutes() / 60;
    const phase = phaseOf(h);
    const isNight = phase === 'night';
    // sun travels 5:00 → 20:00; moon 19:00 → 6:00 (next day)
    const t = isNight ? ((h - 19 + 24) % 24) / 11 : Math.min(1, Math.max(0, (h - 5) / 15));
    const x = 46 + t * 48; // % across — kept to the right half so it never sits behind the text
    const y = 62 - Math.sin(t * Math.PI) * 48; // % from top (high at midday)
    return { phase, isNight, x, y };
  }, [now]);

  const phase = view?.phase ?? 'day';
  const sky = view ?? { x: 62, y: 20, isNight: false };
  const copy = COPY[phase];
  const dark = phase === 'night' || phase === 'dusk';

  return (
    <section className={s.scene} data-phase={phase} aria-label={`${copy.greet}. ${copy.line}`}>
      {/* stars and a passing meteor */}
      {dark && (
        <div className={s.stars} aria-hidden>
          {STARS.map((st, i) => (
            <span key={i} style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.r * 2, height: st.r * 2, animationDelay: `${st.d}s` }} />
          ))}
          {phase === 'night' && <i className={s.meteor} />}
        </div>
      )}

      {/* sun or moon, with its glow on the horizon */}
      <div className={s.orbit} aria-hidden>
        <div className={s.glow} style={{ left: `${sky.x}%` }} />
        <div className={s.orb} style={{ left: `${sky.x}%`, top: `${sky.y}%` }}>
          {sky.isNight ? (
            <svg className={s.moon} viewBox="-20 -20 40 40">
              <mask id={`${uid}c`} maskUnits="userSpaceOnUse" x="-20" y="-20" width="40" height="40">
                <rect x="-20" y="-20" width="40" height="40" fill="#fff" />
                <circle className={s.moonMask} cx="6.5" cy="-4.5" r="12" />
              </mask>
              <circle className={s.moonLit} r="14" mask={`url(#${uid}c)`} />
            </svg>
          ) : (
            <>
              <i className={s.rays} />
              <i className={s.sunDisc} />
            </>
          )}
        </div>
      </div>

      {/* clouds */}
      <div className={s.clouds} aria-hidden>
        {[s.cloudA, s.cloudB, s.cloudC, s.cloudD].map(c => (
          <svg key={c} className={c} viewBox="0 0 120 52">
            <circle cx="30" cy="34" r="14" />
            <circle cx="52" cy="24" r="20" />
            <circle cx="78" cy="29" r="16" />
            <circle cx="97" cy="36" r="10" />
            <rect x="18" y="32" width="90" height="16" rx="8" />
          </svg>
        ))}
      </div>

      {/* birds, by daylight */}
      {!dark && (
        <svg className={s.birds} viewBox="0 0 116 44" aria-hidden>
          {BIRDS.map(([x, y, k], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
              <path className={s.bird} style={{ animationDelay: `${i * 0.13}s` }} d="M-8 0Q-4 -7 0 0Q4 -7 8 0" />
            </g>
          ))}
        </svg>
      )}

      {/* the land: mountains, a far town, the mosque and its reflection in the lake */}
      <svg className={s.land} viewBox="0 0 2400 400" preserveAspectRatio="xMaxYMax slice" aria-hidden>
        <defs>
          <linearGradient id={`${uid}w`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={s.waterA} />
            <stop offset="1" className={s.waterB} />
          </linearGradient>
          <linearGradient id={`${uid}m`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={s.mist0} />
            <stop offset="1" className={s.mist1} />
          </linearGradient>
        </defs>

        <path className={s.m1} d="M0 258C120 236 200 232 320 246S520 214 640 228S860 250 980 214S1180 196 1300 206S1500 168 1640 190S1840 150 1960 176S2180 160 2260 178S2360 180 2400 172V320H0Z" />
        <path className={s.m2} d="M0 284C140 262 260 268 400 276S640 250 780 262S1040 280 1180 250S1420 236 1560 248S1760 226 1900 240S2140 222 2240 238S2360 240 2400 232V320H0Z" />
        <rect x="0" y="236" width="2400" height="84" fill={`url(#${uid}m)`} />

        {/* a town in the haze */}
        <g className={s.far}>
          <rect x="1392" y="268" width="96" height="40" />
          <path d={cap(1440, 269, 56, 26)} />
          <rect x="1380" y="238" width="6" height="70" />
          <path d="M1378 240L1383 224L1388 240Z" />
          <rect x="1494" y="238" width="6" height="70" />
          <path d="M1492 240L1497 224L1502 240Z" />
          {[[1300, 282, 24], [1328, 275, 26], [1356, 269, 20], [1508, 273, 26], [1538, 265, 22], [1564, 277, 30], [1598, 270, 20], [1622, 280, 26]].map(([x, y, w]) => (
            <rect key={x} x={x} y={y} width={w} height={40} />
          ))}
          {[[560, 280, 26], [590, 272, 22], [616, 282, 34], [690, 276, 24], [718, 284, 28]].map(([x, y, w]) => (
            <rect key={x} x={x} y={y} width={w} height={36} />
          ))}
          <path d={cap(668, 282, 30, 16)} />
          <rect x="652" y="280" width="32" height="30" />
        </g>

        <path className={s.m3} d="M0 304C160 290 300 292 460 298S760 286 920 292S1240 300 1400 288S1640 282 1760 290S2060 296 2200 288S2340 284 2400 286V320H0Z" />

        {/* trees */}
        <path className={s.tree} d={cypress(1712, 316, 88, 15)} />
        <path className={s.tree} d={cypress(1690, 316, 62, 12)} />
        <path className={s.tree} d={cypress(2336, 316, 84, 15)} />
        <path className={s.tree} d={cypress(2362, 316, 58, 12)} />
        <path className={s.tree} d={cypress(2392, 316, 72, 13)} />
        <Palm x={1640} base={318} h={104} lean={9} />
        <Palm x={1596} base={318} h={76} lean={-7} />
        <Palm x={1176} base={318} h={58} lean={6} />
        {[1500, 1540, 1068, 1216, 820, 380].map((x, i) => (
          <ellipse key={x} className={s.tree} cx={x} cy={312} rx={26 + (i % 3) * 8} ry={10 + (i % 2) * 3} />
        ))}

        {/* lake */}
        <rect x="0" y={WATER} width="2400" height={400 - WATER} fill={`url(#${uid}w)`} />
        <rect className={s.shore} x="0" y={WATER} width="2400" height="12" />
        <g className={s.reflect} transform={`translate(0 ${WATER * 1.3}) scale(1 -0.3)`}>
          <Mosque />
        </g>
        {CUTS.map((y, i) => (
          <rect key={y} className={s.cut} x={C - 300 + (i % 2) * 16} y={y} width={600 - (i % 2) * 32} height={2 + i * 0.5} rx="1" style={{ animationDelay: `${i * 0.6}s` }} />
        ))}
        {RIPPLES.map((r, i) => (
          <rect key={i} className={s.ripple} x={r.x} y={r.y} width={r.w} height="2" rx="1" style={{ animationDelay: `${r.d}s` }} />
        ))}

        {/* a small boat */}
        <g transform="translate(1322 346)">
          <g className={s.boat}>
            <path className={s.sail} d="M1 -40L22 -5L-15 -7Z" />
            <rect className={s.hull} x="-0.5" y="-42" width="1.6" height="40" />
            <path className={s.hull} d="M-24 -3Q0 9 27 -3L20 6H-17Z" />
          </g>
        </g>

        <Mosque />
        <rect className={s.shoreLine} x="0" y={WATER - 1} width="2400" height="2" />
      </svg>

      {/* light on the water, under the sun or moon */}
      <div className={s.glint} style={{ left: `${sky.x}%` }} aria-hidden />

      <div className={s.sceneText}>
        <p className={s.sceneKicker}>
          <i className={s.liveDot} aria-hidden />{' '}
          {now ? now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ' '}
        </p>
        <h2 className={s.sceneTitle}>{copy.greet}</h2>
        <p className={s.sceneLine}>{copy.line}</p>
        <div className={s.sceneBtns}>
          <Link href="/learn-1-min" className={s.sceneBtn}>
            Take one minute
          </Link>
          <Link href="/tasbih" className={s.sceneBtnGhost}>
            Count your tasbeeh
          </Link>
        </div>
      </div>
    </section>
  );
}
