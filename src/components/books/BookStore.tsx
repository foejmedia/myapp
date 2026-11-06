'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { LANGS, RANK, TOPICS, byline, isLang, langOf, readable, searchBooks, topicOf, type Book, type TopicId } from '@/lib/books/catalog';
import { BookCard, Cover, Icon, Loader, Shelf, bookHref, readHref, useCatalog, useLibrary } from './parts';
import { readPrefs, savePrefs } from './store';
import './books.css';

const SHELF = 18;
const PAGE = 36;

const byImportance = (a: Book, z: Book) => RANK[a.importance] - RANK[z.importance] || z.added - a.added;

/** one book a day from the essential list, the same for everyone that day */
function bookOfTheDay(books: Book[]) {
  const pool = books.filter(b => b.importance === 'critical' && readable(b));
  const list = pool.length ? pool : books;
  const day = Math.floor(Date.now() / 86400000);
  return list[day % list.length];
}

function Grid({ books, empty }: { books: Book[]; empty: string }) {
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [books]);
  if (!books.length) return <p className="bk-empty"><Icon name="search_off" />{empty}</p>;
  return (
    <>
      <div className="bk-grid">{books.slice(0, shown).map(b => <BookCard key={b.id} book={b} />)}</div>
      {shown < books.length && (
        <button type="button" className="bk-more" onClick={() => setShown(s => s + PAGE)}>
          Show more <span>({books.length - shown} left)</span>
        </button>
      )}
    </>
  );
}

export default function BookStore() {
  const router = useRouter();
  const pathname = usePathname() ?? '/books';
  const params = new URLSearchParams(useSearchParams()?.toString() ?? '');
  const urlLang = params.get('lang');
  const q = params.get('q') ?? '';
  const topic = (params.get('topic') ?? '') as TopicId | '';
  const view = params.get('view');

  const [lang, setLang] = useState(isLang(urlLang) ? urlLang : 'en');
  // the language remembered from last time, when the link doesn't name one
  useEffect(() => { if (!isLang(urlLang)) setLang(readPrefs().lang); else savePrefs({ lang: urlLang }); }, [urlLang]);

  const [query, setQuery] = useState(q);
  useEffect(() => setQuery(q), [q]);

  const { data, error, loading, retry } = useCatalog(lang);
  const { saved, progress } = useLibrary();
  const books = useMemo(() => data?.books ?? [], [data]);
  const L = langOf(lang);

  const go = (next: Record<string, string | null>, replace = false) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v); else p.delete(k);
    const url = `${pathname}${p.toString() ? `?${p}` : ''}`;
    if (replace) router.replace(url, { scroll: false }); else router.push(url);
  };

  // search as you type, without stacking history entries
  useEffect(() => {
    if (query === q) return;
    const t = setTimeout(() => go({ q: query.trim() || null, topic: null, view: null }, true), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const results = useMemo(() => (q ? searchBooks(books, q) : []), [books, q]);
  const topicBooks = useMemo(() => (topic ? books.filter(b => b.topics.includes(topic)).sort(byImportance) : []), [books, topic]);
  const shelves = useMemo(() => TOPICS.map(t => ({ t, list: books.filter(b => b.topics.includes(t.id)).sort(byImportance) })).filter(s => s.list.length >= 4), [books]);
  const essential = useMemo(() => books.filter(b => b.importance === 'critical' || b.importance === 'high').sort(byImportance).slice(0, SHELF), [books]);
  const featured = useMemo(() => (books.length ? bookOfTheDay(books) : null), [books]);
  const topicCounts = useMemo(() => new Map(TOPICS.map(t => [t.id, books.filter(b => b.topics.includes(t.id)).length])), [books]);

  const home = !q && !topic && view !== 'library';
  const T = topic ? topicOf(topic) : null;

  return (
    <div className="bk">
      <header className="bk-hero">
        <div className="bk-hero-inner">
          <p className="bk-eyebrow"><Icon name="local_library" /> LearnQuran Library</p>
          <h1>Islamic books to read &amp; download — <em>free</em></h1>
          <p className="bk-lede">
            {data ? `${books.length.toLocaleString()} books in ${L.name}` : `Books in ${LANGS.length} languages`} — on belief, the Quran,
            the Prophet ﷺ, prayer, family and more. Read them here or save them to your device.
          </p>

          <form className="bk-search" role="search" onSubmit={e => { e.preventDefault(); go({ q: query.trim() || null, topic: null, view: null }); }}>
            <Icon name="search" />
            <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${data ? books.length.toLocaleString() : ''} books by title or author`}
              aria-label="Search books" dir="auto" />
            {query && <button type="button" onClick={() => { setQuery(''); go({ q: null }, true); }} aria-label="Clear search"><Icon name="close" /></button>}
          </form>

          <div className="bk-langs" role="group" aria-label="Book language">
            {LANGS.map(l => (
              <button key={l.code} type="button" className={l.code === lang ? 'is-on' : ''} aria-pressed={l.code === lang}
                onClick={() => { setLang(l.code); savePrefs({ lang: l.code }); go({ lang: l.code, q: null, topic: null }, true); setQuery(''); }}>
                <span lang={l.code}>{l.native}</span>{l.native !== l.name && <small>{l.name}</small>}
              </button>
            ))}
          </div>
        </div>
      </header>

      <nav className="bk-topics" aria-label="Topics">
        <button type="button" className={home ? 'is-on' : ''} onClick={() => go({ topic: null, q: null, view: null })}><Icon name="home" />Discover</button>
        <button type="button" className={view === 'library' ? 'is-on' : ''} onClick={() => go({ view: 'library', topic: null, q: null })}>
          <Icon name="bookmarks" />My library{saved.length + progress.length ? <b>{new Set([...saved, ...progress.map(p => p.book)].map(b => `${b.lang}:${b.id}`)).size}</b> : null}
        </button>
        {TOPICS.filter(t => !data || (topicCounts.get(t.id) ?? 0) > 0).map(t => (
          <button key={t.id} type="button" className={topic === t.id ? 'is-on' : ''} style={{ ['--h' as string]: t.hue }}
            onClick={() => go({ topic: t.id, q: null, view: null })}><Icon name={t.icon} />{t.title}</button>
        ))}
      </nav>

      <main className="bk-main">
        {view === 'library' ? (
          <>
            <h2 className="bk-title"><Icon name="bookmarks" /> My library</h2>
            {progress.length > 0 && <Shelf title="Continue reading" icon="auto_stories">{progress.map(p => <BookCard key={`${p.book.lang}:${p.book.id}`} book={p.book} progress={p} />)}</Shelf>}
            <h3 className="bk-sub">Saved books</h3>
            <Grid books={saved} empty="Books you save appear here. Open any book and press “Save to library”." />
          </>
        ) : loading ? (
          <div className="bk-skel" aria-busy="true" aria-label="Loading books">
            <Loader steps={[
              [0, 'Loading books…'],
              [3, 'Gathering the library…', 'The first visit in a language collects every book — this can take a few seconds.'],
              [10, 'Still working — almost there', 'Hundreds of books are being fetched. Later visits open instantly.'],
              [25, 'The library server is slow right now', 'Hang on a little longer, or try another language.'],
            ]} />
            {Array.from({ length: 3 }, (_, i) => <div key={i} className="bk-skel-row">{Array.from({ length: 7 }, (_, j) => <span key={j} />)}</div>)}
          </div>
        ) : error || !data ? (
          <div className="bk-error">
            <Icon name="cloud_off" />
            <h2>The library couldn’t be reached</h2>
            <p>Please check your connection and try again.</p>
            <button type="button" className="bk-btn bk-btn--primary" onClick={retry}><Icon name="refresh" />Try again</button>
          </div>
        ) : q ? (
          <>
            <h2 className="bk-title"><Icon name="search" /> {results.length} {results.length === 1 ? 'book' : 'books'} for “{q}”</h2>
            <Grid books={results} empty={`No ${L.name} books match “${q}”. Try another word, or another language.`} />
          </>
        ) : T ? (
          <>
            <h2 className="bk-title" style={{ ['--h' as string]: T.hue }}><Icon name={T.icon} /> {T.title} <span>{topicBooks.length} books</span></h2>
            <Grid books={topicBooks} empty="No books in this topic yet for this language." />
          </>
        ) : (
          <>
            {featured && (
              <section className="bk-feature" style={{ ['--h' as string]: featured.topics[0] ? topicOf(featured.topics[0])!.hue : 158 }}>
                <Link href={bookHref(featured)} className="bk-feature-cover" aria-label={featured.title}><Cover book={featured} eager /></Link>
                <div className="bk-feature-text">
                  <p className="bk-eyebrow"><Icon name="auto_awesome" /> Book of the day</p>
                  <h2 dir="auto">{featured.title}</h2>
                  <p className="bk-feature-by" dir="auto">{byline(featured)}</p>
                  {featured.description && <p className="bk-feature-desc" dir="auto">{featured.description}</p>}
                  <div className="bk-actions">
                    {readable(featured) && <Link href={readHref(featured)} className="bk-btn bk-btn--primary"><Icon name="auto_stories" />Read now</Link>}
                    <Link href={bookHref(featured)} className="bk-btn"><Icon name="info" />Details</Link>
                  </div>
                </div>
              </section>
            )}

            {progress.length > 0 && (
              <Shelf title="Continue reading" icon="auto_stories">
                {progress.map(p => <BookCard key={`${p.book.lang}:${p.book.id}`} book={p.book} progress={p} />)}
              </Shelf>
            )}
            {saved.length > 0 && (
              <Shelf title="My library" icon="bookmarks" action={<button type="button" className="bk-link" onClick={() => go({ view: 'library' })}>See all</button>}>
                {saved.map(b => <BookCard key={`${b.lang}:${b.id}`} book={b} />)}
              </Shelf>
            )}
            {essential.length > 0 && <Shelf title="Essential reading" icon="star">{essential.map(b => <BookCard key={b.id} book={b} />)}</Shelf>}
            <Shelf title="New arrivals" icon="new_releases">{books.slice(0, SHELF).map(b => <BookCard key={b.id} book={b} />)}</Shelf>
            {shelves.map(({ t, list }) => (
              <Shelf key={t.id} title={t.title} icon={t.icon}
                action={list.length > SHELF ? <button type="button" className="bk-link" onClick={() => go({ topic: t.id })}>See all {list.length}</button> : null}>
                {list.slice(0, SHELF).map(b => <BookCard key={b.id} book={b} />)}
              </Shelf>
            ))}

            <h2 className="bk-title"><Icon name="library_books" /> All {L.name} books <span>{books.length}</span></h2>
            <Grid books={books} empty="No books yet." />
          </>
        )}

        <footer className="bk-foot">
          <Icon name="info" />
          <p>
            Books are published by <a href="https://islamhouse.com" target="_blank" rel="noopener noreferrer">IslamHouse.com</a>, a free
            Islamic library whose books may be read, downloaded and shared at no cost. Each book reflects its author’s views.
            {data?.stale && ' Showing a saved copy of the catalogue — the library is not reachable right now.'}
          </p>
        </footer>
      </main>
    </div>
  );
}
