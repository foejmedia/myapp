'use client';
/**
 * Two feature cards for the homepage: the Quran reader (indigo, with a phone showing the surah list)
 * and Learn in 1 Minute (sky blue, with a one-minute lesson card and the visitor's real streak).
 * Carried over from the homepage preview (src/home-v2). The cards size themselves to the space
 * they are given (container queries), so they fit the homepage's 1100px column.
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Flame } from 'lucide-react';
import { dayKey, streaks } from '@/learn1min/lib/dates';
import s from './featureCards.module.css';

const SURAHS = [
  { n: 1, name: 'Al-Fatihah', note: 'The Opening · 7 ayahs' },
  { n: 2, name: 'Al-Baqarah', note: 'The Cow · 286 ayahs' },
  { n: 3, name: 'Aal-Imran', note: 'Family of Imran · 200 ayahs' },
  { n: 4, name: 'An-Nisa', note: 'The Women · 176 ayahs' },
];

/** The visitor's Learn in 1 Minute streak, read from this browser (same source as HomeJourney) */
function readStreak(): number | null {
  try {
    const profiles = JSON.parse(localStorage.getItem('l1m:profiles') ?? 'null') as { current: string | null } | null;
    if (!profiles?.current) return null;
    const data = JSON.parse(localStorage.getItem(`l1m:data:${profiles.current}`) ?? 'null') as {
      learned?: Record<string, string>;
      activity?: Record<string, number>;
    } | null;
    if (!data) return null;
    const days = new Set([
      ...Object.keys(data.learned ?? {}),
      ...Object.entries(data.activity ?? {})
        .filter(([, n]) => n > 0)
        .map(([k]) => k),
    ]);
    return streaks(days, dayKey(new Date())).current;
  } catch {
    return null;
  }
}

export default function FeatureCards() {
  const [streak, setStreak] = useState<number | null>(null);
  useEffect(() => setStreak(readStreak()), []);

  return (
    <section className={s.root} aria-label="Read and learn">
      <div className={s.duo}>
        <article className={`${s.feat} ${s.featRead}`}>
          <span className={s.discA} aria-hidden="true" />
          <svg className={s.crescent} viewBox="0 0 60 60" aria-hidden="true">
            <path d="M38 6a25 25 0 1 0 16 32A20 20 0 0 1 38 6z" />
          </svg>
          <div className={s.featText}>
            <p className={s.chip}>Read</p>
            <h2 className={s.featTitle}>The whole Quran, always open</h2>
            <p className={s.featBody}>
              114 surahs, page by page or word by word. Start with <span className={s.nb}>Al-Fatihah</span>, the seven ayahs that begin every prayer.
            </p>
            <Link href="/read-quran/1" className={`${s.btn} ${s.btnLight}`}>
              Open the Quran
              <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </div>
          <div className={s.featArt} aria-hidden="true">
            <div className={s.phone}>
              <div className={s.phoneBar}>
                <i />
                <b>Surahs</b>
                <i />
              </div>
              <div className={s.bism} />
              <ul className={s.surahs}>
                {SURAHS.map(x => (
                  <li key={x.n}>
                    <i>{x.n}</i>
                    <span>
                      <b>{x.name}</b>
                      <small>{x.note}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>

        <article className={`${s.feat} ${s.featMinute}`}>
          <span className={s.discB} aria-hidden="true" />
          <div className={s.featText}>
            <p className={s.chip}>One minute a day</p>
            <h2 className={s.featTitle}>Learn in 1 minute</h2>
            <p className={s.featBody}>
              The words of the Qur’an, daily duas and surahs in one minute a day, with flashcards, quizzes and revision.
            </p>
            <Link href="/learn-1-min" className={`${s.btn} ${s.btnDark}`}>
              Take one minute
              <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </div>
          <div className={s.featArt} aria-hidden="true">
            <div className={s.lesson}>
              <svg className={s.ring} viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" className={s.ringTrack} />
                <circle cx="60" cy="60" r="50" className={s.ringFill} pathLength="100" />
                <text x="60" y="58" className={s.ringNum}>
                  1:00
                </text>
                <text x="60" y="78" className={s.ringUnit}>
                  minute
                </text>
              </svg>
              <div className={s.tags}>
                <span>Words</span>
                <span>Duas</span>
                <span>Surahs</span>
              </div>
              <div className={s.streak}>
                <Flame size={16} strokeWidth={2.4} />
                {streak && streak > 0 ? `${streak}-day streak` : 'Start your streak today'}
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
