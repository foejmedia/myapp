'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { byline, langOf, topicOf, type Book, type BooksResponse } from '@/lib/books/catalog';
import { progressList, savedBooks, type Progress } from './store';

export const Icon = ({ name, fill }: { name: string; fill?: boolean }) => (
  <span className="material-symbols-outlined" aria-hidden="true" style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>
);

export const bookHref = (b: Pick<Book, 'id' | 'lang'>) => `/books/${b.id}?lang=${b.lang}`;
export const readHref = (b: Pick<Book, 'id' | 'lang'>) => `/books/${b.id}/read?lang=${b.lang}`;

const hash = (n: number) => { let x = n ^ 0x5bd1e995; x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d); return Math.abs(x ^ (x >>> 12)); };

/** the cover colour: the book's first topic, or a calm hue picked from its id */
export function hueOf(b: Book) {
  const t = b.topics[0] ? topicOf(b.topics[0]) : null;
  return t ? t.hue : [158, 38, 205, 175, 20, 265, 330, 190][hash(b.id) % 8];
}

/**
 * A book cover. IslamHouse's own cover when it has one; otherwise a generated cover —
 * geometric star pattern, gold frame, title and author — so every book looks like a book.
 */
export function Cover({ book, eager }: { book: Book; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const h = hueOf(book);
  const rtl = langOf(book.lang).rtl;
  const pattern = hash(book.id) % 3;
  return (
    <div className="bk-cover" style={{ ['--h' as string]: h }}>
      {book.cover && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={book.cover} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
      ) : (
        <div className="bk-gen" dir={rtl ? 'rtl' : 'auto'}>
          <svg className="bk-gen-art" viewBox="0 0 100 100" aria-hidden="true">
            {pattern === 0 && <g fill="none" stroke="currentColor" strokeWidth=".8">
              <rect x="29" y="29" width="42" height="42" /><rect x="29" y="29" width="42" height="42" transform="rotate(45 50 50)" />
              <circle cx="50" cy="50" r="13" /><circle cx="50" cy="50" r="33" strokeDasharray="1.5 2.5" />
            </g>}
            {pattern === 1 && <g fill="none" stroke="currentColor" strokeWidth=".8">
              {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx="50" cy="50" rx="34" ry="10" transform={`rotate(${i * 15} 50 50)`} />)}
              <circle cx="50" cy="50" r="6" fill="currentColor" />
            </g>}
            {pattern === 2 && <g fill="none" stroke="currentColor" strokeWidth=".8">
              <path d="M50 14 L60 40 L86 50 L60 60 L50 86 L40 60 L14 50 L40 40 Z" />
              <path d="M50 26 L57 43 L74 50 L57 57 L50 74 L43 57 L26 50 L43 43 Z" />
              <path d="M30 30 L70 70 M70 30 L30 70" strokeDasharray="2 3" />
            </g>}
          </svg>
          <b className="bk-gen-title">{book.title}</b>
          <span className="bk-gen-by">{byline(book)}</span>
        </div>
      )}
    </div>
  );
}

export function BookCard({ book, progress, wide }: { book: Book; progress?: Progress | null; wide?: boolean }) {
  const pct = progress && progress.pages ? Math.round((progress.page / progress.pages) * 100) : null;
  return (
    <Link href={progress ? readHref(book) : bookHref(book)} className={`bk-card${wide ? ' bk-card--wide' : ''}`} title={book.title}>
      <div className="bk-card-art">
        <Cover book={book} />
        {pct != null && <span className="bk-bar" aria-label={`${pct}% read`}><i style={{ width: `${Math.max(3, pct)}%` }} /></span>}
      </div>
      <b dir="auto">{book.title}</b>
      <small dir="auto">{progress ? `Page ${progress.page} of ${progress.pages}` : byline(book)}</small>
    </Link>
  );
}

export function Shelf({ title, icon, children, action }: { title: string; icon?: string; children: ReactNode; action?: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const x = Math.abs(el.scrollLeft);
    setEdges({ start: x < 8, end: x + el.clientWidth >= el.scrollWidth - 8 });
  }, []);
  useEffect(() => { measure(); }, [measure, children]);
  const move = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85 * (getComputedStyle(el).direction === 'rtl' ? -1 : 1), behavior: 'smooth' });
  };
  return (
    <section className="bk-shelf">
      <header className="bk-shelf-head">
        <h2>{icon && <Icon name={icon} />}{title}</h2>
        {action}
        <span className="bk-shelf-arrows">
          <button type="button" onClick={() => move(-1)} disabled={edges.start} aria-label="Scroll back"><Icon name="chevron_left" /></button>
          <button type="button" onClick={() => move(1)} disabled={edges.end} aria-label="Scroll forward"><Icon name="chevron_right" /></button>
        </span>
      </header>
      <div className="bk-shelf-track" ref={track} onScroll={measure}>{children}</div>
    </section>
  );
}

// ---------- loading ----------

/** seconds since mount — lets a loader say more the longer a request takes */
export function useElapsed(active = true) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!active) { setSecs(0); return; }
    const start = Date.now();
    const t = setInterval(() => setSecs(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(t);
  }, [active]);
  return secs;
}

/** spinner + reassurance that grows with the wait: [message after 0s, after N s, …] */
export function Loader({ steps, compact }: { steps: [number, string, string?][]; compact?: boolean }) {
  const secs = useElapsed();
  const [, title, hint] = [...steps].reverse().find(([at]) => secs >= at) ?? steps[0];
  const slow = secs >= (steps[1]?.[0] ?? Infinity);
  return (
    <div className={`bk-loader${compact ? ' bk-loader--compact' : ''}${slow ? ' is-slow' : ''}`} role="status" aria-live="polite">
      <span className="bk-loader-ring" aria-hidden="true"><Icon name="menu_book" /></span>
      <div className="bk-loader-text">
        <b>{title}</b>
        {hint && <small>{hint}</small>}
        <span className="bk-loader-bar" aria-hidden="true"><i /></span>
      </div>
    </div>
  );
}

// ---------- data hooks ----------

const memo = new Map<string, BooksResponse>();

/** the whole catalogue for one language */
export function useCatalog(lang: string) {
  const [state, setState] = useState<{ data: BooksResponse | null; error: boolean; loading: boolean }>(
    () => ({ data: memo.get(lang) ?? null, error: false, loading: !memo.has(lang) }));
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (memo.has(lang)) { setState({ data: memo.get(lang)!, error: false, loading: false }); return; }
    let live = true;
    setState({ data: null, error: false, loading: true });
    fetch(`/api/books?lang=${lang}`)
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: BooksResponse) => { memo.set(lang, d); if (live) setState({ data: d, error: false, loading: false }); })
      .catch(() => { if (live) setState({ data: null, error: true, loading: false }); });
    return () => { live = false; };
  }, [lang, attempt]);
  return { ...state, retry: () => setAttempt(a => a + 1) };
}

/** the reader's saved books and reading progress, kept in sync across tabs and pages */
export function useLibrary() {
  const [state, setState] = useState<{ saved: Book[]; progress: Progress[] }>({ saved: [], progress: [] });
  useEffect(() => {
    const sync = () => setState({ saved: savedBooks(), progress: progressList() });
    sync();
    window.addEventListener('library-change', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('library-change', sync); window.removeEventListener('storage', sync); };
  }, []);
  return state;
}
