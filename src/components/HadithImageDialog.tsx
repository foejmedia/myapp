'use client';
import { useEffect, useRef, useState } from 'react';
import './HadithImageDialog.css';

// ── 1080 × 1350 share graphic ──
const W = 1080;
const H = 1350;
const PAD = 120;
const FONT = 'Figtree, Arial, sans-serif';
const MAX_SIZE = 88;
/** a single image never goes below this; longer text is split into several images instead */
const SINGLE_MIN = 40;
/** biggest / smallest quote size when the text is split across images */
const MULTI_MAX = 44;
const PAGE_MIN = 34;
/** last resort for very long narrations (only on the final page count) */
const MIN_SIZE = 28;
/** at most this many images per hadith */
const MAX_PAGES = 4;
/** vertical room for the quote between the "HADITH" label and the source lines */
const QUOTE_ROOM = 780;

const THEMES = {
  black: { label: 'Black', bg: '#0b0b0b', text: '#ffffff', muted: 'rgba(255,255,255,0.6)', accent: '#7dd3b0' },
  white: { label: 'White', bg: '#ffffff', text: '#111827', muted: '#6b7280', accent: '#0f5c4a' },
  green: { label: 'Green', bg: '#0f5c4a', text: '#ffffff', muted: 'rgba(255,255,255,0.72)', accent: '#f2d48e' },
} as const;
type ThemeKey = keyof typeof THEMES;

export interface HadithImage {
  text: string;
  narrator?: string;
  /** e.g. "Sahih al-Bukhari 6114" */
  reference: string;
}

const TEXT_W = W - PAD * 2;
type Ctx = CanvasRenderingContext2D & { letterSpacing?: string };

/** Big text is set tighter (leading and tracking); small text lighter and looser so long narrations stay readable */
function setType(ctx: Ctx, size: number) {
  const weight = size >= 40 ? 600 : 500;
  const leading = size >= 64 ? 1.2 : size >= 44 ? 1.28 : 1.42;
  const tracking = size >= 64 ? -1.5 : size >= 44 ? -0.5 : 0;
  ctx.font = `${weight} ${size}px ${FONT}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${tracking}px`;
  return { lh: Math.round(size * leading) };
}

/** Straight quotes and apostrophes → typographic ones */
export function smartQuotes(s: string) {
  return s
    .replace(/(^|[\s([{—–-])"/g, '$1“').replace(/"/g, '”')
    .replace(/(^|[\s([{—–-])'/g, '$1‘').replace(/'/g, '’');
}

function wrap(ctx: Ctx, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Wraps without a stranded last line: narrows the measure (keeping the same number of lines)
 * until the last line is at least ~half as long as the longest, so the rag looks even.
 */
function wrapEven(ctx: Ctx, text: string): string[] {
  const base = wrap(ctx, text, TEXT_W);
  if (base.length < 2) return base;
  const width = (l: string) => ctx.measureText(l).width;
  for (let w = TEXT_W; w >= TEXT_W * 0.72; w -= TEXT_W * 0.02) {
    const lines = wrap(ctx, text, w);
    if (lines.length !== base.length) break;
    if (width(lines[lines.length - 1]) >= 0.5 * Math.max(...lines.map(width))) return lines;
  }
  return base;
}

export interface QuoteLayout {
  size: number;
  lh: number;
  /** lines of the quote, one array per image */
  pages: string[][];
  excerpt: boolean;
  justify: boolean;
}

/** how many lines of a given size fit in the quote room */
const linesPerPage = (size: number, lh: number) => Math.floor((QUOTE_ROOM - size) / lh) + 1;

/**
 * Splits wrapped lines into `n` pages of at most `cap` lines, as evenly as possible,
 * preferring to break after a line that ends a sentence (within ±2 lines of the even split).
 */
function paginate(lines: string[], n: number, cap: number): string[][] {
  const pages: string[][] = [];
  let start = 0;
  for (let k = 1; k < n; k++) {
    const left = n - k + 1; // pages still to fill, including this one
    const target = start + Math.ceil((lines.length - start) / left);
    const ok = (b: number) => b > start && b - start <= cap && lines.length - b <= cap * (left - 1);
    let cut = Math.min(target, start + cap);
    for (const d of [0, -1, 1, -2, 2]) {
      const b = target + d;
      if (ok(b) && /[.!?;:”’]$/.test(lines[b - 1])) { cut = b; break; }
    }
    pages.push(lines.slice(start, cut));
    start = cut;
  }
  pages.push(lines.slice(start));
  return pages.filter(p => p.length);
}

/**
 * Short narrations: one image at the biggest size that fits (never below SINGLE_MIN).
 * Longer ones: split across 2…MAX_PAGES images at a readable size instead of shrinking to
 * unreadable type. Only extremely long narrations still become an excerpt.
 */
export function layoutQuote(ctx: Ctx, text: string): QuoteLayout {
  // the whole narration sits in “…”, so quotes inside it step down to ‘…’
  const quoted = `“${smartQuotes(text.trim().replace(/"/g, "'"))}”`;

  for (let size = MAX_SIZE; size >= SINGLE_MIN; size -= 2) {
    const { lh } = setType(ctx, size);
    const lines = wrapEven(ctx, quoted);
    if (lines.length > linesPerPage(size, lh)) continue;
    return { size, lh, pages: [lines], excerpt: false, justify: false };
  }

  // fewest pages first, then the biggest size that fits that many pages
  for (let n = 2; n <= MAX_PAGES; n++) {
    const minSize = n === MAX_PAGES ? MIN_SIZE : PAGE_MIN;
    for (let size = MULTI_MAX; size >= minSize; size -= 2) {
      const { lh } = setType(ctx, size);
      const lines = wrap(ctx, quoted, TEXT_W);
      const cap = linesPerPage(size, lh);
      if (lines.length > cap * n) continue;
      return { size, lh, pages: paginate(lines, n, cap), excerpt: false, justify: true };
    }
  }

  // still too long: excerpt over MAX_PAGES at the minimum size
  const size = MIN_SIZE;
  const { lh } = setType(ctx, size);
  const cap = linesPerPage(size, lh);
  const lines = wrap(ctx, quoted, TEXT_W).slice(0, cap * MAX_PAGES);
  lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[\s,.;:”’]+$/, '')}…”`;
  return { size, lh, pages: paginate(lines, MAX_PAGES, cap), excerpt: true, justify: true };
}

/**
 * Draws one line stretched to `width` by widening the word gaps. Only a degenerate line
 * (one or two words, or gaps over 4× a space) is left ragged, so a block never breaks mid-way.
 */
function fillJustified(ctx: Ctx, line: string, x: number, y: number, width: number) {
  const words = line.split(' ');
  const space = ctx.measureText(' ').width;
  const wordsW = words.reduce((a, w) => a + ctx.measureText(w).width, 0);
  const gap = words.length > 1 ? (width - wordsW) / (words.length - 1) : 0;
  if (words.length < 3 || gap > space * 4 || gap < 0) {
    ctx.fillText(line, x, y);
    return;
  }
  let cx = x;
  for (const w of words) {
    ctx.fillText(w, cx, y);
    cx += ctx.measureText(w).width + gap;
  }
}

/** Draws image `page` (0-based) of a hadith whose quote was laid out by layoutQuote */
function drawGraphic(canvas: HTMLCanvasElement, h: HadithImage, themeKey: ThemeKey, layout: QuoteLayout, page: number) {
  const ctx: Ctx | null = canvas.getContext('2d');
  if (!ctx) return;
  const t = THEMES[themeKey];
  canvas.width = W;
  canvas.height = H;
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);
  // everything left-aligned on the PAD margin
  const x = PAD;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  const plain = (font: string) => {
    ctx.font = font;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  };

  const { size, lh, pages, excerpt, justify } = layout;
  const total = pages.length;
  const lines = pages[page];
  const isLast = page === total - 1;

  ctx.fillStyle = t.accent;
  plain(`700 30px ${FONT}`);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
  ctx.fillText('HADITH', x, PAD + 40);
  if (total > 1) {
    ctx.textAlign = 'right';
    ctx.fillText(`${page + 1} / ${total}`, W - PAD, PAD + 40);
    ctx.textAlign = 'left';
  }

  const reference = excerpt ? `${h.reference} (excerpt)` : h.reference;
  setType(ctx, size);
  const ascent = ctx.measureText('Hd').actualBoundingBoxAscent || size * 0.72;

  // quote · 56 · rule · 56 · [narrator 32 · 18] · reference 28 as one block between label and footer,
  // sitting a little above true centre (optical centre). On a multi-image hadith the block is sized
  // by the fullest page, so the text starts at the same height on every image.
  const maxLines = Math.max(...pages.map(p => p.length));
  const sourceH = (h.narrator ? 32 + 18 : 0) + 28;
  const block = ascent + (maxLines - 1) * lh + 56 + 4 + 56 + sourceH;
  const top = PAD + 90;
  const bottom = H - PAD - 70;
  let y = top + Math.max((bottom - top - block) * 0.42, 0) + ascent; // first baseline

  // hang the opening quote in the margin so every line starts on the same edge
  const hang = ctx.measureText('“').width;
  ctx.fillStyle = t.text;
  lines.forEach((l, i) => {
    const left = page === 0 && i === 0 && l.startsWith('“') ? x - hang : x;
    // justified lines run to the right margin; only the very last line of the quote stays ragged,
    // as in print (a page break mid-paragraph keeps the line full)
    const lastOfQuote = isLast && i === lines.length - 1;
    if (justify && !lastOfQuote) fillJustified(ctx, l, left, y + i * lh, x + TEXT_W - left);
    else ctx.fillText(l, left, y + i * lh);
  });
  y += (maxLines - 1) * lh + 56;

  ctx.fillStyle = t.accent;
  ctx.fillRect(x, y, 80, 4);
  y += 4 + 56;

  if (h.narrator) {
    y += 32;
    ctx.fillStyle = t.text;
    plain(`600 32px ${FONT}`);
    ctx.fillText(smartQuotes(h.narrator), x, y);
    y += 18;
  }
  y += 28;
  ctx.fillStyle = t.muted;
  plain(`400 28px ${FONT}`);
  ctx.fillText(reference, x, y);

  ctx.fillStyle = t.muted;
  plain(`600 30px ${FONT}`);
  ctx.fillText('Learnquran.app', x, H - PAD + 20);
  if (!isLast) {
    ctx.fillStyle = t.accent;
    ctx.textAlign = 'right';
    ctx.fillText('Continued →', W - PAD, H - PAD + 20);
    ctx.textAlign = 'left';
  }
}

export default function HadithImageDialog({ hadith, onClose }: { hadith: HadithImage | null; onClose: () => void }) {
  const [theme, setTheme] = useState<ThemeKey>('green');
  const [layout, setLayout] = useState<QuoteLayout | null>(null);
  const [page, setPage] = useState(0);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  // lay the quote out once per hadith (after the font loads): decides how many images it needs
  useEffect(() => {
    setLayout(null);
    setPage(0);
    if (!hadith) return;
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([document.fonts.load(`600 60px ${FONT}`), document.fonts.load(`500 30px ${FONT}`)]);
      } catch { /* fall back to Arial */ }
      const ctx: Ctx | null = document.createElement('canvas').getContext('2d');
      if (!cancelled && ctx) setLayout(layoutQuote(ctx, hadith.text));
    })();
    return () => { cancelled = true; };
  }, [hadith]);

  // redraw every image when the layout is ready or a style is picked
  useEffect(() => {
    if (!hadith || !layout) return;
    layout.pages.forEach((_, i) => {
      const c = canvasRefs.current[i];
      if (c) drawGraphic(c, hadith, theme, layout, i);
    });
  }, [hadith, layout, theme]);

  useEffect(() => {
    if (!hadith) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [hadith, onClose]);

  if (!hadith) return null;

  const total = layout?.pages.length ?? 1;
  const base = `hadith-${hadith.reference.split(' · ')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${theme}`;
  const fileName = (i: number) => (total > 1 ? `${base}-${i + 1}of${total}.png` : `${base}.png`);
  const toBlob = (i: number) =>
    new Promise<Blob | null>(res => {
      const c = canvasRefs.current[i];
      if (c) c.toBlob(res, 'image/png');
      else res(null);
    });
  const toFiles = async () => {
    const blobs = await Promise.all(Array.from({ length: total }, (_, i) => toBlob(i)));
    return blobs.flatMap((b, i) => (b ? [new File([b], fileName(i), { type: 'image/png' })] : []));
  };

  const download = async () => {
    const files = await toFiles();
    for (const file of files) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      // browsers drop rapid back-to-back downloads; space them out a little
      if (files.length > 1) await new Promise(r => setTimeout(r, 300));
    }
  };

  const share = async () => {
    if (!layout) return;
    const files = await toFiles();
    if (files.length && navigator.canShare && navigator.canShare({ files })) {
      try {
        await navigator.share({ files, text: `${hadith.reference}\nLearnquran.app` });
        return;
      } catch (e) {
        if ((e as DOMException).name === 'AbortError') return;
      }
    }
    download(); // desktop browsers without file sharing
  };

  return (
    <div className="hid-modal" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="hid-box" role="dialog" aria-modal="true" aria-labelledby="hid-title">
        <div className="hid-head">
          <h3 id="hid-title">Hadith image</h3>
          <button type="button" className="hid-close" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="hid-preview">
          {Array.from({ length: total }, (_, i) => (
            <canvas
              key={`${i}/${total}`}
              ref={el => { canvasRefs.current[i] = el; }}
              className="hid-canvas"
              hidden={i !== page}
              width={W}
              height={H}
              aria-label={total > 1 ? `Preview, image ${i + 1} of ${total}` : `Preview: ${hadith.text}`}
            />
          ))}
          {total > 1 && (
            <>
              <button type="button" className="hid-nav hid-nav--prev" onClick={() => setPage(p => p - 1)} disabled={page === 0} aria-label="Previous image">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button type="button" className="hid-nav hid-nav--next" onClick={() => setPage(p => p + 1)} disabled={page === total - 1} aria-label="Next image">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </>
          )}
        </div>

        {total > 1 && (
          <div className="hid-dots" role="group" aria-label="Images">
            {Array.from({ length: total }, (_, i) => (
              <button key={i} type="button" className={i === page ? 'is-on' : ''} aria-current={i === page} aria-label={`Image ${i + 1} of ${total}`} onClick={() => setPage(i)} />
            ))}
          </div>
        )}

        <div className="hid-styles" role="group" aria-label="Style">
          {(Object.keys(THEMES) as ThemeKey[]).map(k => (
            <button key={k} type="button" aria-pressed={theme === k} className={theme === k ? 'is-on' : ''} onClick={() => setTheme(k)}>
              <i style={{ background: THEMES[k].bg }} aria-hidden="true" />
              {THEMES[k].label}
            </button>
          ))}
        </div>

        <div className="hid-actions">
          <button type="button" className="hid-primary" onClick={share} disabled={!layout}>
            <span className="material-symbols-outlined">ios_share</span>
            {total > 1 ? `Share ${total}` : 'Share'}
          </button>
          <button type="button" className="hid-secondary" onClick={download} disabled={!layout}>
            <span className="material-symbols-outlined">download</span>
            {total > 1 ? `Download ${total}` : 'Download'}
          </button>
        </div>
        <p className="hid-size">
          {total > 1 ? `Long hadith split into ${total} images · ` : ''}1080 × 1350 px · PNG
        </p>
      </div>
    </div>
  );
}
