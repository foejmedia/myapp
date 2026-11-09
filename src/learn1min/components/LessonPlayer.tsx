'use client';
/**
 * Full-screen one-minute lesson: Learn -> Check -> Done.
 * In review mode it asks one question from each of several learned lessons.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { TRACK_LABEL, type Lesson } from '../lib/lessons';
import { IconBookmark, IconCheck, IconClose, IconFlame, IconSpeaker } from './Icons';
import { TrackIcon } from './TrackIcon';
import s from '../learn.module.css';

const TOTAL = 60;

function useCountdown(running: boolean) {
  const [left, setLeft] = useState(TOTAL);
  const start = useRef(0);
  useEffect(() => {
    if (!running) return;
    start.current = performance.now();
    const id = setInterval(() => setLeft(Math.max(0, TOTAL - (performance.now() - start.current) / 1000)), 200);
    return () => clearInterval(id);
  }, [running]);
  return left;
}

/** Arabic pronunciation through the browser's own voices, when an Arabic voice exists. */
function useArabicVoice() {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const pick = () => setVoice(window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith('ar')) ?? null);
    pick();
    window.speechSynthesis.addEventListener('voiceschanged', pick);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', pick);
      window.speechSynthesis.cancel();
    };
  }, []);
  const speak = useCallback(
    (text: string) => {
      if (!voice) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    },
    [voice],
  );
  return voice ? speak : null;
}

function Ring({ left }: { left: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <div className={s.timer} role="timer" aria-label={left > 0 ? `${Math.ceil(left)} seconds left` : 'Time is up, take your time'}>
      <svg viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r={r} className={s.timerTrack} />
        <circle
          cx="24" cy="24" r={r}
          className={s.timerArc}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - left / TOTAL)}
          transform="rotate(-90 24 24)"
        />
      </svg>
      <span>{left > 0 ? Math.ceil(left) : '∞'}</span>
    </div>
  );
}

function Quiz({
  lesson, onRight, compact = false,
}: { lesson: Lesson; onRight: (firstTry: boolean) => void; compact?: boolean }) {
  const [picked, setPicked] = useState<number[]>([]);
  const right = picked.includes(lesson.quiz.answer);
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headRef.current?.focus(), [lesson.id]);
  return (
    <div className={s.quiz}>
      {!compact && lesson.arabic && lesson.track !== 'word' && (
        <p className={s.quizArabic} lang="ar" dir="rtl">
          {lesson.arabic}
        </p>
      )}
      <h2 ref={headRef} tabIndex={-1} className={s.quizPrompt}>
        {lesson.quiz.prompt}
      </h2>
      <div className={s.options}>
        {lesson.quiz.options.map((o, i) => {
          const state = picked.includes(i) ? (i === lesson.quiz.answer ? s.optRight : s.optWrong) : '';
          return (
            <button
              key={o}
              type="button"
              className={`${s.option} ${state} ${lesson.quiz.arabicOptions ? s.optArabic : ''}`}
              lang={lesson.quiz.arabicOptions ? 'ar' : undefined}
              disabled={right || picked.includes(i)}
              onClick={() => {
                const next = [...picked, i];
                setPicked(next);
                if (i === lesson.quiz.answer) {
                  try { navigator.vibrate?.([15, 30, 15]); } catch { /* unsupported */ }
                  setTimeout(() => onRight(next.length === 1), 650);
                }
              }}
            >
              <span className={s.optKey} aria-hidden>{String.fromCharCode(65 + i)}</span>
              <span className={s.optText}>{o}</span>
              {picked.includes(i) && i === lesson.quiz.answer && <IconCheck className={s.optIcon} />}
            </button>
          );
        })}
      </div>
      <p className={s.feedback} role="status">
        {right ? 'Correct. Well done.' : picked.length ? 'Not quite. Try again, there is no rush.' : ' '}
      </p>
    </div>
  );
}

function LearnCard({ lesson, onNext }: { lesson: Lesson; onNext: () => void }) {
  const speak = useArabicVoice();
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headRef.current?.focus(), []);
  return (
    <div className={s.learnCard}>
      <span className={`${s.chip} ${s[`chip_${lesson.track}`]}`}>
        <TrackIcon track={lesson.track} className={s.chipIcon} /> {TRACK_LABEL[lesson.track]}
      </span>
      {lesson.arabic && (
        <div className={s.arabicRow}>
          <p className={lesson.track === 'dua' ? s.arabicDua : s.arabicHero} lang="ar" dir="rtl">
            {lesson.arabic}
          </p>
          {speak && (
            <button type="button" className={s.iconBtn} onClick={() => speak(lesson.arabic!)} aria-label="Listen to the pronunciation">
              <IconSpeaker className={s.icon20} />
            </button>
          )}
        </div>
      )}
      <h2 ref={headRef} tabIndex={-1} className={s.learnTitle}>
        {lesson.track === 'word' ? lesson.transliteration : lesson.title}
      </h2>
      {lesson.track === 'dua' && lesson.transliteration && <p className={s.translit}>{lesson.transliteration}</p>}
      <p className={s.meaningBig}>{lesson.meaning}</p>

      {lesson.facts && (
        <dl className={s.facts}>
          {lesson.facts.map(f => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {lesson.note && <p className={s.note}>{lesson.note}</p>}
      {lesson.example && (
        <figure className={s.example}>
          <p lang="ar" dir="rtl">{lesson.example.arabic}</p>
          <figcaption>
            “{lesson.example.meaning}” <cite>{lesson.example.ref}</cite>
          </figcaption>
        </figure>
      )}
      {lesson.ref && !lesson.example && <p className={s.ref}>Source: {lesson.ref}</p>}

      <button type="button" className={s.primary} onClick={onNext}>
        I&apos;ve got it — check me
      </button>
    </div>
  );
}

const BURST = Array.from({ length: 14 }, (_, i) => i);

export default function LessonPlayer({
  mode, lessons, dayNumber, streak, saved, onLearned, onToggleSave, onReviewed, onClose,
}: {
  mode: 'lesson' | 'review';
  lessons: Lesson[];          // one for a lesson, several for review
  dayNumber: number;          // which day of learning this completes
  streak: number;             // streak after completing
  saved: string[];
  onLearned: (lesson: Lesson) => void;
  onToggleSave: (id: string) => void;
  onReviewed: (correctFirstTry: number) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'learn' | 'check' | 'done'>(mode === 'review' ? 'check' : 'learn');
  const [qi, setQi] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const left = useCountdown(step !== 'done');
  const lesson = lessons[mode === 'review' ? qi : 0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const stepIndex = step === 'learn' ? 0 : step === 'check' ? 1 : 2;

  return (
    <div className={s.player} role="dialog" aria-modal="true" aria-label={mode === 'review' ? 'Quick review' : `Lesson: ${lesson.title}`}>
      <div className={s.playerTop}>
        <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Close">
          <IconClose className={s.icon20} />
        </button>
        <div className={s.progressBars} aria-hidden>
          {(mode === 'review' ? lessons : ['learn', 'check', 'done']).map((_, i) => (
            <span key={i} className={i < (mode === 'review' ? qi + (step === 'done' ? 1 : 0) : stepIndex) ? s.barDone : i === (mode === 'review' ? qi : stepIndex) ? s.barNow : s.bar} />
          ))}
        </div>
        {step !== 'done' ? <Ring left={left} /> : <span className={s.timerSpacer} />}
      </div>

      <div className={s.playerBody}>
        {step === 'learn' && <LearnCard lesson={lesson} onNext={() => setStep('check')} />}

        {step === 'check' && (
          <Quiz
            key={lesson.id}
            lesson={lesson}
            compact={mode === 'review'}
            onRight={ft => {
              if (mode === 'lesson') {
                onLearned(lesson);
                setStep('done');
              } else {
                const total = firstTry + (ft ? 1 : 0);
                setFirstTry(total);
                if (qi + 1 < lessons.length) setQi(qi + 1);
                else {
                  onReviewed(total);
                  setStep('done');
                }
              }
            }}
          />
        )}

        {step === 'done' && (
          <div className={s.done}>
            <div className={s.burst} aria-hidden>
              {BURST.map(i => (
                <span key={i} style={{ ['--a' as string]: `${(360 / BURST.length) * i}deg`, ['--d' as string]: `${(i % 3) * 60}ms` }} />
              ))}
              <div className={s.doneBadge}>
                <IconCheck className={s.doneCheck} />
              </div>
            </div>
            {mode === 'lesson' ? (
              <>
                <p className={s.kicker}>Day {dayNumber} complete</p>
                <h2 className={s.doneTitle}>You learned something new today</h2>
                <p className={s.doneSub}>
                  <strong>{lesson.title}</strong> is now in your notebook.
                </p>
                {streak > 1 && (
                  <p className={s.streakPill}>
                    <IconFlame className={s.icon18} /> {streak}-day streak
                  </p>
                )}
                <div className={s.doneActions}>
                  <button
                    type="button"
                    className={s.secondary}
                    aria-pressed={saved.includes(lesson.id)}
                    onClick={() => onToggleSave(lesson.id)}
                  >
                    <IconBookmark className={s.icon18} filled={saved.includes(lesson.id)} />
                    {saved.includes(lesson.id) ? 'Saved' : 'Save to favourites'}
                  </button>
                  <button type="button" className={s.primary} onClick={onClose} autoFocus>
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className={s.kicker}>Quick review</p>
                <h2 className={s.doneTitle}>
                  {firstTry} of {lessons.length} on the first try
                </h2>
                <p className={s.doneSub}>Reviewing keeps what you learned fresh.</p>
                <div className={s.doneActions}>
                  <button type="button" className={s.primary} onClick={onClose} autoFocus>
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
