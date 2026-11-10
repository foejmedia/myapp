'use client';
/**
 * Renders any question type. Every question gets ONE attempt:
 * - onAnswer fires the moment it is answered (so the score updates straight away),
 * - onDone fires when it is time to move on: automatically after the feedback, or on Next.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChoiceQuestion, GapQuestion, MatchQuestion, Question } from '../lib/quiz';
import { shuffle } from '../lib/random';
import { IconArrow, IconCheck, IconClose } from './Icons';
import { AudioButton } from './ui';
import s from '../learn.module.css';

export type Outcome = { correct: number; total: number; firstTry: boolean };
type Handlers = { onDone: (o: Outcome) => void; onAnswer?: (o: Outcome) => void };

/** how long the feedback stays on screen before the next question opens by itself */
export const ADVANCE_MS = 1800;

/** Holds the outcome, starts the auto-advance timer, and makes sure onDone runs only once */
function useAdvance(onDone: (o: Outcome) => void) {
  const outcome = useRef<Outcome | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const done = useRef(false);
  const latest = useRef(onDone);
  latest.current = onDone;
  useEffect(() => () => clearTimeout(timer.current), []);

  const finish = () => {
    if (done.current || !outcome.current) return;
    done.current = true;
    clearTimeout(timer.current);
    latest.current(outcome.current);
  };
  const settle = (o: Outcome, delay = ADVANCE_MS) => {
    outcome.current = o;
    clearTimeout(timer.current);
    timer.current = setTimeout(finish, delay);
  };
  return { settle, finish };
}

function buzz(ok: boolean) {
  try {
    navigator.vibrate?.(ok ? 12 : [24, 50, 24]);
  } catch {
    /* unsupported */
  }
}

function NextButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={`${s.btnPrimary} ${s.autoNext}`} autoFocus onClick={onClick} style={{ ['--advance' as string]: `${ADVANCE_MS}ms` }}>
      Next <IconArrow className={s.i18} />
    </button>
  );
}

function Options({
  q, onDone, onAnswer, arabicOptions,
}: { q: ChoiceQuestion | GapQuestion; arabicOptions?: boolean } & Handlers) {
  // the first pick is final: no second guesses
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const right = picked === q.answer;
  const { settle, finish } = useAdvance(onDone);

  const pick = (i: number) => {
    if (answered) return;
    const ok = i === q.answer;
    const o = { correct: ok ? 1 : 0, total: 1, firstTry: ok };
    setPicked(i);
    onAnswer?.(o);
    buzz(ok);
    settle(o);
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
          const state = !answered ? '' : i === q.answer ? s.optRight : i === picked ? s.optWrong : '';
          return (
            <button
              key={o}
              type="button"
              className={`${s.option} ${state}`}
              disabled={answered}
              onClick={() => pick(i)}
              aria-describedby={answered ? `fb-${q.id}` : undefined}
            >
              <span className={s.optKey} aria-hidden>
                {i + 1}
              </span>
              <span className={arabicOptions ? s.optArabic : s.optText} lang={arabicOptions ? 'ar' : undefined} dir={arabicOptions ? 'rtl' : undefined}>
                {o}
              </span>
              {answered && i === q.answer && <IconCheck className={s.i20} />}
              {answered && i === picked && !right && <IconClose className={s.i20} />}
            </button>
          );
        })}
      </div>
      <div className={s.feedbackRow}>
        <p id={`fb-${q.id}`} className={!answered ? s.feedback : right ? s.feedbackOk : s.feedbackNo} role="status">
          {!answered ? ' ' : right ? 'Correct.' : 'Wrong — the correct answer is shown in green.'}
          {answered && 'explain' in q && q.explain ? <span className={s.explain}> {q.explain}</span> : null}
        </p>
        {answered && <NextButton onClick={finish} />}
      </div>
    </>
  );
}

function Choice({ q, ...h }: { q: ChoiceQuestion } & Handlers) {
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
      <Options q={q} {...h} arabicOptions={q.arabicOptions} />
    </div>
  );
}

function Gap({ q, ...h }: { q: GapQuestion } & Handlers) {
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
      <Options q={q} {...h} arabicOptions />
    </div>
  );
}

/**
 * Match: one attempt per word. A wrong pairing marks that word WRONG (red), shows its real meaning in green,
 * and locks both — the mark for that word is gone.
 */
function Match({ q, onDone, onAnswer }: { q: MatchQuestion } & Handlers) {
  const right = useMemo(() => shuffle(q.pairs, `${q.id}:r`), [q]);
  const [sel, setSel] = useState<number | null>(null);
  const [won, setWon] = useState<number[]>([]); // pair indexes matched first time
  const [lost, setLost] = useState<number[]>([]); // pair indexes answered wrongly
  const [flash, setFlash] = useState<{ wrong: string; pair: number } | null>(null);
  const resolved = won.length + lost.length;
  const finished = resolved === q.pairs.length;
  const { settle, finish } = useAdvance(onDone);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);

  const tryPair = (enIndex: number) => {
    if (sel === null) return;
    const target = right[enIndex];
    const ok = q.pairs[sel].itemId === target.itemId;
    const nextWon = ok ? [...won, sel] : won;
    const nextLost = ok ? lost : [...lost, sel];
    setWon(nextWon);
    setLost(nextLost);
    buzz(ok);
    if (!ok) {
      setFlash({ wrong: target.itemId, pair: sel });
      clearTimeout(t.current);
      t.current = setTimeout(() => setFlash(null), 1100);
    }
    setSel(null);
    if (nextWon.length + nextLost.length === q.pairs.length) {
      const o = { correct: nextWon.length, total: q.pairs.length, firstTry: nextLost.length === 0 };
      onAnswer?.(o);
      settle(o, ADVANCE_MS + 400);
    }
  };

  const pairOf = (itemId: string) => q.pairs.findIndex(p => p.itemId === itemId);

  return (
    <div className={s.question}>
      <h2 className={s.qPrompt} tabIndex={-1}>
        Match each word with its meaning
      </h2>
      <p className={s.muted}>Choose an Arabic word, then its meaning. One try per word.</p>
      <div className={s.matchGrid}>
        <div className={s.matchCol} role="group" aria-label="Arabic words">
          {q.pairs.map((p, i) => {
            const state = won.includes(i) ? s.matchDone : lost.includes(i) ? s.matchLost : sel === i ? s.matchSel : '';
            return (
              <button
                key={p.itemId}
                type="button"
                lang="ar"
                dir="rtl"
                className={`${s.matchItem} ${s.matchAr} ${state}`}
                disabled={won.includes(i) || lost.includes(i)}
                aria-pressed={sel === i}
                onClick={() => setSel(i)}
              >
                {p.ar}
                {lost.includes(i) && <small>{p.en}</small>}
              </button>
            );
          })}
        </div>
        <div className={s.matchCol} role="group" aria-label="Meanings">
          {right.map((p, i) => {
            const pi = pairOf(p.itemId);
            const isWon = won.includes(pi);
            const isLost = lost.includes(pi);
            const reveal = flash && flash.pair === pi; // the real meaning of the word just missed
            const state = flash?.wrong === p.itemId
              ? s.matchWrong
              : reveal || isWon
                ? s.matchDone
                : isLost
                  ? s.matchLostEn
                  : '';
            return (
              <button
                key={p.itemId}
                type="button"
                className={`${s.matchItem} ${state}`}
                disabled={isWon || isLost || sel === null || finished}
                onClick={() => tryPair(i)}
              >
                {p.en}
              </button>
            );
          })}
        </div>
      </div>
      <div className={s.feedbackRow}>
        <p className={!finished ? s.feedback : lost.length ? s.feedbackNo : s.feedbackOk} role="status">
          {finished
            ? `${won.length} of ${q.pairs.length} correct.`
            : flash
              ? `Wrong — “${q.pairs[flash.pair].ar}” means “${q.pairs[flash.pair].en}”.`
              : `${resolved} of ${q.pairs.length} answered`}
        </p>
        {finished && <NextButton onClick={finish} />}
      </div>
    </div>
  );
}

export default function QuestionView({ q, onDone, onAnswer }: { q: Question } & Handlers) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('h2')?.focus();
  }, [q.id]);
  const h = { onDone, onAnswer };
  return (
    <div ref={ref} key={q.id}>
      {q.kind === 'choice' ? <Choice q={q} {...h} /> : q.kind === 'gap' ? <Gap q={q} {...h} /> : <Match q={q} {...h} />}
    </div>
  );
}
