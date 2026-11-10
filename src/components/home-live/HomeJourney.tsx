'use client';
/**
 * "Keep growing every day" — four illustrated cards that show the visitor's real progress,
 * read from this browser after mount (Learn in 1 Minute and the Garden of Dhikr).
 * Only the small date helpers are imported, so the homepage stays light.
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dayKey, streaks } from '@/learn1min/lib/dates';
import { BookGlowArt, CardsArt, CupArt } from './art';
import s from './homeLive.module.css';

type Live = {
  signedIn: boolean;
  streak: number;
  daysLearned: number;
  learnedToday: boolean;
  dailyScore: { score: number; total: number } | null;
  due: number;
  wordsLearned: number;
};

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

type L1mData = {
  learned?: Record<string, string>;
  activity?: Record<string, number>;
  cards?: Record<string, { due?: string }>;
  quiz?: { daily?: Record<string, { score: number; total: number }> };
};

function readLive(): Live {
  const today = dayKey(new Date());
  const profiles = readJSON<{ current: string | null }>('l1m:profiles');
  const data = profiles?.current ? readJSON<L1mData>(`l1m:data:${profiles.current}`) : null;
  const learned = data?.learned ?? {};
  const activity = data?.activity ?? {};
  const days = new Set([...Object.keys(learned), ...Object.entries(activity).filter(([, n]) => n > 0).map(([k]) => k)]);
  const cards = Object.entries(data?.cards ?? {}).filter(([id]) => id.startsWith('v:'));
  return {
    signedIn: !!data,
    streak: streaks(days, today).current,
    daysLearned: days.size,
    learnedToday: !!learned[today],
    dailyScore: data?.quiz?.daily?.[today] ?? null,
    due: cards.filter(([, c]) => typeof c.due === 'string' && c.due <= today).length,
    wordsLearned: cards.length,
  };
}

export default function HomeJourney() {
  const [live, setLive] = useState<Live | null>(null);
  useEffect(() => {
    setLive(readLive());
    const refresh = () => document.visibilityState === 'visible' && setLive(readLive());
    window.addEventListener('storage', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const hasProgress = !!live && live.signedIn;

  return (
    <section className={s.journey} aria-labelledby="hl-journey">
      <div className={s.head}>
        <div>
          <p className={s.kicker}>One minute a day</p>
          <h2 id="hl-journey" className={s.title}>
            Keep growing every day
          </h2>
        </div>
        {hasProgress && (
          <span className={s.liveTag}>
            <i className={s.liveDot} aria-hidden /> Live from your progress
          </span>
        )}
      </div>

      <div className={s.cards}>
        <Link href={live?.signedIn ? '/learn-1-min?start=lesson' : '/learn-1-min'} className={`${s.card} ${s.peach}`}>
          <BookGlowArt className={s.art} />
          <span className={s.cardBody}>
            <span className={s.cardLabel}>Learn in 1 Minute</span>
            <strong className={s.cardTitle}>{live?.learnedToday ? 'Today’s lesson is done' : 'Today’s lesson is ready'}</strong>
            <span className={s.cardSub}>
              {live?.signedIn
                ? `${live.streak}-day streak · ${live.daysLearned} ${live.daysLearned === 1 ? 'day' : 'days'} learned`
                : 'A Qur’anic word, a dua or a surah — every day'}
            </span>
            <span className={s.cardCta}>{live?.learnedToday ? 'Review it' : 'Start now'} →</span>
          </span>
        </Link>

        <Link href="/learn-1-min/quiz" className={`${s.card} ${s.yellow}`}>
          <CupArt className={s.art} />
          <span className={s.cardBody}>
            <span className={s.cardLabel}>Daily challenge</span>
            <strong className={s.cardTitle}>{live?.dailyScore ? `You scored ${live.dailyScore.score}/${live.dailyScore.total}` : 'Five questions, one minute'}</strong>
            <span className={s.cardSub}>{live?.dailyScore ? 'Come back tomorrow for new questions' : 'Meanings, real ayat and a matching round'}</span>
            <span className={s.cardCta}>{live?.dailyScore ? 'Practise more' : 'Take the challenge'} →</span>
          </span>
        </Link>


        <Link href={live && live.due > 0 ? '/learn-1-min/review' : '/learn-1-min/flashcards'} className={`${s.card} ${s.lavender}`}>
          <CardsArt className={s.art} />
          <span className={s.cardBody}>
            <span className={s.cardLabel}>Flashcards & revision</span>
            <strong className={s.cardTitle}>
              {live && live.due > 0 ? `${live.due} ${live.due === 1 ? 'word' : 'words'} due today` : 'The words of the Qur’an'}
            </strong>
            <span className={s.cardSub}>
              {live && live.wordsLearned > 0 ? `${live.wordsLearned} words in your revision` : 'Flip, remember, and they come back just in time'}
            </span>
            <span className={s.cardCta}>{live && live.due > 0 ? 'Revise now' : 'Start flipping'} →</span>
          </span>
        </Link>
      </div>
    </section>
  );
}
