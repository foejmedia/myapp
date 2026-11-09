'use client';
/** Smart revision: what is due, the weekly set, difficulty, mastered words and words needing practice. */
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { VOCAB_BY_ID } from '../content/vocabulary';
import { keyToDate } from '../lib/dates';
import { kindOf, refOf } from '../lib/items';
import { shuffle } from '../lib/random';
import { difficulty, MASTERED_DAYS, type Card } from '../lib/srs';
import { computeStats } from '../lib/stats';
import { useLearn } from '../store/LearnProvider';
import CardSession, { type CardMode } from './CardSession';
import { IconRepeat, IconSpark, IconWord } from './Icons';
import Overlay from './Overlay';
import { EmptyState, PageHeader, Ready } from './ui';
import s from '../learn.module.css';

function WordChips({ ids }: { ids: string[] }) {
  if (!ids.length) return <p className={s.muted}>None yet.</p>;
  return (
    <ul className={s.wordChips}>
      {ids.map(id => {
        const w = VOCAB_BY_ID[refOf(id)];
        return w ? (
          <li key={id}>
            <Link href={`/learn-1-min/vocabulary?word=${w.id}`} className={s.wordChip}>
              <span lang="ar" dir="rtl">{w.form}</span> {w.meaning}
            </Link>
          </li>
        ) : null;
      })}
    </ul>
  );
}

function Inner() {
  const { data, clock } = useLearn();
  const today = clock!.today;
  const stats = useMemo(() => computeStats(data, today), [data, today]);
  const [session, setSession] = useState<{ ids: string[]; title: string } | null>(null);
  const [mode, setMode] = useState<CardMode>('ar-en');
  const vocabCards = Object.entries(data.cards).filter(([id]) => kindOf(id) === 'v') as [string, Card][];
  const diff = { easy: 0, medium: 0, hard: 0 };
  for (const [, c] of vocabCards) diff[difficulty(c)]++;
  const max = Math.max(1, ...stats.forecast.map(f => f.count));

  if (!vocabCards.length) {
    return (
      <>
        <PageHeader eyebrow="Smart learning" title="Revision" />
        <EmptyState
          icon={<IconRepeat className={s.i20} />}
          title="Nothing to revise yet"
          body="Words join your revision schedule as you learn them in daily lessons, flashcards or the vocabulary list."
          action={
            <Link href="/learn-1-min/flashcards" className={s.btnPrimary}>
              Learn your first words
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Smart learning"
        title="Revision"
        lead="Spaced repetition brings each word back just before you are likely to forget it. Good answers push it further away; a slip brings it back tomorrow."
        actions={
          <div className={s.segmented} role="group" aria-label="Direction">
            <button type="button" className={mode === 'ar-en' ? s.segOn : s.seg} aria-pressed={mode === 'ar-en'} onClick={() => setMode('ar-en')}>
              Arabic → English
            </button>
            <button type="button" className={mode === 'en-ar' ? s.segOn : s.seg} aria-pressed={mode === 'en-ar'} onClick={() => setMode('en-ar')}>
              English → Arabic
            </button>
          </div>
        }
      />

      <div className={s.reviewGrid}>
        <section className={`${s.card} ${s.reviewHero}`} aria-labelledby="l1m-daily-rev">
          <p className={s.eyebrowSm}>Daily revision</p>
          <h2 id="l1m-daily-rev" className={s.reviewNum}>
            {stats.due.length} <span>{stats.due.length === 1 ? 'word due' : 'words due'}</span>
          </h2>
          <p className={s.muted}>{stats.due.length ? 'About 10 seconds per word.' : 'You are all caught up for today.'}</p>
          <button
            type="button"
            className={s.btnPrimary}
            disabled={!stats.due.length}
            onClick={() => setSession({ ids: shuffle(stats.due, `due:${today}`).slice(0, 30), title: 'Daily revision' })}
          >
            Start daily revision
          </button>
        </section>

        <section className={s.card} aria-labelledby="l1m-weekly">
          <p className={s.eyebrowSm}>Weekly revision</p>
          <h2 id="l1m-weekly" className={s.reviewNum}>
            {stats.weekly.length} <span>this week</span>
          </h2>
          <p className={s.muted}>Every word you studied in the last seven days, due or not.</p>
          <button
            type="button"
            className={s.btnGhost}
            disabled={!stats.weekly.length}
            onClick={() => setSession({ ids: shuffle(stats.weekly, `week:${today}`).slice(0, 40), title: 'Weekly revision' })}
          >
            Review the week
          </button>
        </section>

        <section className={s.card} aria-labelledby="l1m-forecast">
          <h2 id="l1m-forecast" className={s.cardTitle}>
            Coming up
          </h2>
          <div className={s.forecast}>
            {stats.forecast.map((f, i) => (
              <div key={f.day} className={s.forecastDay}>
                <span className={s.forecastBar} style={{ height: `${(f.count / max) * 100}%` }} aria-hidden />
                <span className={s.forecastNum}>{f.count}</span>
                <span className={s.forecastLabel}>{i === 0 ? 'Today' : keyToDate(f.day).toLocaleDateString(undefined, { weekday: 'short' })}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={s.card} aria-labelledby="l1m-difficulty">
          <h2 id="l1m-difficulty" className={s.cardTitle}>
            Learning difficulty
          </h2>
          <p className={s.muted}>Based on how easily you have remembered each word.</p>
          {(['easy', 'medium', 'hard'] as const).map(k => (
            <div key={k} className={s.diffRow}>
              <span>{k[0].toUpperCase() + k.slice(1)}</span>
              <span className={s.diffTrack}>
                <span className={s[`diff_${k}`]} style={{ width: `${(diff[k] / vocabCards.length) * 100}%` }} />
              </span>
              <span className={s.diffNum}>{diff[k]}</span>
            </div>
          ))}
        </section>

        <section className={s.card} aria-labelledby="l1m-practice">
          <div className={s.cardHead}>
            <h2 id="l1m-practice" className={s.cardTitle}>
              Needs practice <span className={s.countPill}>{stats.practice.length}</span>
            </h2>
            {stats.practice.length > 0 && (
              <button type="button" className={s.btnGhostSm} onClick={() => setSession({ ids: shuffle(stats.practice, `p:${today}`).slice(0, 20), title: 'Needs practice' })}>
                Practise
              </button>
            )}
          </div>
          <WordChips ids={stats.practice} />
        </section>

        <section className={s.card} aria-labelledby="l1m-mastered">
          <div className={s.cardHead}>
            <h2 id="l1m-mastered" className={s.cardTitle}>
              Mastered <span className={s.countPill}>{stats.mastered.length}</span>
            </h2>
            <IconSpark className={`${s.i20} ${s.goldInk}`} />
          </div>
          <p className={s.muted}>Words you remember well enough to see only every {MASTERED_DAYS}+ days.</p>
          <WordChips ids={stats.mastered} />
        </section>
      </div>

      <p className={s.sourceNote}>
        <IconWord className={s.i14} /> {vocabCards.length} words in your schedule.
      </p>

      {session && (
        <Overlay label={session.title} onClose={() => setSession(null)}>
          <div className={s.lessonCard}>
            <CardSession itemIds={session.ids} mode={mode} grading="srs" title={session.title} onClose={() => setSession(null)} />
          </div>
        </Overlay>
      )}
    </>
  );
}

export default function ReviewPage() {
  return (
    <Ready>
      <Inner />
    </Ready>
  );
}
