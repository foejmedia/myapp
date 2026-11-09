'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import './QuickAccessGrid.css';

type Key =
  | 'read' | 'mushaf' | 'nav' | 'hifz' | 'radio' | 'wbw' | 'tafseer' | 'dua'
  | 'tra' | 'namaz' | 'tasbih' | 'qibla' | 'mosques' | 'quiz';

interface Tile {
  key: Key;
  label: string;
  sub: string;
  /** shorter subtitle for phones */
  short?: string;
  href?: string;
  action?: 'navigate';
  /** accent: light shade (dark mode) → deep shade (light mode) */
  from: string;
  to: string;
  badge?: string;
  /** half-row tile with the illustration beside the text */
  wide?: boolean;
}

const TILES: Tile[] = [
  { key: 'read', label: 'Read Quran', sub: '114 Surahs', href: '/read-quran/1', from: '#34d399', to: '#047857' },
  { key: 'mushaf', label: 'Mushaf', sub: '604 Pages', href: '/quran-pages', from: '#fbbf24', to: '#b45309' },
  { key: 'nav', label: 'Navigate', sub: 'Surah · Page', action: 'navigate', from: '#38bdf8', to: '#0369a1' },
  { key: 'hifz', label: 'Memorize', sub: 'Hifz Program', href: '/memorize-quran', from: '#c084fc', to: '#7e22ce' },
  { key: 'radio', label: 'Quran Radio', sub: '24/7 Recitation', href: '/radio', from: '#f87171', to: '#b91c1c', badge: 'LIVE' },
  { key: 'wbw', label: 'Word by Word', sub: 'Arabic Learning', href: '/read-quran/1?mode=word-by-word', from: '#22d3ee', to: '#0e7490' },
  { key: 'tafseer', label: 'Tafseer', sub: 'Ayah Explanations', href: '/tafseer', from: '#a78bfa', to: '#5b21b6' },
  { key: 'dua', label: 'Duas', sub: 'Daily Supplications', short: 'Supplications', href: '/dua', from: '#f472b6', to: '#be185d' },
  { key: 'tra', label: 'Translation Audio', sub: 'Hear each ayah in your language', short: 'In your language', href: '/translation-audio', from: '#2dd4bf', to: '#0f766e', wide: true },
  { key: 'namaz', label: 'Namaz Tracker', sub: 'Log your five prayers and qaza', short: 'Daily prayers', href: '/namaz-tracker', from: '#34d399', to: '#047857', wide: true },
  { key: 'tasbih', label: 'Tasbeeh Garden', sub: 'Every count plants a flower', short: 'Dhikr counter', href: '/tasbih', from: '#4ade80', to: '#15803d', wide: true },
  { key: 'qibla', label: 'Qibla Compass', sub: 'Find the direction of the Kaaba', short: 'Kaaba direction', href: '/qibla', from: '#fbbf24', to: '#b45309', wide: true },
  { key: 'mosques', label: 'Mosques Near You', sub: 'Nearby mosques and directions', short: 'Find nearby', href: '/mosques', from: '#34d399', to: '#065f46', wide: true },
  { key: 'quiz', label: 'Quran Quiz', sub: 'Revise ayahs, surahs and words', short: 'Test yourself', href: '/quiz', from: '#fbbf24', to: '#c2410c', wide: true },
];

/* ── Minimal flat illustrations, drawn in each tile's accent ──
   Classes: a = accent fill, s = soft tint fill, w = surface fill,
   o = accent outline, l = faint accent line, x = white stroke, k = ink fill */
const BEADS = Array.from({ length: 14 }, (_, i) => {
  const t = (i / 14) * Math.PI * 2 - Math.PI / 2;
  return { x: 50 + Math.cos(t) * 19, y: 38 + Math.sin(t) * 19, on: i % 3 === 0 };
});

function Art({ k }: { k: Key }) {
  switch (k) {
    case 'read':
      return (
        <g className="qa-float">
          <path className="w o" d="M60 24c-9-6-21-7-31-4v36c10-3 22-2 31 4z" />
          <path className="s o" d="M60 24c9-6 21-7 31-4v36c-10-3-22-2-31 4z" />
          <path className="l" d="M36 30h16M36 37h16M36 44h11M68 30h16M68 37h16M68 44h11" />
          <path className="o thick" d="M42 64l36 10M78 64L42 74" />
        </g>
      );
    case 'mushaf':
      return (
        <g className="qa-tilt">
          <rect className="s" x="70" y="18" width="10" height="50" rx="3" />
          <rect className="a" x="40" y="14" width="36" height="54" rx="5" />
          <rect className="xo" x="46" y="20" width="24" height="42" rx="2" />
          <rect className="w" x="52" y="35" width="12" height="12" transform="rotate(45 58 41)" />
          <rect className="w" x="52" y="35" width="12" height="12" />
          <circle className="a" cx="58" cy="41" r="3" />
        </g>
      );
    case 'nav':
      return (
        <g>
          <circle className="w o" cx="60" cy="40" r="27" />
          <circle className="s" cx="60" cy="40" r="20" />
          <path className="o" d="M60 13v5M60 62v5M33 40h5M82 40h5" />
          <g className="qa-spin">
            <path className="a" d="M60 23l6 17h-12z" />
            <path className="l-fill" d="M60 57l-6-17h12z" />
          </g>
          <circle className="w o" cx="60" cy="40" r="3.2" />
        </g>
      );
    case 'hifz':
      return (
        <g>
          <rect className="s" x="30" y="26" width="46" height="34" rx="7" transform="rotate(-9 53 43)" />
          <rect className="w o" x="38" y="18" width="46" height="34" rx="7" />
          <path className="l" d="M47 30h24M47 38h16" />
          <g className="qa-pop">
            <circle className="a" cx="84" cy="54" r="11" />
            <path className="x" d="M78.5 54l4 4 7-7.5" />
          </g>
        </g>
      );
    case 'radio':
      return (
        <g>
          <path className="o" d="M46 27l18-12" />
          <circle className="a" cx="64" cy="15" r="2.8" />
          <rect className="w o" x="30" y="27" width="56" height="38" rx="9" />
          <circle className="s" cx="48" cy="46" r="11" />
          <circle className="a" cx="48" cy="46" r="4.5" />
          <path className="l" d="M66 39h12M66 46h12M66 53h7" />
          <path className="o qa-wave" d="M93 34c4 4 4 10 0 14" />
          <path className="o qa-wave d2" d="M99 29c7 7 7 17 0 24" />
        </g>
      );
    case 'wbw':
      return (
        <g>
          <rect className="a qa-float" x="26" y="18" width="32" height="32" rx="8" />
          <text className="t-w" x="42" y="40" textAnchor="middle" lang="ar">ع</text>
          <path className="l" d="M58 52c6 6 10 7 16 6" />
          <path className="o" d="M71 54l4 4-5 3" />
          <rect className="w o" x="62" y="30" width="32" height="32" rx="8" />
          <text className="t-a" x="78" y="52" textAnchor="middle">A</text>
        </g>
      );
    case 'tafseer':
      return (
        <g>
          <rect className="w o" x="30" y="14" width="44" height="54" rx="6" />
          <path className="l" d="M39 27h26M39 35h26M39 43h18M39 51h22" />
          <g className="qa-float">
            <circle className="s o" cx="76" cy="48" r="12" />
            <path className="o thick" d="M85 57l9 9" />
          </g>
        </g>
      );
    case 'dua':
      return (
        <g>
          <path className="a qa-float" d="M63 12a11 11 0 1 0 8 18 9 9 0 1 1-8-18z" />
          <path className="a qa-twinkle" d="M82 16l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" />
          {[false, true].map(flip => (
            <g key={String(flip)} transform={flip ? 'translate(120 0) scale(-1 1)' : undefined}>
              <g transform="rotate(-16 46 68)">
                <rect className="s o" x="50" y="46" width="8" height="16" rx="4" transform="rotate(28 54 54)" />
                <rect className="s o" x="36" y="30" width="20" height="36" rx="10" />
                <path className="l" d="M41.5 33v11M46 31.5v12.5M50.5 33v11" />
              </g>
              <rect className="a" x="34" y="64" width="20" height="8" rx="3" transform="rotate(-16 44 68)" />
            </g>
          ))}
        </g>
      );
    case 'tra':
      return (
        <g>
          <path className="w o" d="M30 18h48a7 7 0 0 1 7 7v22a7 7 0 0 1-7 7H48l-10 9v-9h-8a7 7 0 0 1-7-7V25a7 7 0 0 1 7-7z" />
          {[0, 1, 2, 3, 4].map(i => (
            <rect key={i} className="a qa-bar" style={{ animationDelay: `${i * 0.12}s` }} x={36 + i * 8} y={36 - [4, 8, 11, 7, 4][i]} width="4" height={[4, 8, 11, 7, 4][i] * 2} rx="2" />
          ))}
          <rect className="s" x="78" y="44" width="24" height="18" rx="6" />
          <text className="t-s" x="90" y="57" textAnchor="middle">Aa</text>
        </g>
      );
    case 'namaz':
      return (
        <g>
          <rect className="w o" x="30" y="16" width="60" height="50" rx="8" />
          <path className="a" d="M30 24a8 8 0 0 1 8-8h44a8 8 0 0 1 8 8v6H30z" />
          {[0, 1, 2, 3, 4].map(i => (
            <circle key={i} className={i < 4 ? 'a' : 's'} cx={40 + i * 10} cy="46" r="3.6" />
          ))}
          <path className="l" d="M38 57h28" />
        </g>
      );
    case 'tasbih':
      return (
        <g>
          {BEADS.map((b, i) => (
            <circle key={i} className={b.on ? 'a' : 's o-thin'} cx={b.x} cy={b.y} r="3.4" />
          ))}
          <path className="o" d="M50 57v8" />
          <rect className="a" x="47" y="64" width="6" height="9" rx="2" />
          <g className="qa-sway">
            <path className="o" d="M86 70V52" />
            {[0, 72, 144, 216, 288].map(r => (
              <ellipse key={r} className="s o-thin" cx="86" cy="38" rx="5" ry="9" transform={`rotate(${r} 86 46)`} />
            ))}
            <circle className="a" cx="86" cy="46" r="4" />
          </g>
        </g>
      );
    case 'qibla':
      return (
        <g>
          <circle className="w o" cx="60" cy="40" r="27" />
          <circle className="s" cx="60" cy="40" r="19" />
          <rect className="k" x="53" y="33" width="14" height="14" rx="1.5" />
          <rect className="a" x="53" y="37" width="14" height="2.6" />
          <g className="qa-needle">
            <path className="a" d="M60 7l5 8h-10z" />
          </g>
        </g>
      );
    case 'mosques':
      return (
        <g>
          <rect className="a" x="26" y="30" width="6" height="38" rx="2" />
          <path className="a" d="M26 30l3-7 3 7z" />
          <rect className="a" x="88" y="30" width="6" height="38" rx="2" />
          <path className="a" d="M88 30l3-7 3 7z" />
          <path className="s o" d="M40 54c0-13 9-21 20-23 11 2 20 10 20 23z" />
          <circle className="a" cx="60" cy="27" r="2.6" />
          <rect className="w o" x="36" y="54" width="48" height="14" rx="2" />
          <path className="a" d="M55 68v-6a5 5 0 0 1 10 0v6z" />
          <g className="qa-bob">
            <path className="a" d="M103 8a8 8 0 0 1 8 8c0 6-8 14-8 14s-8-8-8-14a8 8 0 0 1 8-8z" />
            <circle className="w" cx="103" cy="16" r="3" />
          </g>
        </g>
      );
    case 'quiz':
      return (
        <g>
          <rect className="w o" x="28" y="14" width="60" height="52" rx="8" />
          <path className="l" d="M38 26h30" />
          <rect className="s" x="38" y="34" width="40" height="9" rx="4.5" />
          <rect className="a" x="38" y="48" width="40" height="9" rx="4.5" />
          <g className="qa-pop">
            <circle className="a" cx="90" cy="60" r="10" />
            <path className="x" d="M85 60l3.5 3.5 6.5-7" />
          </g>
        </g>
      );
  }
}

function TileInner({ t }: { t: Tile }) {
  return (
    <>
      <span className="qg-art" aria-hidden="true">
        <svg viewBox="20 4 92 72" focusable="false">
          <Art k={t.key} />
        </svg>
      </span>
      <span className="qg-text">
        <b>
          {t.label}
          {t.badge && (
            <span className="qg-badge" title={t.badge}>
              <span className="qg-live" />
              <span className="qg-badge-txt">{t.badge}</span>
            </span>
          )}
        </b>
        <span className={t.short ? 'qg-sub-full' : undefined}>{t.sub}</span>
        {t.short && <span className="qg-sub-short">{t.short}</span>}
      </span>
      <span className="qg-arrow material-symbols-outlined" aria-hidden="true">
        arrow_forward
      </span>
    </>
  );
}

export default function QuickAccessGrid({ onNavigate }: { onNavigate: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className={`qg${inView ? ' qg-in' : ''}`} aria-labelledby="qg-title">
      <div className="qg-header">
        <div>
          <p className="qg-kicker font-arabic">وصول سريع</p>
          <h2 id="qg-title">Quick Access</h2>
        </div>
        <p className="qg-hint">Jump straight into any part of your Quran journey</p>
      </div>

      <div className="qg-grid">
        {TILES.map((t, i) => {
          const common = {
            className: `qg-tile${t.wide ? ' qg-wide' : ''}`,
            style: { ['--from' as string]: t.from, ['--to' as string]: t.to, ['--i' as string]: i },
            'aria-label': `${t.label}: ${t.sub}`,
          };
          return t.action === 'navigate' ? (
            <button key={t.key} type="button" {...common} onClick={onNavigate}>
              <TileInner t={t} />
            </button>
          ) : (
            <Link key={t.key} href={t.href!} {...common}>
              <TileInner t={t} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
