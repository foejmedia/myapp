'use client';
/** Renders any question type and reports how it went: onDone(correct, total, firstTry). */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChoiceQuestion, GapQuestion, MatchQuestion, Question } from '../lib/quiz';
import { shuffle } from '../lib/random';
import { IconArrow, IconCheck } from './Icons';
import { AudioButton } from './ui';
import s from '../learn.module.css';

export type Outcome = { correct: number; total: number; firstTry: boolean };

function Options({
  q, onDone, arabicOptions,
}: { q: ChoiceQuestion | GapQuestion; onDone: (o: Outcome) => void; arabicOptions?: boolean }) {
  const [picked, setPicked] = useState<number[]>([]);
  const right = picked.includes(q.answer);
  const firstTry = picked.length === 1 && right;

  const pick = (i: number) => {
    if (right || picked.includes(i)) return;
    setPicked(p => [...p, i]);
    if (i === q.answer) {
      try {
        navigator.vibrate?.(12);
      } catch {
        /* unsupported */
      }
    }
  };

  // number keys 1-4 choose an option
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) pick(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <div className={s.options} role="group" aria-label="Answers">
        {q.options.map((o, i) => {
          const state = picked.includes(i) ? (i === q.answer ? s.optRight : s.optWrong) : right && i === q.answer ? s.optRight : '';
          return (
            <button
              key={o}
              type="button"
              className={`${s.option} ${state}`}
              disabled={right || picked.includes(i)}
              onClick={() => pick(i)}
              aria-describedby={picked.includes(i) ? `fb-${q.id}` : undefined}
            >
              <span className={s.optKey} aria-hidden>
                {i + 1}
              </span>
              <span className={arabicOptions ? s.optArabic : s.optText} lang={arabicOptions ? 'ar' : undefined} dir={arabicOptions ? 'rtl' : undefined}>
                {o}
              </span>
              {picked.includes(i) && i === q.answer && <IconCheck className={s.i20} />}
            </button>
          );
        })}
      </div>
      <div className={s.feedbackRow}>
        <p id={`fb-${q.id}`} className={right ? s.feedbackOk : picked.length ? s.feedbackNo : s.feedback} role="status">
          {right ? (firstTry ? 'Correct.' : 'That’s it.') : picked.length ? 'Not quite — try another.' : ' '}
          {right && 'explain' in q && q.explain ? <span className={s.explain}> {q.explain}</span> : null}
        </p>
        {right && (
          <button type="button" className={s.btnPrimary} autoFocus onClick={() => onDone({ correct: firstTry ? 1 : 0, total: 1, firstTry })}>
            Continue <IconArrow className={s.i18} />
          </button>
        )}
      </div>
    </>
  );
}

function Choice({ q, onDone }: { q: ChoiceQuestion; onDone: (o: Outcome) => void }) {
  return (
    <div className={s.question}>
      {q.arabic && (
        <div className={s.qArabicRow}>
          <p className={s.qArabic} lang="ar" dir="rtl">
            {q.arabic}
          </p>
          <AudioButton src={q.audio} label="pronunciation" />
        </div>
      )}
      {q.translit && <p className={s.qTranslit}>{q.translit}</p>}
      <h2 className={s.qPrompt} tabIndex={-1}>
        {q.prompt}
      </h2>
      <Options q={q} onDone={onDone} arabicOptions={q.arabicOptions} />
    </div>
  );
}

function Gap({ q, onDone }: { q: GapQuestion; onDone: (o: Outcome) => void }) {
  return (
    <div className={s.question}>
      <h2 className={s.qPrompt} tabIndex={-1}>
        {q.prompt}
      </h2>
      <figure className={s.gapAyah}>
        <p lang="ar" dir="rtl">
          {q.before} <span className={s.gapBlank} aria-label="missing word">⋯⋯</span> {q.after}
        </p>
        <figcaption>
          “{q.translation}” <cite>Qur’an {q.ref}</cite>
        </figcaption>
      </figure>
      <Options q={q} onDone={onDone} arabicOptions />
    </div>
  );
}

function Match({ q, onDone }: { q: MatchQuestion; onDone: (o: Outcome) => void }) {
  const right = useMemo(() => shuffle(q.pairs, `${q.id}:r`), [q]);
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const finished = done.length === q.pairs.length;
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);

  const tryPair = (enIndex: number) => {
    if (sel === null) return;
    const target = right[enIndex];
    if (q.pairs[sel].itemId === target.itemId) {
      setDone(d => [...d, sel]);
      setSel(null);
    } else {
      setMistakes(m => m + 1);
      setWrong(target.itemId);
      clearTimeout(t.current);
      t.current = setTimeout(() => setWrong(null), 600);
    }
  };

  return (
    <div className={s.question}>
      <h2 className={s.qPrompt} tabIndex={-1}>
        Match each word with its meaning
      </h2>
      <p className={s.muted}>Choose an Arabic word, then its meaning.</p>
      <div className={s.matchGrid}>
        <div className={s.matchCol} role="group" aria-label="Arabic words">
          {q.pairs.map((p, i) => (
            <button
              key={p.itemId}
              type="button"
              lang="ar"
              dir="rtl"
              className={`${s.matchItem} ${s.matchAr} ${done.includes(i) ? s.matchDone : sel === i ? s.matchSel : ''}`}
              disabled={done.includes(i)}
              aria-pressed={sel === i}
              onClick={() => setSel(i)}
            >
              {p.ar}
            </button>
          ))}
        </div>
        <div className={s.matchCol} role="group" aria-label="Meanings">
          {right.map((p, i) => {
            const isDone = done.some(d => q.pairs[d].itemId === p.itemId);
            return (
              <button
                key={p.itemId}
                type="button"
                className={`${s.matchItem} ${isDone ? s.matchDone : wrong === p.itemId ? s.matchWrong : ''}`}
                disabled={isDone || sel === null}
                onClick={() => tryPair(i)}
              >
                {p.en}
              </button>
            );
          })}
        </div>
      </div>
      <div className={s.feedbackRow}>
        <p className={finished ? s.feedbackOk : s.feedback} role="status">
          {finished ? `All matched${mistakes ? ` with ${mistakes} ${mistakes === 1 ? 'mistake' : 'mistakes'}` : ' first time'}.` : `${done.length} of ${q.pairs.length} matched`}
        </p>
        {finished && (
          <button
            type="button"
            className={s.btnPrimary}
            autoFocus
            onClick={() => onDone({ correct: Math.max(0, q.pairs.length - mistakes), total: q.pairs.length, firstTry: mistakes === 0 })}
          >
            Continue <IconArrow className={s.i18} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function QuestionView({ q, onDone }: { q: Question; onDone: (o: Outcome) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('h2')?.focus();
  }, [q.id]);
  return (
    <div ref={ref} key={q.id}>
      {q.kind === 'choice' ? <Choice q={q} onDone={onDone} /> : q.kind === 'gap' ? <Gap q={q} onDone={onDone} /> : <Match q={q} onDone={onDone} />}
    </div>
  );
}
