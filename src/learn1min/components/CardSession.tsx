'use client';
/** Flip-card session over vocabulary items. Grades feed the spaced-repetition schedule. */
import { useEffect, useState } from 'react';
import { VOCAB_BY_ID } from '../content/vocabulary';
import { refOf } from '../lib/items';
import { GRADE_LABEL, newCard, preview, type Grade } from '../lib/srs';
import { useLearn } from '../store/LearnProvider';
import { ExampleAyah, WordFacts } from './cards';
import { IconArrow, IconCheck, IconFlip, IconRepeat } from './Icons';
import { AudioButton } from './ui';
import s from '../learn.module.css';

export type CardMode = 'ar-en' | 'en-ar';

export default function CardSession({
  itemIds, mode, grading, onClose, title,
}: { itemIds: string[]; mode: CardMode; grading: 'binary' | 'srs'; onClose: () => void; title: string }) {
  const { data, dispatch, clock } = useLearn();
  const today = clock!.today;
  const [queue] = useState(itemIds);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tally, setTally] = useState({ again: 0, ok: 0 });
  const id = queue[i];
  const w = id ? VOCAB_BY_ID[refOf(id)] : undefined;
  const card = id ? data.cards[id] ?? newCard(today) : undefined;
  const intervals = card ? preview(card, today) : [];
  const finished = i >= queue.length;

  const grade = (g: Grade) => {
    if (!id) return;
    dispatch({ type: 'grade', itemId: id, grade: g, day: today });
    setTally(t => (g === 0 ? { ...t, again: t.again + 1 } : { ...t, ok: t.ok + 1 }));
    setFlipped(false);
    setI(x => x + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished || e.target instanceof HTMLInputElement) return;
      if (e.key === ' ' || e.key === 'Enter') {
        if (!(e.target instanceof HTMLButtonElement) || !flipped) {
          e.preventDefault();
          setFlipped(f => !f);
        }
      }
      if (!flipped) return;
      if (grading === 'binary') {
        if (e.key === '1') grade(0);
        if (e.key === '2') grade(2);
      } else if (['1', '2', '3', '4'].includes(e.key)) grade((Number(e.key) - 1) as Grade);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!queue.length) return null;

  if (finished) {
    return (
      <div className={s.result}>
        <span className={s.doneBadge} aria-hidden>
          <IconCheck className={s.doneCheck} />
        </span>
        <h2 className={s.resultTitle}>Session complete</h2>
        <p className={s.muted}>
          {tally.ok} remembered · {tally.again} to practise again. Words you missed come back tomorrow.
        </p>
        <button type="button" className={s.btnPrimary} onClick={onClose} autoFocus>
          Done
        </button>
      </div>
    );
  }
  if (!w) return null;

  const front = mode === 'ar-en';
  return (
    <div className={s.runner}>
      <div className={s.runnerTop}>
        <p className={s.label}>{title}</p>
        <p className={s.muted}>
          {i + 1} of {queue.length}
        </p>
      </div>
      <div className={s.steps} aria-hidden>
        {queue.map((q, k) => (
          <span key={q} className={k < i ? s.stepDone : k === i ? s.stepNow : s.step} />
        ))}
      </div>

      <button
        type="button"
        className={`${s.flashcard} ${flipped ? s.flipped : ''}`}
        onClick={() => setFlipped(f => !f)}
        aria-label={flipped ? 'Card answer shown. Activate to show the question again.' : 'Show the answer'}
        aria-live="polite"
      >
        <span className={s.flashInner}>
          <span className={s.flashFace}>
            <span className={s.flashHint}>{front ? 'What does it mean?' : 'Which word is it?'}</span>
            {front ? (
              <span className={s.flashAr} lang="ar" dir="rtl">
                {w.form}
              </span>
            ) : (
              <span className={s.flashEn}>{w.meaning}</span>
            )}
            <span className={s.flashTap}>
              <IconFlip className={s.i16} /> Tap or press Space to flip
            </span>
          </span>
          <span className={`${s.flashFace} ${s.flashBack}`}>
            <span className={s.flashAr} lang="ar" dir="rtl">
              {w.form}
            </span>
            <span className={s.flashTr}>{w.translit}</span>
            <span className={s.flashEn}>{w.meaning}</span>
          </span>
        </span>
      </button>

      {flipped && (
        <div className={s.flashExtra}>
          <div className={s.row}>
            <AudioButton src={w.audio} label="pronunciation" text="Listen" small />
          </div>
          <WordFacts w={w} />
          {w.examples[0] && <ExampleAyah ex={w.examples[0]} />}
        </div>
      )}

      {flipped ? (
        grading === 'binary' ? (
          <div className={s.gradeRow}>
            <button type="button" className={s.gradeAgain} onClick={() => grade(0)}>
              <IconRepeat className={s.i18} /> Needs revision <kbd className={s.kbd}>1</kbd>
            </button>
            <button type="button" className={s.gradeGood} onClick={() => grade(2)}>
              <IconCheck className={s.i18} /> Learned <kbd className={s.kbd}>2</kbd>
            </button>
          </div>
        ) : (
          <div className={s.gradeRow4} role="group" aria-label="How well did you remember?">
            {([0, 1, 2, 3] as Grade[]).map(g => (
              <button key={g} type="button" className={g === 0 ? s.gradeAgain : g === 3 ? s.gradeEasy : g === 2 ? s.gradeGood : s.gradeHard} onClick={() => grade(g)}>
                <span>{GRADE_LABEL[g]}</span>
                <small>
                  {intervals[g]} {intervals[g] === 1 ? 'day' : 'days'} · <kbd className={s.kbd}>{g + 1}</kbd>
                </small>
              </button>
            ))}
          </div>
        )
      ) : (
        <button type="button" className={s.btnPrimaryWide} onClick={() => setFlipped(true)}>
          Show answer <IconArrow className={s.i18} />
        </button>
      )}
    </div>
  );
}
