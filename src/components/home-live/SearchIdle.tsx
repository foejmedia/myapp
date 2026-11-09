'use client';
/** Shown under "Search Quran" before a query: an illustration and topic chips that fill the search box. */
import { SearchBookArt } from './art';
import s from './homeLive.module.css';

const TOPICS = ['patience', 'mercy', 'gratitude', 'forgiveness', 'prayer', 'parents', 'knowledge', 'paradise'];

export default function SearchIdle({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className={s.searchIdle}>
      <SearchBookArt className={s.searchArt} />
      <div className={s.searchIdleBody}>
        <p className={s.searchIdleTitle}>What would you like to explore?</p>
        <p className={s.searchIdleSub}>Tap a topic to search the translation of the whole Qur’an.</p>
        <div className={s.topics} role="group" aria-label="Suggested topics">
          {TOPICS.map(t => (
            <button key={t} type="button" className={s.topic} onClick={() => onPick(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
