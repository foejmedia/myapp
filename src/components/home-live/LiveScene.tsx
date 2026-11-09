'use client';
/**
 * A live sky that follows the visitor's local time: sunrise glow, daylight with drifting clouds,
 * a golden afternoon, dusk, and a night of twinkling stars over a mosque whose windows light up.
 * Rendered after mount (the clock is never read during server rendering).
 */
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import s from './homeLive.module.css';

type Phase = 'dawn' | 'day' | 'golden' | 'dusk' | 'night';

const SKY: Record<Phase, { top: string; bottom: string; greet: string; line: string }> = {
  dawn: { top: '#ffd6c2', bottom: '#fff4e0', greet: 'A fresh morning', line: 'Begin the day with a word of the Qur’an.' },
  day: { top: '#a7dcf5', bottom: '#eaf7ff', greet: 'A bright day', line: 'One minute between tasks is enough to learn something new.' },
  golden: { top: '#ffcf8a', bottom: '#fff1d6', greet: 'A golden afternoon', line: 'A short pause to remember before the day ends.' },
  dusk: { top: '#4b3f8a', bottom: '#f6a37f', greet: 'The day is closing', line: 'Wind down with your evening remembrance.' },
  night: { top: '#0b1437', bottom: '#27306b', greet: 'A quiet night', line: 'Review what you learned today, then rest.' },
};

function phaseOf(h: number): Phase {
  if (h >= 4.5 && h < 7) return 'dawn';
  if (h >= 7 && h < 15.5) return 'day';
  if (h >= 15.5 && h < 18) return 'golden';
  if (h >= 18 && h < 19.75) return 'dusk';
  return 'night';
}

/** Deterministic star field. */
const STARS = Array.from({ length: 34 }, (_, i) => {
  const x = (i * 97.3) % 100;
  const y = ((i * 53.9) % 58) + 2;
  return { x, y, r: i % 5 === 0 ? 1.8 : 1.1, d: (i % 7) * 0.45 };
});

export default function LiveScene() {
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
    const t = isNight ? (((h - 19 + 24) % 24) / 11) : Math.min(1, Math.max(0, (h - 5) / 15));
    const x = 46 + t * 48; // % across — kept to the right half so it never sits behind the text
    const y = 62 - Math.sin(t * Math.PI) * 48; // % from top (high at midday)
    return { phase, isNight, x, y, ...SKY[phase] };
  }, [now]);

  const phase = view?.phase ?? 'day';
  const sky = view ?? { ...SKY.day, x: 50, y: 20, isNight: false };
  const night = phase === 'night' || phase === 'dusk';

  return (
    <section
      className={s.scene}
      data-phase={phase}
      style={{ background: `linear-gradient(180deg, ${sky.top} 0%, ${sky.bottom} 100%)` }}
      aria-label={`${sky.greet}. ${sky.line}`}
    >
      {/* stars */}
      {night && (
        <div className={s.stars} aria-hidden>
          {STARS.map((st, i) => (
            <span key={i} style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.r * 2, height: st.r * 2, animationDelay: `${st.d}s` }} />
          ))}
        </div>
      )}

      {/* sun or moon */}
      <div className={sky.isNight ? s.moon : s.sun} style={{ left: `${sky.x}%`, top: `${sky.y}%` }} aria-hidden />

      {/* clouds */}
      {!sky.isNight && (
        <div className={s.clouds} aria-hidden>
          <span className={s.cloudA} />
          <span className={s.cloudB} />
          <span className={s.cloudC} />
        </div>
      )}

      {/* hills and mosque silhouette */}
      <svg className={s.land} viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden>
        <path d="M0 120 Q200 70 420 112 T860 100 T1200 92 V200 H0 Z" className={s.hillBack} />
        <path d="M0 150 Q260 112 520 146 T1000 136 T1200 140 V200 H0 Z" className={s.hillFront} />
      </svg>
      <svg className={s.mosque} viewBox="0 0 320 170" aria-hidden>
        <g className={s.mosqueBody}>
          <rect x="34" y="40" width="14" height="130" rx="3" />
          <path d="M33 42 L41 14 L49 42 Z" />
          <rect x="272" y="40" width="14" height="130" rx="3" />
          <path d="M271 42 L279 14 L287 42 Z" />
          <path d="M100 170 V100 Q100 46 160 34 Q220 46 220 100 V170 Z" />
          <path d="M157 34 Q160 14 163 34 Z" />
          <rect x="70" y="112" width="180" height="58" rx="4" />
          <path d="M52 170 V126 Q52 104 72 98 Q92 104 92 126 V170 Z" />
          <path d="M228 170 V126 Q228 104 248 98 Q268 104 268 126 V170 Z" />
        </g>
        <g className={night ? s.windowsOn : s.windows}>
          <path d="M150 170 V136 Q150 124 160 120 Q170 124 170 136 V170 Z" />
          <rect x="116" y="126" width="12" height="20" rx="6" />
          <rect x="192" y="126" width="12" height="20" rx="6" />
          <rect x="66" y="132" width="12" height="18" rx="6" />
          <rect x="242" y="132" width="12" height="18" rx="6" />
          <circle cx="160" cy="80" r="7" />
        </g>
      </svg>

      <div className={s.sceneText}>
        <p className={s.sceneKicker}>
          <i className={s.liveDot} aria-hidden />{' '}
          {now ? now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ' '}
        </p>
        <h2 className={s.sceneTitle}>{sky.greet}</h2>
        <p className={s.sceneLine}>{sky.line}</p>
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
