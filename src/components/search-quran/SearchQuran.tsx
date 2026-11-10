'use client';
/**
 * /search-quran — a minimal, standalone Quran search.
 * Results come from /api/quran-search (alquran.cloud, Saheeh International);
 * the query is kept in the URL (?q=) so searches can be shared and survive a reload.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchBookArt } from '@/components/home-live/art';
import s from './SearchQuran.module.css';

type Match = {
  number: number;
  text: string;
  numberInSurah: number;
  surah: { number: number; name: string; englishName: string };
};

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; matches: Match[]; count: number };

const TOPICS = ['patience', 'mercy', 'gratitude', 'forgiveness', 'prayer', 'parents', 'knowledge', 'paradise'];
const PAGE = 20;
const MIN = 3;

const escapeRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function SearchQuran() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? '/search-quran';
  const [query, setQuery] = useState(() => params?.get('q') ?? '');
  const [state, setState] = useState<State>({ status: 'idle' });
  const [shown, setShown] = useState(PAGE);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim();

  // debounced search + keep ?q= in the URL
  useEffect(() => {
    if (q.length < MIN) {
      setState({ status: 'idle' });
      router.replace(pathname, { scroll: false });
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setState({ status: 'loading' });
      router.replace(`${pathname}?q=${encodeURIComponent(q)}`, { scroll: false });
      try {
        const res = await fetch(`/api/quran-search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const json = await res.json().catch(() => null);
        // alquran.cloud answers 404 when nothing matches
        if (res.status === 404 || (res.ok && !json?.data?.matches)) {
          setState({ status: 'done', matches: [], count: 0 });
        } else if (!res.ok) {
          setState({ status: 'error' });
        } else {
          setState({ status: 'done', matches: json.data.matches, count: json.data.count });
        }
        setShown(PAGE);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setState({ status: 'error' });
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
    // router/pathname are stable; re-run only when the query changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const highlight = useMemo(() => (q.length >= MIN ? new RegExp(`(${escapeRe(q)})`, 'gi') : null), [q]);

  const pick = (t: string) => {
    setQuery(t);
    inputRef.current?.focus();
  };

  return (
    <div className={s.page}>
      <header className={s.head}>
        <p className={s.kicker} lang="ar" dir="rtl">
          ابحث
        </p>
        <h1 className={s.title}>Search the Qur’an</h1>
        <p className={s.lead}>Find any ayah by a word or topic in the Saheeh International English translation.</p>
      </header>

      <form className={s.searchBox} role="search" onSubmit={e => e.preventDefault()}>
        <span className={`material-symbols-outlined ${s.searchIcon}`} aria-hidden>
          search
        </span>
        <input
          ref={inputRef}
          className={s.input}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Try patience, mercy, light…"
          aria-label="Search the Quran"
          autoComplete="off"
          enterKeyHint="search"
        />
        {state.status === 'loading' ? (
          <span className={s.spinner} aria-label="Searching" />
        ) : (
          query && (
            <button type="button" className={s.clear} onClick={() => pick('')} aria-label="Clear search">
              <span className="material-symbols-outlined" aria-hidden>
                close
              </span>
            </button>
          )
        )}
      </form>

      {/* before a query */}
      {q.length < MIN && (
        <section className={s.idle} aria-label="Suggested topics">
          <SearchBookArt className={s.art} />
          <p className={s.idleTitle}>{q.length ? `Type at least ${MIN} letters` : 'What would you like to explore?'}</p>
          <div className={s.topics}>
            {TOPICS.map(t => (
              <button key={t} type="button" className={s.topic} onClick={() => pick(t)}>
                {t}
              </button>
            ))}
          </div>
        </section>
      )}

      {state.status === 'error' && (
        <p className={s.note} role="alert">
          Search is unavailable right now. Please try again in a moment.
        </p>
      )}

      {state.status === 'done' && q.length >= MIN && (
        <section aria-live="polite">
          {state.count === 0 ? (
            <p className={s.note}>
              No ayahs found for “{q}”. Try a different word.
            </p>
          ) : (
            <>
              <p className={s.count}>
                <strong>{state.count.toLocaleString()}</strong> {state.count === 1 ? 'ayah' : 'ayahs'} mention “{q}”
              </p>
              <ol className={s.results}>
                {state.matches.slice(0, shown).map(m => (
                  <li key={m.number}>
                    <Link href={`/read-quran/${m.surah.number}#verse-${m.numberInSurah}`} className={s.result}>
                      <span className={s.ref}>
                        <span className={s.refName}>{m.surah.englishName}</span>
                        <span className={s.refNum}>
                          {m.surah.number}:{m.numberInSurah}
                        </span>
                        <span className={s.refAr} lang="ar" dir="rtl">
                          {m.surah.name}
                        </span>
                      </span>
                      <span className={s.text}>
                        {highlight
                          ? m.text.split(highlight).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))
                          : m.text}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
              {shown < state.matches.length && (
                <div className={s.more}>
                  <button type="button" className={s.moreBtn} onClick={() => setShown(n => n + PAGE)}>
                    Show more
                  </button>
                  <span className={s.moreNote}>
                    {Math.min(shown, state.matches.length)} of {state.matches.length.toLocaleString()}
                  </span>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <p className={s.source}>Translation: Saheeh International · via alquran.cloud</p>
    </div>
  );
}
