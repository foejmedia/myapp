'use client';
/** Runs a list of questions with a progress bar, then shows the score and what to revise. */
import { useRef, useState } from 'react';
import { describe } from '../lib/items';
import type { Question } from '../lib/quiz';
import { questionWeight } from '../lib/quiz';
import { IconRepeat } from './Icons';
import QuestionView, { type Outcome } from './QuestionView';
import s from '../learn.module.css';

export type Summary = { score: number; total: number; missed: string[] };

export default function QuizRunner({
  questions, title, onFinish, onClose, onAgain,
}: {
  questions: Question[];
  title: string;
  onFinish: (summary: Summary) => void;
  onClose: () => void;
  onAgain?: () => void;
}) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState<Summary | null>(null);
  const total = questions.reduce((n, q) => n + questionWeight(q), 0);
  // refs so the auto-advance (which fires from a timer) always sees the latest tally
  const tally = useRef({ score: 0, missed: [] as string[], answered: -1 });

  /** called the moment a question is answered: the mark is final */
  const answer = (o: Outcome) => {
    const t = tally.current;
    if (t.answered === i) return;
    t.answered = i;
    t.score += o.correct;
    const q = questions[i];
    if (!o.firstTry && q.kind !== 'match') t.missed = [...t.missed, q.itemId];
    setScore(t.score);
  };

  const next = (o: Outcome) => {
    answer(o); // no-op if already counted
    if (i + 1 < questions.length) setI(i + 1);
    else {
      const sum = { score: tally.current.score, total, missed: tally.current.missed };
      setFinished(sum);
      onFinish(sum);
    }
  };

  if (!questions.length) {
    return <p className={s.muted}>No questions could be made from this selection.</p>;
  }

  if (finished) {
    const pct = Math.round((finished.score / Math.max(1, finished.total)) * 100);
    return (
      <div className={s.result}>
        <div className={s.scoreRing} style={{ ['--p' as string]: `${pct * 3.6}deg` }} aria-hidden>
          <span>{pct}%</span>
        </div>
        <h2 className={s.resultTitle}>
          {finished.score} of {finished.total} correct
        </h2>
        <p className={s.muted}>{pct >= 90 ? 'Excellent — MashaAllah.' : pct >= 60 ? 'Good work. Keep reviewing.' : 'A good start. Revise and try again.'}</p>
        {finished.missed.length > 0 && (
          <div className={s.missed}>
            <p className={s.label}>To revise</p>
            <ul>
              {[...new Set(finished.missed)].map(id => {
                const d = describe(id);
                return d ? (
                  <li key={id}>
                    <span lang="ar" dir="rtl">{d.arabic}</span> {d.title} — {d.subtitle}
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}
        <div className={s.row}>
          {onAgain && (
            <button type="button" className={s.btnGhost} onClick={onAgain}>
              <IconRepeat className={s.i18} /> New questions
            </button>
          )}
          <button type="button" className={s.btnPrimary} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.runner}>
      <div className={s.runnerTop}>
        <p className={s.label}>{title}</p>
        <p className={s.muted} aria-live="polite">
          Question {i + 1} of {questions.length} · {score} correct
        </p>
      </div>
      <div className={s.steps} aria-hidden>
        {questions.map((q, k) => (
          <span key={q.id} className={k < i ? s.stepDone : k === i ? s.stepNow : s.step} />
        ))}
      </div>
      <QuestionView key={questions[i].id} q={questions[i]} onAnswer={answer} onDone={next} />
    </div>
  );
}
