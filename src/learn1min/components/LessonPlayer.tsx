'use client';
/** The one-minute daily lesson: Learn → Check → Done. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { chapter } from '../content/chapters';
import { DUA_BY_ID } from '../content/duas';
import { VOCAB_BY_ID } from '../content/vocabulary';
import { dayKey } from '../lib/dates';
import { describe, kindOf, refOf } from '../lib/items';
import { lessonQuestion } from '../lib/quiz';
import { useLearn } from '../store/LearnProvider';
import { DuaBody, SurahSummary, WordFacts, WordHead, ExampleAyah } from './cards';
import { IconArrow, IconCheck, IconFlame } from './Icons';
import Overlay from './Overlay';
import QuestionView from './QuestionView';
import { KindChip, SaveButton } from './ui';
import s from '../learn.module.css';

const TOTAL = 60;

function Timer({ running }: { running: boolean }) {
  const [left, setLeft] = useState(TOTAL);
  const start = useRef(0);
  useEffect(() => {
    if (!running) return;
    start.current = performance.now();
    const id = setInterval(() => setLeft(Math.max(0, TOTAL - (performance.now() - start.current) / 1000)), 250);
    return () => clearInterval(id);
  }, [running]);
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div className={s.timer} role="timer" aria-label={left > 0 ? `About ${Math.ceil(left)} seconds left` : 'Take your time'}>
      <svg viewBox="0 0 44 44" aria-hidden>
        <circle cx="22" cy="22" r={r} className={s.timerTrack} />
        <circle cx="22" cy="22" r={r} className={s.timerArc} strokeDasharray={c} strokeDashoffset={c * (1 - left / TOTAL)} transform="rotate(-90 22 22)" />
      </svg>
      <span>{left > 0 ? Math.ceil(left) : '—'}</span>
    </div>
  );
}

function LearnStep({ itemId }: { itemId: string }) {
  const { data } = useLearn();
  const ref = refOf(itemId);
  switch (kindOf(itemId)) {
    case 'v': {
      const w = VOCAB_BY_ID[ref];
      return (
        <>
          <WordHead w={w} />
          <WordFacts w={w} />
          {w.examples[0] && <ExampleAyah ex={w.examples[0]} />}
        </>
      );
    }
    case 'd':
      return <DuaBody d={DUA_BY_ID[ref]} />;
    case 's': {
      const c = chapter(Number(ref))!;
      return <SurahSummary c={c} learnedAyat={data.ayat[ref]?.length ?? 0} />;
    }
    default:
      return null;
  }
}

export default function LessonPlayer({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const { data, dispatch, clock } = useLearn();
  const [step, setStep] = useState<'learn' | 'check' | 'done'>('learn');
  const question = useMemo(() => lessonQuestion(itemId, `lesson:${itemId}`), [itemId]);
  const info = describe(itemId);
  const already = clock ? data.learned[clock.today] : undefined;
  const steps = ['learn', 'check', 'done'] as const;
  const at = steps.indexOf(step);

  return (
    <Overlay
      label={`Daily lesson: ${info?.title ?? ''}`}
      onClose={onClose}
      aside={
        <>
          <div className={s.steps} aria-hidden>
            {steps.map((k, i) => (
              <span key={k} className={i < at ? s.stepDone : i === at ? s.stepNow : s.step} />
            ))}
          </div>
          {step !== 'done' && <Timer running />}
        </>
      }
    >
      <div className={s.lessonCard}>
        {step === 'learn' && (
          <>
            <div className={s.rowBetween}>
              <KindChip itemId={itemId} />
              <SaveButton itemId={itemId} />
            </div>
            <LearnStep itemId={itemId} />
            <button type="button" className={s.btnPrimaryWide} onClick={() => setStep('check')}>
              I’ve got it — check me <IconArrow className={s.i18} />
            </button>
          </>
        )}

        {step === 'check' && question && (
          <QuestionView
            q={question}
            onDone={() => {
              dispatch({ type: 'completeLesson', itemId, day: dayKey(new Date()) });
              setStep('done');
            }}
          />
        )}

        {step === 'done' && (
          <div className={s.done}>
            <span className={s.doneBadge} aria-hidden>
              <IconCheck className={s.doneCheck} />
            </span>
            <p className={s.eyebrow}>{already && already !== itemId ? 'Reviewed' : 'Today’s lesson complete'}</p>
            <h2 className={s.doneTitle}>You learned something new</h2>
            <p className={s.muted}>
              <strong>{info?.title}</strong>
              {kindOf(itemId) === 'v' ? ' will come back for revision tomorrow.' : ' is now in your progress.'}
            </p>
            <p className={s.doneStreak}>
              <IconFlame className={s.i18} /> Keep the habit: one minute a day
            </p>
            <div className={s.row}>
              <SaveButton itemId={itemId} withText />
              <button type="button" className={s.btnPrimary} onClick={onClose} autoFocus>
                Back to dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </Overlay>
  );
}
