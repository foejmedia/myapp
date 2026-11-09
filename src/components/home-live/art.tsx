'use client';
/**
 * Homepage illustrations: soft 3D-style SVG art (no images, no people or animals).
 * Motion is CSS-only (classes in homeLive.module.css) and stops for reduced motion.
 */
import { useId } from 'react';
import s from './homeLive.module.css';

const useIds = (...names: string[]) => {
  const base = useId().replace(/:/g, '');
  return Object.fromEntries(names.map(n => [n, `${base}-${n}`])) as Record<string, string>;
};

/** Open book with a glowing Arabic letter rising from it. */
export function BookGlowArt({ className }: { className?: string }) {
  const id = useIds('cover', 'page', 'glow');
  return (
    <svg viewBox="0 0 160 130" className={className} aria-hidden>
      <defs>
        <linearGradient id={id.cover} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <linearGradient id={id.page} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef2f7" />
        </linearGradient>
        <radialGradient id={id.glow}>
          <stop offset="0" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="122" rx="56" ry="6" fill="#000" opacity="0.08" />
      <circle className={s.pulse} cx="80" cy="44" r="34" fill={`url(#${id.glow})`} />
      <text className={s.rise} x="80" y="56" textAnchor="middle" fontSize="34" fill="#b45309" fontFamily="UthmanicHafs, Amiri, serif">
        ا
      </text>
      <path d="M14 66 Q46 54 80 68 Q114 54 146 66 V116 Q114 104 80 118 Q46 104 14 116 Z" fill={`url(#${id.cover})`} />
      <path d="M20 64 Q48 54 77 66 V112 Q48 100 20 110 Z" fill={`url(#${id.page})`} />
      <path d="M140 64 Q112 54 83 66 V112 Q112 100 140 110 Z" fill={`url(#${id.page})`} />
      <g stroke="#cfd8e6" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M30 76 Q48 70 68 78M30 88 Q48 82 68 90M30 100 Q48 94 68 102" />
        <path d="M92 78 Q112 70 130 76M92 90 Q112 82 130 88M92 102 Q112 94 130 100" />
      </g>
      <path className={s.twinkle} d="M128 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#fbbf24" />
      <path className={s.twinkleSlow} d="M34 34 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#fcd34d" />
    </svg>
  );
}

/** Trophy with a shine that sweeps on hover. */
export function CupArt({ className }: { className?: string }) {
  const id = useIds('gold', 'gold2', 'wood', 'clip');
  return (
    <svg viewBox="0 0 160 140" className={className} aria-hidden>
      <defs>
        <linearGradient id={id.gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff1a8" />
          <stop offset="0.4" stopColor="#ffcf3f" />
          <stop offset="1" stopColor="#c2860a" />
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
          <path d="M46 14 H114 V42 C114 70 97 86 80 88 C63 86 46 70 46 42 Z" />
        </clipPath>
      </defs>
      <ellipse cx="80" cy="132" rx="50" ry="6" fill="#000" opacity="0.1" />
      <path d="M48 26 C26 26 24 60 56 66" fill="none" stroke={`url(#${id.gold2})`} strokeWidth="8" strokeLinecap="round" />
      <path d="M112 26 C134 26 136 60 104 66" fill="none" stroke={`url(#${id.gold2})`} strokeWidth="8" strokeLinecap="round" />
      <path d="M46 14 H114 V42 C114 70 97 86 80 88 C63 86 46 70 46 42 Z" fill={`url(#${id.gold})`} />
      <g clipPath={`url(#${id.clip})`}>
        <rect className={s.shine} x="20" y="0" width="14" height="100" fill="#fff" opacity="0" transform="rotate(20 80 50)" />
      </g>
      <path d="M73 86 H87 L90 102 H70 Z" fill={`url(#${id.gold2})`} />
      <rect x="58" y="100" width="44" height="9" rx="3" fill={`url(#${id.gold})`} />
      <rect x="48" y="108" width="64" height="20" rx="4" fill={`url(#${id.wood})`} />
      <rect x="64" y="113" width="32" height="8" rx="2" fill="#f2c94c" />
      <path d="M80 28 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" fill="#fff6c8" />
    </svg>
  );
}

/** A small tree in a pot that sways, with leaves that grow. */
export function SaplingArt({ className }: { className?: string }) {
  const id = useIds('pot', 'leaf', 'leaf2');
  return (
    <svg viewBox="0 0 160 140" className={className} aria-hidden>
      <defs>
        <linearGradient id={id.pot} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8c9a8" />
          <stop offset="1" stopColor="#c8734a" />
        </linearGradient>
        <radialGradient id={id.leaf} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#86efac" />
          <stop offset="1" stopColor="#15803d" />
        </radialGradient>
        <radialGradient id={id.leaf2} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#bbf7d0" />
          <stop offset="1" stopColor="#22c55e" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="132" rx="44" ry="6" fill="#000" opacity="0.1" />
      <g className={s.sway}>
        <path d="M80 104 C80 80 76 60 80 36" stroke="#7c5a3a" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M79 76 C66 70 58 62 54 52" stroke="#7c5a3a" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M80 62 C92 56 100 48 104 38" stroke="#7c5a3a" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle className={s.grow} cx="80" cy="32" r="22" fill={`url(#${id.leaf})`} />
        <circle className={s.growLate} cx="54" cy="50" r="16" fill={`url(#${id.leaf2})`} />
        <circle className={s.grow} cx="106" cy="38" r="17" fill={`url(#${id.leaf2})`} />
        <circle cx="72" cy="24" r="6" fill="#fff" opacity="0.35" />
        <circle className={s.twinkle} cx="96" cy="22" r="3.5" fill="#fef08a" />
        <circle className={s.twinkleSlow} cx="62" cy="40" r="3" fill="#fef9c3" />
      </g>
      <path d="M52 100 H108 L100 132 H60 Z" fill={`url(#${id.pot})`} />
      <rect x="48" y="96" width="64" height="12" rx="4" fill="#e79a72" />
    </svg>
  );
}

/** A fanned stack of flashcards; the top card flips a little on hover. */
export function CardsArt({ className }: { className?: string }) {
  const id = useIds('a', 'b');
  return (
    <svg viewBox="0 0 160 140" className={className} aria-hidden>
      <defs>
        <linearGradient id={id.a} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c7d2fe" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id={id.b} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef0ff" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="128" rx="50" ry="6" fill="#000" opacity="0.1" />
      <rect x="36" y="30" width="72" height="92" rx="12" fill={`url(#${id.a})`} transform="rotate(-14 72 76)" />
      <rect x="50" y="26" width="72" height="92" rx="12" fill="#a5b4fc" transform="rotate(4 86 72)" />
      <g className={s.flip}>
        <rect x="44" y="22" width="72" height="92" rx="12" fill={`url(#${id.b})`} stroke="#c7d2fe" strokeWidth="2" />
        <text x="80" y="72" textAnchor="middle" fontSize="30" fill="#4338ca" fontFamily="UthmanicHafs, Amiri, serif">
          نُور
        </text>
        <rect x="60" y="86" width="40" height="6" rx="3" fill="#c7d2fe" />
      </g>
      <path className={s.twinkle} d="M128 26 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#fbbf24" />
    </svg>
  );
}

/** Magnifying glass over an open book — for Search Quran. */
export function SearchBookArt({ className }: { className?: string }) {
  const id = useIds('cover', 'glass');
  return (
    <svg viewBox="0 0 170 120" className={className} aria-hidden>
      <defs>
        <linearGradient id={id.cover} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <radialGradient id={id.glass} cx="35%" cy="35%" r="75%">
          <stop offset="0" stopColor="#ecfeff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#a5f3fc" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="112" rx="60" ry="6" fill="#000" opacity="0.08" />
      <path d="M12 40 Q44 28 78 42 Q112 28 144 40 V104 Q112 92 78 106 Q44 92 12 104 Z" fill={`url(#${id.cover})`} />
      <path d="M18 38 Q46 28 75 40 V100 Q46 88 18 98 Z" fill="#fff" />
      <path d="M138 38 Q110 28 81 40 V100 Q110 88 138 98 Z" fill="#f4f7fb" />
      <g stroke="#d4dce8" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M28 52 Q46 46 66 54M28 64 Q46 58 66 66M28 76 Q46 70 66 78" />
        <path d="M90 54 Q110 46 128 52M90 66 Q110 58 128 64M90 78 Q110 70 128 76" />
      </g>
      <g className={s.scan}>
        <circle cx="112" cy="58" r="24" fill={`url(#${id.glass})`} stroke="#0f766e" strokeWidth="6" />
        <path d="M129 75 L152 98" stroke="#0f766e" strokeWidth="10" strokeLinecap="round" />
        <path d="M100 48 a14 14 0 0 1 12 -6" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}
