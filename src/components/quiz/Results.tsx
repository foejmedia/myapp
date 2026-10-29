'use client';
import Link from 'next/link';
import { answerText, modeTitle, type Mode, type Question } from '@/lib/quiz/engine';
import { Icon, Txt } from './QuestionView';

export interface Answered { q: Question; correct: boolean }

interface Props {
  answers: Answered[];
  revisionCount: number;
  onRetryIncorrect: () => void;
  onRevision: () => void;
}

export default function Results({ answers, revisionCount, onRetryIncorrect, onRevision }: Props) {
  const total = answers.length;
  const right = answers.filter(a => a.correct).length;
  const wrong = answers.filter(a => !a.correct);
  const pct = total ? Math.round((right / total) * 100) : 0;

  const byMode = new Map<Mode, { n: number; ok: number }>();
  for (const a of answers) {
    const t = byMode.get(a.q.mode) ?? { n: 0, ok: 0 };
    byMode.set(a.q.mode, { n: t.n + 1, ok: t.ok + (a.correct ? 1 : 0) });
  }
  const practise = [...byMode].filter(([, t]) => t.ok / t.n < 0.7).map(([m]) => m);

  return (
    <section className="qz-results" aria-labelledby="qz-results-h">
      <div className="qz-score">
        <div className="qz-ring" style={{ ['--pct' as string]: pct }} aria-hidden="true"><b>{pct}%</b></div>
        <div>
          <h2 id="qz-results-h">Session complete</h2>
          <p>{right} of {total} correct</p>
        </div>
      </div>

      <dl className="qz-stats">
        <div><dt>Answered</dt><dd>{total}</dd></div>
        <div><dt>Correct</dt><dd className="ok">{right}</dd></div>
        <div><dt>To review</dt><dd className="no">{wrong.length}</dd></div>
        <div><dt>Accuracy</dt><dd>{pct}%</dd></div>
      </dl>

      {byMode.size > 1 && (
        <div className="qz-card">
          <h3>By category</h3>
          <ul className="qz-cats">
            {[...byMode].map(([m, t]) => (
              <li key={m}>
                <span>{modeTitle(m)}</span>
                <span className="qz-meter" aria-hidden="true"><i style={{ width: `${(t.ok / t.n) * 100}%` }} /></span>
                <b>{t.ok}/{t.n}</b>
              </li>
            ))}
          </ul>
        </div>
      )}

      {practise.length > 0 && (
        <p className="qz-note"><Icon name="lightbulb" /> More practice would help with: {practise.map(modeTitle).join(', ')}.</p>
      )}

      {wrong.length > 0 ? (
        <div className="qz-card">
          <h3>Questions to revise</h3>
          <ul className="qz-review">
            {wrong.map(({ q }) => (
              <li key={q.id}>
                <p className="qz-review-q">{q.prompt} <small>· {modeTitle(q.mode)}</small></p>
                <p className="qz-review-a">
                  <Txt o={{ text: answerText(q), lang: q.kind === 'arrange' ? 'ar' : q.options.find(o => o.id === q.answerId)!.lang }} />
                </p>
                <p className="qz-ref"><Icon name="bookmark" /> Surah {q.ref.surahName}{q.ref.ayah ? ` · ${q.ref.surah}:${q.ref.ayah}` : ''}</p>
              </li>
            ))}
          </ul>
          <p className="qz-small">These are saved to Revision, and come back until you answer each correctly twice in a row.</p>
        </div>
      ) : (
        <p className="qz-note"><Icon name="task_alt" /> Every answer was correct this time.</p>
      )}

      <div className="qz-actions">
        {wrong.length > 0 && (
          <button type="button" className="qz-btn primary" onClick={onRetryIncorrect}>
            <Icon name="replay" /> Retry incorrect ({wrong.length})
          </button>
        )}
        <Link href="/quiz" className={`qz-btn${wrong.length ? '' : ' primary'}`}><Icon name="add" /> Start another quiz</Link>
        {revisionCount > 0 && (
          <button type="button" className="qz-btn" onClick={onRevision}><Icon name="history" /> Revision ({revisionCount})</button>
        )}
      </div>
    </section>
  );
}
