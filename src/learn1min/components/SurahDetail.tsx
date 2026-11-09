'use client';
/**
 * One surah, loaded from the site's verified Quran content API (/api/quiz/content → Quran.com v4,
 * validated ayah by ayah). Nothing here composes Qur'anic text.
 */
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Content, Surah } from '@/lib/quiz/content';
import { ayahAudio, chapter } from '../content/chapters';
import { bareArabic } from '../lib/quiz';
import { useLearn } from '../store/LearnProvider';
import { IconCheck, IconChevronLeft, IconPause, IconPlay, IconRepeat } from './Icons';
import { AudioButton, EmptyState, NoteEditor, Progress, Ready, SaveButton, Skeleton, stopAudio } from './ui';
import s from '../learn.module.css';

type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; surah: Surah; source: string };

function useSurah(n: number) {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoad({ state: 'loading' });
    const get = (cache: RequestCache) =>
      fetch(`/api/quiz/content?surahs=${n}&lang=en`, { cache }).then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? 'The Quran text could not be loaded.');
        return r.json() as Promise<Content>;
      });
    // Only ever show the surah that was asked for. A stale browser-cached response can
    // carry another surah, so on a mismatch refetch past the cache before giving up.
    const pick = (c: Content) => c.surahs?.find(x => x.id === n);
    get('default')
      .then(async c => (pick(c) ? c : get('reload')))
      .then(c => {
        const surah = pick(c);
        if (!surah || surah.verses.length !== chapter(n)?.versesCount) throw new Error('The Quran text could not be loaded.');
        if (alive) setLoad({ state: 'ready', surah, source: c.translationSource });
      })
      .catch(e => alive && setLoad({ state: 'error', message: e instanceof Error ? e.message : 'The Quran text could not be loaded.' }));
    return () => {
      alive = false;
    };
  }, [n, attempt]);
  return { load, retry: () => setAttempt(a => a + 1) };
}

/** Sequential recitation of the whole surah (or from a chosen ayah). */
function usePlayAll(surah: Surah | null) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const stop = useCallback(() => {
    audio.current?.pause();
    setCurrent(null);
  }, []);
  const playFrom = useCallback(
    (ayah: number) => {
      if (!surah) return;
      stopAudio();
      audio.current ??= new Audio();
      const a = audio.current;
      const play = (n: number) => {
        if (n > surah.verses.length) return setCurrent(null);
        setCurrent(n);
        a.src = ayahAudio(`${surah.id}:${n}`);
        a.onended = () => play(n + 1);
        a.play().catch(() => setCurrent(null));
        document.getElementById(`ayah-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      play(ayah);
    },
    [surah],
  );
  useEffect(() => () => audio.current?.pause(), []);
  return { current, playFrom, stop };
}

function Inner({ n }: { n: number }) {
  const { data, dispatch, clock } = useLearn();
  const info = chapter(n)!;
  const { load, retry } = useSurah(n);
  const surah = load.state === 'ready' ? load.surah : null;
  const { current, playFrom, stop } = usePlayAll(surah);
  const [wbw, setWbw] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const learned = new Set(data.ayat[String(n)] ?? []);
  const known = !!data.known[`s:${n}`];

  const breakdown = useMemo(() => {
    if (!surah) return [];
    const counts = new Map<string, { ar: string; meaning: string | null; count: number; first: string }>();
    for (const v of surah.verses) {
      v.words.forEach(w => {
        const k = bareArabic(w.ar);
        const e = counts.get(k);
        if (e) e.count++;
        else counts.set(k, { ar: w.ar, meaning: w.meaning, count: 1, first: v.key });
      });
    }
    return [...counts.values()].filter(x => x.meaning).sort((a, b) => b.count - a.count).slice(0, 12);
  }, [surah]);

  return (
    <>
      <Link href="/learn-1-min/surahs" className={s.backLink}>
        <IconChevronLeft className={s.i16} /> All surahs
      </Link>
      <header className={s.surahHero}>
        <div>
          <p className={s.eyebrow}>Surah {n}</p>
          <h1 className={s.pageTitle}>{info.nameSimple}</h1>
          <p className={s.lead}>
            “{info.meaning}” · {info.versesCount} ayat
          </p>
        </div>
        <p className={s.surahHeroAr} lang="ar" dir="rtl">
          {info.nameArabic}
        </p>
      </header>

      <section className={s.card} aria-label="Your progress in this surah">
        <div className={s.rowBetween}>
          <p>
            <strong>
              {learned.size} of {info.versesCount}
            </strong>{' '}
            ayat learned
          </p>
          <div className={s.row}>
            <SaveButton itemId={`s:${n}`} withText />
            <button
              type="button"
              className={known ? s.btnKnown : s.btnGhost}
              aria-pressed={known}
              onClick={() => dispatch({ type: 'setKnown', itemId: `s:${n}`, known: !known, day: clock!.today })}
            >
              <IconCheck className={s.i16} /> {known ? 'Surah learned' : 'Mark surah as learned'}
            </button>
          </div>
        </div>
        <Progress value={learned.size / info.versesCount} label={`${learned.size} of ${info.versesCount} ayat learned`} />
        <div className={s.row}>
          <NoteEditor itemId={`s:${n}`} compact />
        </div>
      </section>

      {load.state === 'loading' && (
        <div className={s.loadingStack} aria-busy="true" aria-label="Loading the surah">
          {[0, 1, 2].map(i => (
            <div key={i} className={s.card}>
              <Skeleton h={30} w="80%" />
              <Skeleton h={14} w="95%" />
              <Skeleton h={14} w="60%" />
            </div>
          ))}
        </div>
      )}

      {load.state === 'error' && (
        <EmptyState
          title="The surah could not be loaded"
          body={`${load.message} The text is never shown unless it loads complete and checked.`}
          action={
            <button type="button" className={s.btnPrimary} onClick={retry}>
              <IconRepeat className={s.i18} /> Try again
            </button>
          }
        />
      )}

      {surah && (
        <div className={s.surahLayout}>
          <div>
            <div className={s.toolbarSticky}>
              <button type="button" className={current ? s.btnKnown : s.btnPrimary} onClick={() => (current ? stop() : playFrom(1))}>
                {current ? <IconPause className={s.i18} /> : <IconPlay className={s.i18} />}
                {current ? `Stop (ayah ${current})` : 'Play the whole surah'}
              </button>
              <label className={s.switch}>
                <input type="checkbox" checked={wbw} onChange={e => setWbw(e.target.checked)} />
                <span>Word by word</span>
              </label>
            </div>
            <ol className={s.ayahList}>
              {surah.verses.map(v => {
                const isLearned = learned.has(v.ayah);
                const showWords = wbw || open === v.ayah;
                return (
                  <li key={v.key} id={`ayah-${v.ayah}`} className={`${s.ayahItem} ${current === v.ayah ? s.ayahPlaying : ''} ${isLearned ? s.ayahLearned : ''}`}>
                    <div className={s.ayahHead}>
                      <span className={s.ayahNum}>{v.ayah}</span>
                      <div className={s.row}>
                        <AudioButton src={ayahAudio(v.key)} label={`recitation of ayah ${v.ayah}`} small />
                        <button type="button" className={s.iconBtnSm} onClick={() => playFrom(v.ayah)} aria-label={`Play from ayah ${v.ayah} to the end`} title="Play from here">
                          <IconPlay className={s.i14} />
                        </button>
                        {!wbw && (
                          <button type="button" className={s.linkBtn} aria-expanded={open === v.ayah} onClick={() => setOpen(open === v.ayah ? null : v.ayah)}>
                            Words
                          </button>
                        )}
                        <button
                          type="button"
                          className={isLearned ? s.btnKnownSm : s.btnGhostSm}
                          aria-pressed={isLearned}
                          onClick={() => dispatch({ type: 'toggleAyah', surah: n, ayah: v.ayah, day: clock!.today })}
                        >
                          <IconCheck className={s.i14} /> {isLearned ? 'Learned' : 'Mark learned'}
                        </button>
                      </div>
                    </div>
                    <p className={s.quranText} lang="ar" dir="rtl">
                      {v.ar}
                    </p>
                    {showWords && (
                      <ul className={s.wbw} dir="rtl" aria-label="Word by word">
                        {v.words.map((w, i) => (
                          <li key={i}>
                            <span lang="ar" className={s.wbwAr}>
                              {w.ar}
                            </span>
                            <span dir="ltr" className={s.wbwEn}>
                              {w.meaning ?? '—'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className={s.ayahTr}>{v.translation}</p>
                  </li>
                );
              })}
            </ol>
          </div>
          <aside className={s.surahSide}>
            <section className={s.card} aria-labelledby="l1m-breakdown">
              <h2 id="l1m-breakdown" className={s.cardTitle}>
                Vocabulary breakdown
              </h2>
              <p className={s.muted}>The words repeated most in this surah.</p>
              <ul className={s.breakdown}>
                {breakdown.map(b => (
                  <li key={b.ar + b.first}>
                    <span lang="ar" dir="rtl" className={s.breakAr}>
                      {b.ar}
                    </span>
                    <span className={s.breakEn}>{b.meaning}</span>
                    <span className={s.breakCount}>×{b.count}</span>
                  </li>
                ))}
              </ul>
            </section>
            <p className={s.sourceNote}>
              Text: Quran.com (Uthmani Hafs, King Fahd Complex). Translation: {load.state === 'ready' ? load.source : ''}. Recitation: Mishary Rashid
              Alafasy.
            </p>
          </aside>
        </div>
      )}
    </>
  );
}

export default function SurahDetail({ n }: { n: number }) {
  return (
    <Ready>
      <Inner n={n} />
    </Ready>
  );
}
