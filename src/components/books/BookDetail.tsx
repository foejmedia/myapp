'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { RANK, byline, fileUrl, langOf, readable, topicOf, type Book, type BookDetail as Detail } from '@/lib/books/catalog';
import { BookCard, Cover, Icon, Loader, Shelf, readHref, useCatalog, useLibrary } from './parts';
import { isSaved, progressOf, toggleSaved, type Progress } from './store';
import './books.css';

const FILE_ICON: Record<string, string> = { PDF: 'picture_as_pdf', DOCX: 'description', DOC: 'description', EPUB: 'menu_book' };

export default function BookDetail({ id, lang }: { id: number; lang: string }) {
  const [book, setBook] = useState<Detail | null>(null);
  const [error, setError] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [copied, setCopied] = useState(false);
  const { data } = useCatalog(lang);
  useLibrary(); // re-render when the shelf changes in another tab

  useEffect(() => {
    let live = true;
    setBook(null); setError(null);
    fetch(`/api/books/${id}?lang=${lang}`)
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((b: Detail) => { if (live) setBook(b); })
      .catch(s => { if (live) setError(typeof s === 'number' ? s : 503); });
    return () => { live = false; };
  }, [id, lang]);

  useEffect(() => {
    if (!book) return;
    setSaved(isSaved(book));
    setProgress(progressOf(book));
    document.title = `${book.title} | LearnQuran Library`;
  }, [book]);

  // the catalogue copy carries the topics; fall back to it while details load
  const listed = useMemo(() => data?.books.find(b => b.id === id) ?? null, [data, id]);
  const b: Book | null = book ?? listed;

  const related = useMemo(() => {
    if (!b || !data) return { author: [], topic: [] };
    const others = data.books.filter(x => x.id !== b.id);
    const author = b.authors.length ? others.filter(x => x.authors.some(a => b.authors.includes(a))).slice(0, 18) : [];
    const shown = new Set(author.map(x => x.id));
    const topic = b.topics.length
      ? others.filter(x => !shown.has(x.id) && x.topics.some(t => b.topics.includes(t)))
        .sort((x, z) => RANK[x.importance] - RANK[z.importance] || z.added - x.added).slice(0, 18)
      : [];
    return { author, topic };
  }, [b, data]);

  const back = `/books?lang=${lang}`;

  if (error && !b) {
    return (
      <div className="bk"><main className="bk-main">
        <div className="bk-error">
          <Icon name={error === 404 ? 'menu_book' : 'cloud_off'} />
          <h2>{error === 404 ? 'Book not found' : 'The library couldn’t be reached'}</h2>
          <p>{error === 404 ? 'This book may have been removed from the library.' : 'Please check your connection and try again.'}</p>
          <Link href={back} className="bk-btn bk-btn--primary"><Icon name="arrow_back" />Back to the library</Link>
        </div>
      </main></div>
    );
  }

  if (!b) {
    return <div className="bk"><main className="bk-main"><Loader compact steps={[[0, 'Loading book…'], [3, 'Fetching book details…', 'The library server is taking a moment.'], [12, 'Still loading — the server is slow', 'Hang on, or go back and try again.']]} /><div className="bk-detail bk-detail--loading" aria-busy="true"><span className="bk-skel-cover" /><div><span /><span /><span /></div></div></main></div>;
  }

  const pdf = readable(b);
  const about = (book?.fullDescription || b.description).trim();
  const L = langOf(b.lang);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: b.title, url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    } catch { /* dismissed */ }
  };

  return (
    <div className="bk">
      <main className="bk-main">
        <nav className="bk-crumbs" aria-label="Breadcrumb">
          <Link href={back}><Icon name="arrow_back" />Library</Link>
          {b.topics[0] && <><span>/</span><Link href={`/books?lang=${lang}&topic=${b.topics[0]}`}>{topicOf(b.topics[0])!.title}</Link></>}
        </nav>

        <article className="bk-detail">
          <div className="bk-detail-cover"><Cover book={b} eager /></div>

          <div className="bk-detail-text">
            <div className="bk-tags">
              <span className="bk-tag"><Icon name="translate" />{L.name}</span>
              {b.importance === 'critical' && <span className="bk-tag bk-tag--gold"><Icon name="star" fill />Essential</span>}
              {b.topics.map(t => (
                <Link key={t} href={`/books?lang=${lang}&topic=${t}`} className="bk-tag" style={{ ['--h' as string]: topicOf(t)!.hue }}>{topicOf(t)!.title}</Link>
              ))}
            </div>
            <h1 dir="auto">{b.title}</h1>
            <dl className="bk-people">
              {b.authors.length > 0 && <div><dt>By</dt><dd dir="auto">{b.authors.join(', ')}</dd></div>}
              {b.translators.length > 0 && <div><dt>Translated by</dt><dd dir="auto">{b.translators.join(', ')}</dd></div>}
              {b.publisher && <div><dt>Publisher</dt><dd dir="auto">{b.publisher}</dd></div>}
              {!b.authors.length && !b.publisher && <div><dt>From</dt><dd>{byline(b)}</dd></div>}
            </dl>

            <div className="bk-actions">
              {pdf && (
                <Link href={readHref(b)} className="bk-btn bk-btn--primary">
                  <Icon name="auto_stories" />{progress ? `Continue · page ${progress.page}` : 'Read now'}
                </Link>
              )}
              {pdf && (
                <a href={fileUrl(pdf, true, b.title)} className="bk-btn" download>
                  <Icon name="download" />Download PDF <small>{pdf.size}</small>
                </a>
              )}
              <button type="button" className={`bk-btn${saved ? ' is-on' : ''}`} aria-pressed={saved} onClick={() => setSaved(toggleSaved(b))}>
                <Icon name={saved ? 'bookmark_added' : 'bookmark_add'} fill={saved} />{saved ? 'In your library' : 'Save to library'}
              </button>
              <button type="button" className="bk-btn bk-btn--icon" onClick={share} aria-label="Share">
                <Icon name={copied ? 'check' : 'ios_share'} />
              </button>
            </div>
            {copied && <p className="bk-toast" role="status">Link copied</p>}

            {progress && progress.pages > 0 && (
              <div className="bk-progress">
                <span><i style={{ width: `${Math.round((progress.page / progress.pages) * 100)}%` }} /></span>
                <small>Page {progress.page} of {progress.pages} · {Math.round((progress.page / progress.pages) * 100)}% read</small>
              </div>
            )}

            {about && (
              <section className="bk-about">
                <h2>About this book</h2>
                <p dir="auto">{about}</p>
              </section>
            )}

            <section className="bk-files">
              <h2>Files</h2>
              <ul>
                {b.files.map(f => (
                  <li key={f.url}>
                    <Icon name={FILE_ICON[f.type] ?? 'draft'} />
                    <span><b dir="auto">{f.label}</b><small>{f.type} · {f.size || 'size unknown'}</small></span>
                    {f.type === 'PDF' && f === pdf && <Link href={readHref(b)} className="bk-link">Read</Link>}
                    <a href={fileUrl(f, true, b.title)} className="bk-link" download><Icon name="download" />Download</a>
                  </li>
                ))}
              </ul>
              {book && book.locales.filter(l => l !== b.lang).length > 0 && (
                <p className="bk-note">Also published in {book.locales.filter(l => l !== b.lang).map(l => langOf(l).name).join(', ')}.</p>
              )}
            </section>
          </div>
        </article>

        {related.author.length > 0 && <Shelf title={`More by ${b.authors[0]}`} icon="person">{related.author.map(x => <BookCard key={x.id} book={x} />)}</Shelf>}
        {related.topic.length > 0 && <Shelf title="You may also like" icon="auto_awesome">{related.topic.map(x => <BookCard key={x.id} book={x} />)}</Shelf>}

        <footer className="bk-foot">
          <Icon name="info" />
          <p>Published by <a href="https://islamhouse.com" target="_blank" rel="noopener noreferrer">IslamHouse.com</a> — free to read, download and share.</p>
        </footer>
      </main>
    </div>
  );
}
