'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { fileUrl, readable, type BookDetail } from '@/lib/books/catalog';
import { Icon, bookHref, useElapsed } from './parts';
import { progressOf, readPrefs, savePrefs, saveProgress, type Prefs } from './store';
import './books.css';

const ZOOMS = [0.6, 0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2, 2.5];
const PAPERS: { id: Prefs['paper']; label: string; icon: string }[] = [
  { id: 'light', label: 'Day', icon: 'light_mode' },
  { id: 'sepia', label: 'Sepia', icon: 'contrast' },
  { id: 'dark', label: 'Night', icon: 'dark_mode' },
];

let pdfjsReady: Promise<typeof import('pdfjs-dist')> | null = null;
function loadPdfjs() {
  pdfjsReady ??= import('pdfjs-dist').then(m => {
    m.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    return m;
  });
  return pdfjsReady;
}

/** one page: drawn when it comes near the screen, released again when it's far away */
function PdfPage({ doc, n, width, ratio, onRatio, setRef }: {
  doc: PDFDocumentProxy; n: number; width: number; ratio: number;
  onRatio: (n: number, r: number) => void; setRef: (n: number, el: HTMLDivElement | null) => void;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '1400px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    if (!near || !width) { c.width = 0; c.height = 0; setDrawn(false); return; }
    let task: RenderTask | null = null;
    let live = true;
    doc.getPage(n).then(page => {
      if (!live) return;
      const base = page.getViewport({ scale: 1 });
      const r = base.height / base.width;
      if (Math.abs(r - ratio) > 0.002) onRatio(n, r);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vp = page.getViewport({ scale: (width / base.width) * dpr });
      c.width = Math.floor(vp.width);
      c.height = Math.floor(vp.height);
      task = page.render({ canvasContext: c.getContext('2d')!, viewport: vp });
      return task.promise.then(() => { if (live) setDrawn(true); });
    }).catch(() => { /* cancelled or a broken page — the placeholder stays */ });
    return () => { live = false; task?.cancel(); };
  }, [doc, n, width, near, ratio, onRatio]);

  return (
    <div ref={el => { box.current = el; setRef(n, el); }} className={`rd-page${drawn ? ' is-drawn' : ''}`}
      style={{ width, height: Math.round(width * ratio) }} data-page={n} aria-label={`Page ${n}`}>
      <canvas ref={canvas} />
      {!drawn && <span className="rd-page-n">{n}</span>}
    </div>
  );
}

export default function Reader({ id, lang }: { id: number; lang: string }) {
  const [book, setBook] = useState<BookDetail | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<number | null>(null);
  const slowOpen = useElapsed(!doc && !failed) >= 8;
  const [ratios, setRatios] = useState<number[]>([]);
  const [zoom, setZoom] = useState(1);
  const [paper, setPaper] = useState<Prefs['paper']>('light');
  const [page, setPage] = useState(1);
  const [jump, setJump] = useState('1');
  const [avail, setAvail] = useState(0);
  const [chrome, setChrome] = useState(true);

  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const pageEls = useRef(new Map<number, HTMLDivElement>());
  const anchor = useRef<number | null>(null);

  useEffect(() => { setPaper(readPrefs().paper); }, []);

  // the book, then its PDF
  useEffect(() => {
    let live = true;
    let destroy: (() => void) | null = null;
    fetch(`/api/books/${id}?lang=${lang}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(r.status === 404 ? 'This book could not be found.' : 'The library couldn’t be reached.'))))
      .then(async (b: BookDetail) => {
        if (!live) return;
        setBook(b);
        document.title = `${b.title} | LearnQuran Library`;
        const f = readable(b);
        if (!f) throw new Error('This book has no PDF to read here — download it instead.');
        const pdfjs = await loadPdfjs();
        const task = pdfjs.getDocument({ url: fileUrl(f), rangeChunkSize: 524288, disableAutoFetch: true, disableStream: true });
        destroy = () => { task.destroy(); };
        task.onProgress = ({ loaded: l, total }: { loaded: number; total: number }) => { if (live && total) setLoaded(Math.min(99, Math.round((l / total) * 100))); };
        const d = await task.promise;
        if (!live) return;
        const first = (await d.getPage(1)).getViewport({ scale: 1 });
        setRatios(Array(d.numPages).fill(first.height / first.width));
        const saved = progressOf(b);
        anchor.current = saved && saved.page > 1 && saved.page <= d.numPages ? saved.page : null;
        setDoc(d);
      })
      .catch((e: Error) => { if (live) setFailed(e.message || 'This book could not be opened.'); });
    return () => { live = false; destroy?.(); };
  }, [id, lang]);

  // full-screen reading: lock the page behind
  useEffect(() => {
    const els = [document.documentElement, document.body];
    const prev = els.map(el => el.style.overflow);
    els.forEach(el => { el.style.overflow = 'hidden'; });
    return () => els.forEach((el, i) => { el.style.overflow = prev[i]; });
  }, []);

  // page width follows the window
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAvail(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const width = Math.round(Math.min(Math.max(avail - 24, 200), 900) * zoom);

  const onRatio = useCallback((n: number, r: number) => setRatios(rs => (rs[n - 1] === r ? rs : Object.assign([...rs], { [n - 1]: r }))), []);
  const setRef = useCallback((n: number, el: HTMLDivElement | null) => { if (el) pageEls.current.set(n, el); else pageEls.current.delete(n); }, []);

  const goTo = useCallback((n: number, smooth = false) => {
    const el = pageEls.current.get(n);
    if (el && scroller.current) scroller.current.scrollTo({ top: el.offsetTop - 12, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // first layout, and after zooming: keep the reader on the same page
  useLayoutEffect(() => {
    if (!doc || !avail) return;
    const target = anchor.current;
    if (target) { goTo(target); anchor.current = null; }
  }, [doc, avail, width, goTo]);

  // which page is on screen
  useEffect(() => {
    const el = scroller.current;
    if (!el || !doc) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mark = el.scrollTop + el.clientHeight * 0.35;
        let lo = 1, hi = doc.numPages;
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2);
          const p = pageEls.current.get(mid);
          if (p && p.offsetTop <= mark) lo = mid; else hi = mid - 1;
        }
        setPage(lo);
      });
    };
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [doc, width]);

  useEffect(() => setJump(String(page)), [page]);

  // remember the page
  useEffect(() => {
    if (!book || !doc) return;
    const t = setTimeout(() => saveProgress(book, page, doc.numPages), 700);
    return () => clearTimeout(t);
  }, [book, doc, page]);

  const zoomBy = (dir: 1 | -1) => {
    const i = ZOOMS.findIndex(z => z >= zoom - 0.001);
    const next = ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, (i < 0 ? 3 : i) + dir))];
    if (next !== zoom) { anchor.current = page; setZoom(next); }
  };

  // keyboard: arrows / page keys move a page, + and − zoom
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!doc || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (['ArrowRight', 'PageDown'].includes(e.key)) { e.preventDefault(); goTo(Math.min(doc.numPages, page + 1), true); }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goTo(Math.max(1, page - 1), true); }
      else if (e.key === '+' || e.key === '=') zoomBy(1);
      else if (e.key === '-') zoomBy(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else root.current?.requestFullscreen?.().catch(() => {});
  };
  const cyclePaper = () => {
    const next = PAPERS[(PAPERS.findIndex(p => p.id === paper) + 1) % PAPERS.length].id;
    setPaper(next); savePrefs({ paper: next });
  };

  const pdf = book ? readable(book) : null;
  const P = PAPERS.find(p => p.id === paper)!;
  const pages = doc?.numPages ?? 0;

  return (
    <div ref={root} className={`rd rd--${paper}${chrome ? '' : ' rd--bare'}`} role="dialog" aria-modal="true" aria-label={book ? `Reading ${book.title}` : 'Book reader'}>
      <header className="rd-bar">
        <Link href={book ? bookHref(book) : `/books?lang=${lang}`} className="rd-btn" aria-label="Close reader"><Icon name="arrow_back" /></Link>
        <div className="rd-title"><b dir="auto">{book?.title ?? 'Opening book…'}</b>{book && <small dir="auto">{book.authors[0] ?? book.publisher ?? ''}</small>}</div>

        {pages > 0 && (
          <form className="rd-jump" onSubmit={e => { e.preventDefault(); const n = Math.min(pages, Math.max(1, parseInt(jump, 10) || page)); goTo(n); setJump(String(n)); }}>
            <input value={jump} onChange={e => setJump(e.target.value.replace(/\D/g, ''))} inputMode="numeric" aria-label="Page number" onBlur={() => setJump(String(page))} />
            <span>/ {pages}</span>
          </form>
        )}

        <div className="rd-tools">
          <button type="button" className="rd-btn" onClick={() => zoomBy(-1)} disabled={!doc || zoom <= ZOOMS[0]} aria-label="Zoom out"><Icon name="zoom_out" /></button>
          <button type="button" className="rd-zoom" onClick={() => { anchor.current = page; setZoom(1); }} disabled={!doc} aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
          <button type="button" className="rd-btn" onClick={() => zoomBy(1)} disabled={!doc || zoom >= ZOOMS[ZOOMS.length - 1]} aria-label="Zoom in"><Icon name="zoom_in" /></button>
          <button type="button" className="rd-btn" onClick={cyclePaper} aria-label={`Page colour: ${P.label}`} title={`Page colour: ${P.label}`}><Icon name={P.icon} /></button>
          <button type="button" className="rd-btn rd-hide-sm" onClick={fullscreen} aria-label="Full screen"><Icon name="fullscreen" /></button>
          {pdf && book && <a className="rd-btn" href={fileUrl(pdf, true, book.title)} download aria-label="Download PDF" title={`Download PDF (${pdf.size})`}><Icon name="download" /></a>}
        </div>
      </header>

      {pages > 0 && <div className="rd-progress" aria-hidden="true"><i style={{ width: `${(page / pages) * 100}%` }} /></div>}

      <div className="rd-scroll" ref={scroller} onClick={e => { if ((e.target as HTMLElement).closest('.rd-page')) setChrome(c => !c); }}>
        {failed ? (
          <div className="rd-state">
            <Icon name="error" />
            <h2>Couldn’t open this book</h2>
            <p>{failed}</p>
            {pdf && book && <a className="bk-btn bk-btn--primary" href={fileUrl(pdf, true, book.title)} download><Icon name="download" />Download PDF ({pdf.size})</a>}
          </div>
        ) : !doc ? (
          <div className="rd-state" aria-busy="true">
            <span className="rd-spinner" />
            <p>{loaded != null ? `Opening… ${loaded}%` : 'Opening book…'}</p>
            {pdf && <small>{pdf.size} PDF — only the pages you read are loaded</small>}
            {slowOpen && <small className="rd-slow">Taking longer than usual — the connection or the library server may be slow.</small>}
          </div>
        ) : (
          <div className="rd-pages">
            {ratios.map((r, i) => <PdfPage key={i} doc={doc} n={i + 1} width={width} ratio={r} onRatio={onRatio} setRef={setRef} />)}
            <div className="rd-end">
              <Icon name="check_circle" />
              <p>End of book</p>
              {book && <Link href={bookHref(book)} className="bk-btn">Back to book</Link>}
            </div>
          </div>
        )}
      </div>

      {pages > 0 && (
        <nav className="rd-pager" aria-label="Pages">
          <button type="button" onClick={() => goTo(Math.max(1, page - 1), true)} disabled={page <= 1} aria-label="Previous page"><Icon name="keyboard_arrow_up" /></button>
          <span>{page} / {pages}</span>
          <button type="button" onClick={() => goTo(Math.min(pages, page + 1), true)} disabled={page >= pages} aria-label="Next page"><Icon name="keyboard_arrow_down" /></button>
        </nav>
      )}
    </div>
  );
}
