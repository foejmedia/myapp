'use client';
import { useMemo, useState } from 'react';
import { VOCAB } from '../content/vocabulary';
import { kindOf } from '../lib/items';
import { shuffle } from '../lib/random';
import { isDue, needsPractice } from '../lib/srs';
import { useLearn } from '../store/LearnProvider';
import CardSession, { type CardMode } from './CardSession';
import { IconCards, IconChevron } from './Icons';
import { DeckArt, NewDeckArt } from './Illustrations';
import Overlay from './Overlay';
import { PageHeader, Ready } from './ui';
import s from '../learn.module.css';

type Deck = 'due' | 'learned' | 'practice' | 'saved' | 'new';

function Inner() {
  const { data, clock } = useLearn();
  const today = clock!.today;
  const [mode, setMode] = useState<CardMode>('ar-en');
  const [size, setSize] = useState(10);
  const [session, setSession] = useState<{ ids: string[]; title: string } | null>(null);

  const decks = useMemo(() => {
    const cards = Object.entries(data.cards).filter(([id]) => kindOf(id) === 'v');
    return {
      due: cards.filter(([, c]) => isDue(c, today)).map(([id]) => id),
      learned: cards.map(([id]) => id),
      practice: cards.filter(([, c]) => needsPractice(c)).map(([id]) => id),
      saved: Object.keys(data.saved).filter(id => kindOf(id) === 'v'),
      new: VOCAB.map(w => `v:${w.id}`).filter(id => !data.cards[id]),
    } as Record<Deck, string[]>;
  }, [data.cards, data.saved, today]);

  const DECKS: { id: Deck; title: string; body: string }[] = [
    { id: 'due', title: 'Due for revision', body: 'Words your schedule says to review today.' },
    { id: 'practice', title: 'Needs practice', body: 'Words you have forgotten before.' },
    { id: 'learned', title: 'All learned words', body: 'Everything you have studied so far.' },
    { id: 'saved', title: 'Saved words', body: 'Words you bookmarked in your notebook.' },
    { id: 'new', title: 'Learn new words', body: 'The next most frequent words of the Qur’an.' },
  ];

  const start = (d: Deck) => {
    const ids = d === 'new' ? decks.new.slice(0, size) : shuffle(decks[d], `${d}:${Date.now()}`).slice(0, size);
    setSession({ ids, title: DECKS.find(x => x.id === d)!.title });
  };

  return (
    <>
      <PageHeader
        eyebrow="Module"
        title="Flashcards"
        lead="Flip a card, answer honestly, and mark it. Words marked “needs revision” return tomorrow; learned words return later and later."
      />
      <div className={s.toolbar}>
        <div className={s.segmented} role="group" aria-label="Direction">
          <button type="button" className={mode === 'ar-en' ? s.segOn : s.seg} aria-pressed={mode === 'ar-en'} onClick={() => setMode('ar-en')}>
            Arabic → English
          </button>
          <button type="button" className={mode === 'en-ar' ? s.segOn : s.seg} aria-pressed={mode === 'en-ar'} onClick={() => setMode('en-ar')}>
            English → Arabic
          </button>
        </div>
        <label className={s.selectField}>
          <span>Cards per session</span>
          <select value={size} onChange={e => setSize(Number(e.target.value))}>
            {[5, 10, 20, 30].map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={s.flashLayout}>
      {/* the one featured card: learn new words */}
      {(() => {
        const d = DECKS.find(x => x.id === 'new')!;
        const n = decks.new.length;
        return (
          <article className={`${s.deck} ${s.deckHero}`}>
            <NewDeckArt className={s.deckHeroArt} />
            <div className={s.deckHeroBody}>
              <IconCards className={`${s.i20} ${s.primaryInk} ${s.deckHeroIcon}`} />
              <h2 className={s.cardTitle}>{d.title}</h2>
              <p className={s.muted}>{d.body}</p>
              <p className={s.deckCount}>
                <strong>{n}</strong> {n === 1 ? 'card' : 'cards'}
              </p>
              <button type="button" className={n ? s.btnPrimary : s.btnGhost} disabled={!n} onClick={() => start('new')}>
                {n ? `Study ${Math.min(n, size)}` : 'All words learned'}
              </button>
            </div>
          </article>
        );
      })()}

      {/* your decks: minimal, illustration-led */}
      <section aria-labelledby="l1m-decks" className={s.deckColumn}>
        <h2 id="l1m-decks" className={s.deckSectionH}>
          Your decks
        </h2>
        <ul className={s.deckMinimal}>
          {DECKS.filter(d => d.id !== 'new').map(d => {
            const n = decks[d.id].length;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  className={s.deckRow}
                  disabled={!n}
                  onClick={() => start(d.id)}
                  title={d.body}
                  aria-label={`${d.title}: ${n} ${n === 1 ? 'card' : 'cards'}. ${d.body} ${n ? `Study ${Math.min(n, size)}` : 'Nothing to study yet'}`}
                >
                  <DeckArt kind={d.id as 'due' | 'practice' | 'learned' | 'saved'} className={s.deckRowArt} />
                  <strong className={s.deckRowTitle}>{d.title}</strong>
                  <span className={s.deckRowCount}>{n}</span>
                  <IconChevron className={s.deckRowChev} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      </div>
      {session && (
        <Overlay label={session.title} onClose={() => setSession(null)}>
          <div className={s.lessonCard}>
            <CardSession itemIds={session.ids} mode={mode} grading="binary" title={session.title} onClose={() => setSession(null)} />
          </div>
        </Overlay>
      )}
    </>
  );
}

export default function FlashcardsPage() {
  return (
    <Ready>
      <Inner />
    </Ready>
  );
}
