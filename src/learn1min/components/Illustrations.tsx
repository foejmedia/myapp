'use client';
/**
 * Soft 3D-style illustrations drawn in SVG (no images, no figures).
 * Motion is CSS-only (see .ill* classes) and is switched off for reduced motion.
 */
import { useId } from 'react';
import s from '../learn.module.css';

const useIds = (...names: string[]) => {
  const base = useId().replace(/:/g, '');
  return Object.fromEntries(names.map(n => [n, `${base}-${n}`])) as Record<string, string>;
};

/** Target with an arrow in the bullseye — the arrow wobbles when its card is hovered. */
export function TargetArt({ className }: { className?: string }) {
  const id = useIds('red', 'white', 'shaft', 'fl', 'sh');
  return (
    <svg viewBox="0 0 160 150" className={`${s.ill} ${className ?? ''}`} aria-hidden>
      <defs>
        <radialGradient id={id.red} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#ff7a7a" />
          <stop offset="0.55" stopColor="#ef3b44" />
          <stop offset="1" stopColor="#b51f2a" />
        </radialGradient>
        <radialGradient id={id.white} cx="38%" cy="32%" r="80%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f3dcdc" />
        </radialGradient>
        <linearGradient id={id.shaft} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6b4a2b" />
          <stop offset="1" stopColor="#3a2716" />
        </linearGradient>
        <linearGradient id={id.fl} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#f2a516" />
        </linearGradient>
        <radialGradient id={id.sh}>
          <stop offset="0" stopColor="#000" stopOpacity="0.18" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="72" cy="136" rx="50" ry="9" fill={`url(#${id.sh})`} />
      <circle cx="72" cy="80" r="56" fill={`url(#${id.red})`} />
      <circle cx="72" cy="80" r="43" fill={`url(#${id.white})`} />
      <circle cx="72" cy="80" r="31" fill={`url(#${id.red})`} />
      <circle cx="72" cy="80" r="19" fill={`url(#${id.white})`} />
      <circle cx="72" cy="80" r="9" fill={`url(#${id.red})`} />
      <ellipse cx="54" cy="52" rx="16" ry="9" fill="#fff" opacity="0.35" transform="rotate(-30 54 52)" />
      <g className={s.illArrow}>
        <path d="M74 78 L128 22" stroke={`url(#${id.shaft})`} strokeWidth="5" strokeLinecap="round" />
        <path d="M120 30 L142 6 L136 30 Z" fill={`url(#${id.fl})`} />
        <path d="M120 30 L144 22 L128 14 Z" fill="#f5b72a" />
        <circle cx="74" cy="78" r="3.5" fill="#3a2716" />
      </g>
    </svg>
  );
}

/** Golden trophy on a wooden base — a shine sweeps across on hover. */
export function TrophyArt({ className, dim = false }: { className?: string; dim?: boolean }) {
  const id = useIds('gold', 'gold2', 'wood', 'clip', 'sh');
  return (
    <svg viewBox="0 0 160 150" className={`${s.ill} ${className ?? ''}`} aria-hidden style={dim ? { filter: 'grayscale(0.85)', opacity: 0.55 } : undefined}>
      <defs>
        <linearGradient id={id.gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff1a8" />
          <stop offset="0.35" stopColor="#ffcf3f" />
          <stop offset="0.75" stopColor="#e6a20e" />
          <stop offset="1" stopColor="#b97a06" />
        </linearGradient>
        <linearGradient id={id.gold2} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd75a" />
          <stop offset="1" stopColor="#c98a08" />
        </linearGradient>
        <linearGradient id={id.wood} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b4636" />
          <stop offset="1" stopColor="#2f241c" />
        </linearGradient>
        <clipPath id={id.clip}>
          <path d="M44 14 H116 V44 C116 74 98 92 80 94 C62 92 44 74 44 44 Z" />
        </clipPath>
        <radialGradient id={id.sh}>
          <stop offset="0" stopColor="#000" stopOpacity="0.2" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="140" rx="52" ry="8" fill={`url(#${id.sh})`} />
      <path d="M46 26 C22 26 20 64 54 70" fill="none" stroke={`url(#${id.gold2})`} strokeWidth="9" strokeLinecap="round" />
      <path d="M114 26 C138 26 140 64 106 70" fill="none" stroke={`url(#${id.gold2})`} strokeWidth="9" strokeLinecap="round" />
      <path d="M44 14 H116 V44 C116 74 98 92 80 94 C62 92 44 74 44 44 Z" fill={`url(#${id.gold})`} />
      <g clipPath={`url(#${id.clip})`}>
        <rect className={s.illShine} x="20" y="0" width="16" height="110" fill="#fff" opacity="0.55" transform="rotate(20 80 50)" />
      </g>
      <ellipse cx="80" cy="15" rx="36" ry="5" fill="#fff3b0" opacity="0.8" />
      <path d="M72 92 H88 L92 110 H68 Z" fill={`url(#${id.gold2})`} />
      <rect x="56" y="108" width="48" height="10" rx="3" fill={`url(#${id.gold})`} />
      <rect x="46" y="116" width="68" height="22" rx="4" fill={`url(#${id.wood})`} />
      <rect x="62" y="122" width="36" height="9" rx="2" fill="#f2c94c" />
      <path d="M80 30 l4 9 10 1 -8 6 3 10 -9 -6 -9 6 3 -10 -8 -6 10 -1z" fill="#fff6c8" opacity="0.9" />
    </svg>
  );
}

/** Rocket that floats gently, with a flickering flame. */
export function RocketArt({ className }: { className?: string }) {
  const id = useIds('body', 'nose', 'win', 'fin', 'flame');
  return (
    <svg viewBox="0 0 120 160" className={`${s.ill} ${s.illFloat} ${className ?? ''}`} aria-hidden>
      <defs>
        <linearGradient id={id.body} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#eef1f6" />
          <stop offset="1" stopColor="#c9d1de" />
        </linearGradient>
        <linearGradient id={id.nose} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8a7a" />
          <stop offset="1" stopColor="#e23b3b" />
        </linearGradient>
        <radialGradient id={id.win} cx="35%" cy="35%" r="70%">
          <stop offset="0" stopColor="#b9e8ff" />
          <stop offset="1" stopColor="#2b6fd6" />
        </radialGradient>
        <linearGradient id={id.fin} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc0ff" />
          <stop offset="1" stopColor="#3b7be0" />
        </linearGradient>
        <linearGradient id={id.flame} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3a0" />
          <stop offset="0.5" stopColor="#ffb02e" />
          <stop offset="1" stopColor="#ff6a2e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className={s.illFlame} d="M50 118 Q60 160 70 118 Z" fill={`url(#${id.flame})`} />
      <path d="M38 92 L22 118 L42 112 Z" fill={`url(#${id.fin})`} />
      <path d="M82 92 L98 118 L78 112 Z" fill={`url(#${id.fin})`} />
      <path d="M60 10 C84 30 88 70 82 112 H38 C32 70 36 30 60 10 Z" fill={`url(#${id.body})`} />
      <path d="M60 10 C72 20 78 32 80 42 H40 C42 32 48 20 60 10 Z" fill={`url(#${id.nose})`} />
      <circle cx="60" cy="62" r="13" fill="#e9eef6" />
      <circle cx="60" cy="62" r="9.5" fill={`url(#${id.win})`} />
      <circle cx="56" cy="58" r="3" fill="#fff" opacity="0.85" />
      <rect x="44" y="104" width="32" height="10" rx="3" fill="#d6dde8" />
      <path d="M60 112 V128" stroke={`url(#${id.fin})`} strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

/** An open book with a small star — used for the next lesson. */
export function BookArt({ className }: { className?: string }) {
  const id = useIds('cover', 'page');
  return (
    <svg viewBox="0 0 140 110" className={`${s.ill} ${className ?? ''}`} aria-hidden>
      <defs>
        <linearGradient id={id.cover} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <linearGradient id={id.page} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e8ecf4" />
        </linearGradient>
      </defs>
      <path d="M10 30 Q40 18 70 32 Q100 18 130 30 V96 Q100 84 70 98 Q40 84 10 96 Z" fill={`url(#${id.cover})`} />
      <path d="M16 28 Q42 18 68 30 V92 Q42 80 16 90 Z" fill={`url(#${id.page})`} />
      <path d="M124 28 Q98 18 72 30 V92 Q98 80 124 90 Z" fill={`url(#${id.page})`} />
      <g stroke="#c9d2e3" strokeWidth="2" strokeLinecap="round">
        <path d="M26 42 Q44 36 60 44M26 54 Q44 48 60 56M26 66 Q44 60 60 68" fill="none" />
        <path d="M80 44 Q96 36 114 42M80 56 Q96 48 114 54M80 68 Q96 60 114 66" fill="none" />
      </g>
      <path className={s.illTwinkle} d="M112 4 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#ffd34d" />
    </svg>
  );
}

/** Minimal deck illustrations for the Flashcards page: line art over a soft tinted disc. */
export function DeckArt({ kind, className }: { kind: 'due' | 'practice' | 'learned' | 'saved'; className?: string }) {
  const tone = { due: '#2563eb', practice: '#ea580c', learned: '#16a34a', saved: '#d97706' }[kind];
  const soft = { due: '#dbeafe', practice: '#ffedd5', learned: '#dcfce7', saved: '#fef3c7' }[kind];
  return (
    <svg viewBox="0 0 96 96" className={`${s.ill} ${className ?? ''}`} aria-hidden>
      <circle cx="48" cy="50" r="38" fill={soft} className={s.deckDisc} />
      <g fill="none" stroke={tone} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        {kind === 'due' && (
          <>
            <rect x="26" y="28" width="44" height="42" rx="8" fill="#fff" />
            <path d="M26 40h44M36 22v10M60 22v10" />
            <g className={s.deckSpin}>
              <path d="M40 56a8 8 0 1 0 8-8" />
              <path d="M48 44v6h-6" />
            </g>
          </>
        )}
        {kind === 'practice' && (
          <>
            <circle cx="48" cy="50" r="22" fill="#fff" />
            <circle cx="48" cy="50" r="13" />
            <circle cx="48" cy="50" r="4" fill={tone} />
            <path className={s.deckDart} d="M50 48 L70 28 M64 28h6v6" />
          </>
        )}
        {kind === 'learned' && (
          <>
            <rect x="30" y="30" width="36" height="44" rx="7" fill="#fff" transform="rotate(-10 48 52)" opacity="0.7" />
            <rect x="32" y="26" width="36" height="44" rx="7" fill="#fff" />
            <path className={s.deckCheck} d="M40 48l6 6 12-13" />
          </>
        )}
        {kind === 'saved' && (
          <>
            <path className={s.deckBob} d="M34 24h28v48L48 62 34 72Z" fill="#fff" />
            <path className={s.deckBob} d="M42 40h12" />
          </>
        )}
      </g>
    </svg>
  );
}

/** Fanned stack of flashcards for "Learn new words" — the top card lifts on hover. */
export function NewDeckArt({ className }: { className?: string }) {
  const id = useIds('back', 'front', 'sh');
  return (
    <svg viewBox="0 0 180 150" className={`${s.ill} ${className ?? ''}`} aria-hidden>
      <defs>
        <linearGradient id={id.back} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bbf7d0" />
          <stop offset="1" stopColor="#4ade80" />
        </linearGradient>
        <linearGradient id={id.front} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f0fdf4" />
        </linearGradient>
        <radialGradient id={id.sh}>
          <stop offset="0" stopColor="#000" stopOpacity="0.16" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="90" cy="140" rx="60" ry="8" fill={`url(#${id.sh})`} />
      <rect x="44" y="30" width="78" height="100" rx="14" fill={`url(#${id.back})`} transform="rotate(-14 83 80)" />
      <rect x="60" y="26" width="78" height="100" rx="14" fill="#86efac" transform="rotate(6 99 76)" />
      <g className={s.newDeckTop}>
        <rect x="50" y="20" width="80" height="104" rx="14" fill={`url(#${id.front})`} stroke="#bbf7d0" strokeWidth="2" />
        <text x="90" y="74" textAnchor="middle" fontSize="34" fill="#15803d" fontFamily="UthmanicHafs, Amiri, serif">
          رَبّ
        </text>
        <rect x="68" y="90" width="44" height="6" rx="3" fill="#bbf7d0" />
        <rect x="76" y="102" width="28" height="5" rx="2.5" fill="#dcfce7" />
      </g>
      <path className={s.illTwinkle} d="M150 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#fbbf24" />
      <path className={s.illTwinkle} d="M30 46 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#86efac" />
    </svg>
  );
}
