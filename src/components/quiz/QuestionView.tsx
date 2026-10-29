'use client';
import { useEffect, useRef, useState } from 'react';
import { answerText, modeTitle, type Option, type Question, type Response, type Verdict } from '@/lib/quiz/engine';

export function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ''}`} aria-hidden="true">{name}</span>;
}

/** Arabic text gets the Hafs font via lang="ar"; Urdu is also right-to-left */
export function Txt({ o, className }: { o: Pick<Option, 'text' | 'lang'>; className?: string }) {
  const rtl = o.lang === 'ar' || o.lang === 'ur';
  return (
    <span lang={o.lang} dir={rtl ? 'rtl' : 'ltr'} className={`${o.lang === 'ar' ? 'qz-ar' : ''} ${className ?? ''}`}>
      {o.text}
    </span>
  );
}

function Audio({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<'idle' | 'playing' | 'error'>('idle');
  useEffect(() => { setState('idle'); }, [src]);
  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setState('playing')).catch(() => setState('error'));
    else { a.pause(); setState('idle'); }
  };
  return (
    <div className="qz-audio">
      <audio ref={ref} src={src} preload="none" onEnded={() => setState('idle')} onError={() => setState('error')} />
      <button type="button" className="qz-play" onClick={toggle} aria-label={state === 'playing' ? 'Pause recitation' : 'Play recitation'}>
        <Icon name={state === 'playing' ? 'pause' : 'play_arrow'} />
      </button>
      <span>{state === 'error' ? 'The recitation couldn’t be played. Check your connection.' : state === 'playing' ? 'Playing…' : 'Play the recitation'}</span>
    </div>
  );
}

interface Props {
  q: Question;
  index: number;
  total: number;
  response: Response | null;
  onResponse: (r: Response | null) => void;
  verdict: Verdict | null;
  onSubmit: () => void;
  onContinue: () => void;
  isLast: boolean;
}

export default function QuestionView({ q, index, total, response, onResponse, verdict, onSubmit, onContinue, isLast }: Props) {
  const done = verdict != null;
  const continueRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (done) continueRef.current?.focus(); }, [done]);

  const complete = q.kind === 'mcq' ? typeof response === 'string' : Array.isArray(response) && response.length === q.segments.length;

  return (
    <article className="qz-q" aria-labelledby="qz-prompt">
      <div className="qz-q-top">
        <span>Question {index + 1} of {total}</span>
        <span className="qz-chip">{modeTitle(q.mode)}</span>
      </div>
      <div className="qz-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + (done ? 1 : 0)} aria-label="Session progress">
        <i style={{ width: `${((index + (done ? 1 : 0)) / total) * 100}%` }} />
      </div>

      <h2 id="qz-prompt" className="qz-prompt">{q.prompt}</h2>

      {q.audio && <Audio src={q.audio} />}
      {q.stemAr && (
        <p className="qz-stem qz-ar" lang="ar" dir="rtl">
          {q.stemAr.map((w, i) => (w === null
            ? <span key={i} className="qz-blank" aria-label="missing">{done && q.kind === 'mcq' ? answerText(q) : ' '}</span>
            : <span key={i}>{w} </span>))}
        </p>
      )}
      {q.stemText && <p className="qz-stem-text"><Txt o={q.stemText} /></p>}

      {q.kind === 'mcq' ? (
        <div className="qz-options" role="radiogroup" aria-labelledby="qz-prompt">
          {q.options.map((o, i) => {
            const chosen = response === o.id;
            const state = !done ? (chosen ? 'is-chosen' : '') : o.id === q.answerId ? 'is-right' : chosen ? 'is-wrong' : 'is-dim';
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={chosen}
                disabled={done}
                className={`qz-option ${state}`}
                onClick={() => onResponse(o.id)}
              >
                <span className="qz-key" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                <Txt o={o} className="qz-option-text" />
                {done && o.id === q.answerId && <Icon name="check_circle" className="qz-mark" />}
                {done && chosen && o.id !== q.answerId && <Icon name="cancel" className="qz-mark" />}
              </button>
            );
          })}
        </div>
      ) : (
        <Arrange q={q} response={(response as string[] | null) ?? []} onResponse={onResponse} done={done} />
      )}

      {!done ? (
        <button type="button" className="qz-btn primary wide" disabled={!complete} onClick={onSubmit}>
          Submit answer
        </button>
      ) : (
        <section className={`qz-feedback ${verdict.correct ? 'ok' : 'no'}`} aria-live="polite">
          <p className="qz-verdict">
            <Icon name={verdict.correct ? 'check_circle' : 'info'} />
            {verdict.correct ? 'Correct' : 'Not quite'}
          </p>
          {!verdict.correct && (
            <p className="qz-answer">
              Correct answer: <Txt o={{ text: answerText(q), lang: q.kind === 'arrange' ? 'ar' : q.options.find(o => o.id === q.answerId)!.lang }} />
            </p>
          )}
          <p className="qz-expl">{q.explanation}</p>
          {q.context && (
            <div className="qz-context">
              <p className="qz-ar" lang="ar" dir="rtl">{q.context.ar}</p>
              <p className="qz-context-tr">{q.context.translation}</p>
              <p className="qz-ref"><Icon name="bookmark" /> Surah {q.ref.surahName} · {q.context.key}</p>
            </div>
          )}
          {!q.context && <p className="qz-ref"><Icon name="bookmark" /> Surah {q.ref.surahName}</p>}
          <p className="qz-sources">{q.sources.join(' · ')}</p>
          <button ref={continueRef} type="button" className="qz-btn primary wide" onClick={onContinue}>
            {isLast ? 'See results' : 'Continue'}
          </button>
        </section>
      )}
    </article>
  );
}

function Arrange({ q, response, onResponse, done }: { q: Extract<Question, { kind: 'arrange' }>; response: string[]; onResponse: (r: string[] | null) => void; done: boolean }) {
  const byId = new Map(q.segments.map(s => [s.id, s]));
  const left = q.segments.filter(s => !response.includes(s.id));
  return (
    <div className="qz-arrange">
      <p className="qz-arrange-label">Your order <small>(right to left)</small></p>
      <ol className={`qz-tray${done ? ' is-done' : ''}`} dir="rtl" aria-label="Your order">
        {response.length === 0 && <li className="qz-tray-empty" dir="ltr">Tap the parts below</li>}
        {response.map((id, i) => (
          <li key={id}>
            <button
              type="button"
              className="qz-seg is-placed"
              disabled={done}
              onClick={() => onResponse(response.filter(x => x !== id))}
              aria-label={`Part ${i + 1}: ${byId.get(id)!.text}. Tap to remove.`}
            >
              <Txt o={byId.get(id)!} />
            </button>
          </li>
        ))}
      </ol>
      {!done && (
        <div className="qz-pool" dir="rtl" aria-label="Parts to place">
          {left.map(s => (
            <button key={s.id} type="button" className="qz-seg" onClick={() => onResponse([...response, s.id])}>
              <Txt o={s} />
            </button>
          ))}
        </div>
      )}
      {!done && response.length > 0 && (
        <button type="button" className="qz-link" onClick={() => onResponse(null)}><Icon name="restart_alt" /> Clear</button>
      )}
    </div>
  );
}
