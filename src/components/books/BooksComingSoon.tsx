import Link from 'next/link';
import './BooksComingSoon.css';

interface Props {
  /** small label above the title, e.g. "Library" */
  kicker: string;
  title: string;
  message: string;
  /** where to send people in the meantime */
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}

/** A friendly "coming soon" page with an illustrated bookshelf.  */
export default function BooksComingSoon({ kicker, title, message, primary, secondary }: Props) {
  return (
    <main className="bcs">
      <section className="bcs-card" aria-labelledby="bcs-title">
        <ShelfArt />
        <span className="bcs-pill">
          <span className="bcs-dot" aria-hidden="true" />
          Coming soon
        </span>
        <p className="bcs-kicker">{kicker}</p>
        <h1 id="bcs-title">{title}</h1>
        <p className="bcs-msg">{message}</p>
        {(primary || secondary) && (
          <div className="bcs-actions">
            {primary && (
              <Link href={primary.href} className="bcs-btn primary">
                {primary.label}
                <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
              </Link>
            )}
            {secondary && <Link href={secondary.href} className="bcs-btn">{secondary.label}</Link>}
          </div>
        )}
      </section>
    </main>
  );
}

/** A wooden shelf of books with one book sliding into place, a hanging lantern and a few sparkles. */
function ShelfArt() {
  const books = [
    { x: 52, w: 22, h: 74, c: '#0f7a5c' },
    { x: 76, w: 18, h: 64, c: '#c8963e' },
    { x: 96, w: 26, h: 80, c: '#1e6091' },
    { x: 124, w: 16, h: 58, c: '#9a3b3b' },
    { x: 172, w: 24, h: 70, c: '#6b3d8a' },
    { x: 198, w: 20, h: 78, c: '#13705a' },
  ];
  return (
    <svg className="bcs-art" viewBox="0 0 280 200" aria-hidden="true">
      <defs>
        <radialGradient id="bcs-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bcs-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c98a4b" />
          <stop offset="1" stopColor="#8a5527" />
        </linearGradient>
        <linearGradient id="bcs-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle className="bcs-glow" cx="140" cy="96" r="92" fill="url(#bcs-glow)" />

      {/* hanging lantern */}
      <g className="bcs-lantern">
        <path d="M232 0 V30" stroke="#b07a1e" strokeWidth="2" />
        <path d="M222 34 h20 l-3 -4 h-14 z" fill="#d9a43a" />
        <path d="M223 34 q-4 18 4 30 h10 q8 -12 4 -30 z" fill="#ffd36b" />
        <path d="M232 42 q-5 8 0 16 q5 -8 0 -16 z" fill="#f08a1c" />
        <path d="M222 64 h20 l-3 5 h-14 z" fill="#d9a43a" />
      </g>

      {/* sparkles */}
      <g className="bcs-twinkle" fill="#e0a92e">
        <path d="M40 40 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" />
        <path d="M150 22 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
        <path d="M252 104 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
      </g>

      {/* books standing on the shelf */}
      {books.map(b => (
        <g key={b.x}>
          <rect x={b.x} y={150 - b.h} width={b.w} height={b.h} rx="3" fill={b.c} />
          <rect x={b.x} y={150 - b.h} width={b.w} height={b.h} rx="3" fill="url(#bcs-shine)" />
          <rect x={b.x + 3} y={150 - b.h + 10} width={b.w - 6} height="3" rx="1.5" fill="#f3dfae" opacity="0.8" />
          <rect x={b.x + 3} y={150 - 16} width={b.w - 6} height="3" rx="1.5" fill="#f3dfae" opacity="0.8" />
        </g>
      ))}
      {/* one book leaning */}
      <g transform="rotate(14 160 150)">
        <rect x="146" y="88" width="20" height="62" rx="3" fill="#2f6f6a" />
        <rect x="149" y="98" width="14" height="3" rx="1.5" fill="#f3dfae" opacity="0.8" />
      </g>
      {/* the new book, sliding into the gap */}
      <g className="bcs-new">
        <rect x="226" y="84" width="22" height="66" rx="3" fill="#e0a92e" />
        <rect x="229" y="94" width="16" height="3" rx="1.5" fill="#fff6dc" />
        <path d="M232 112 l5 -6 5 6 -5 6z" fill="#fff6dc" opacity="0.9" />
      </g>

      {/* shelf */}
      <rect x="30" y="150" width="232" height="12" rx="4" fill="url(#bcs-wood)" />
      <rect x="44" y="162" width="8" height="18" rx="2" fill="#8a5527" />
      <rect x="240" y="162" width="8" height="18" rx="2" fill="#8a5527" />
      <ellipse cx="146" cy="190" rx="110" ry="6" fill="#000" opacity="0.06" />
    </svg>
  );
}
