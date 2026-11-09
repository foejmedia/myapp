'use client';
import { useMemo, useState } from 'react';
import { VOCAB_BY_ID } from '../content/vocabulary';
import { kindOf, refOf } from '../lib/items';
import { buildSession, dailyChallenge, type Question, type QuizMode } from '../lib/quiz';
import { useLearn } from '../store/LearnProvider';
import { IconCheck, IconQuiz, IconSpark } from './Icons';
import Overlay from './Overlay';
import QuizRunner from './QuizRunner';
import { EmptyState, PageHeader, Ready } from './ui';
import s from '../learn.module.css';

const MODES: { id: QuizMode; title: string; body: string }[] = [
  { id: 'meaning', title: 'Multiple choice', body: 'See an Arabic word, choose its meaning.' },
  { id: 'reverse', title: 'English → Arabic', body: 'See a meaning, choose the Arabic word.' },
  { id: 'gap', title: 'Fill the missing word', body: 'Complete a real ayah from the Qur’an.' },
  { id: 'match', title: 'Match pairs', body: 'Pair five Arabic words with their meanings.' },
  { id: 'mixed', title: 'Mixed practice', body: 'A bit of everything, ten questions.' },
];
const MODE_LABEL: Record<string, string> = { ...Object.fromEntries(MODES.map(m => [m.id, m.title])), daily: 'Daily challenge', quick: 'Quick review' };

function Inner() {
  const { data, dispatch, clock } = useLearn();
  const today = clock!.today;
  const [run, setRun] = useState<{ mode: QuizMode | 'daily'; questions: Question[]; nonce: number } | null>(null);
  const learned = Object.keys(data.cards).filter(id => kindOf(id) === 'v').map(id => VOCAB_BY_ID[refOf(id)]).filter(Boolean);
  const dailyDone = data.quiz.daily[today];
  const history = data.quiz.history;

  const perf = useMemo(() => {
    const by: Record<string, { score: number; total: number; n: number }> = {};
    for (const r of history) {
      const b = (by[r.mode] ??= { score: 0, total: 0, n: 0 });
      b.score += r.score;
      b.total += r.total;
      b.n++;
    }
    const answered = history.reduce((n, r) => n + r.total, 0);
    const correct = history.reduce((n, r) => n + r.score, 0);
    const best = history.reduce((m, r) => Math.max(m, r.total ? r.score / r.total : 0), 0);
    return { by, answered, accuracy: answered ? correct / answered : null, best };
  }, [history]);

  const start = (mode: QuizMode | 'daily') => {
    const nonce = Date.now();
    const questions = mode === 'daily' ? dailyChallenge(today, learned) : buildSession(mode, learned, 10, `${mode}:${nonce}`);
    setRun({ mode, questions, nonce });
  };

  return (
    <>
      <PageHeader
        eyebrow="Module"
        title="Quizzes"
        lead={
          learned.length
            ? `Questions are drawn from the ${learned.length} ${learned.length === 1 ? 'word' : 'words'} you have learned.`
            : 'You have not learned any words yet, so questions use the most frequent words of the Qur’an.'
        }
      />

      <section className={`${s.card} ${s.challenge}`} aria-labelledby="l1m-daily">
        <div>
          <p className={s.eyebrowSm}>
            <IconSpark className={s.i14} /> Daily challenge ·{' '}
            {new Date(today + 'T12:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
          </p>
          <h2 id="l1m-daily" className={s.challengeTitle}>
            {dailyDone ? `You scored ${dailyDone.score} of ${dailyDone.total} today` : 'Five questions, the same for the whole day'}
          </h2>
          <p className={s.muted}>
            {dailyDone ? 'Your first attempt is recorded. You can play again for practice.' : 'Two meanings, one reverse, one ayah and one match.'}
          </p>
        </div>
        <button type="button" className={dailyDone ? s.btnGhost : s.btnPrimary} onClick={() => start('daily')}>
          {dailyDone ? (
            <>
              <IconCheck className={s.i18} /> Play again
            </>
          ) : (
            'Start the challenge'
          )}
        </button>
      </section>

      <ul className={s.modeGrid}>
        {MODES.map(m => {
          const p = perf.by[m.id];
          return (
            <li key={m.id}>
              <button type="button" className={s.modeCard} onClick={() => start(m.id)}>
                <IconQuiz className={`${s.i20} ${s.primaryInk}`} />
                <strong>{m.title}</strong>
                <span>{m.body}</span>
                <small>{p ? `${Math.round((p.score / Math.max(1, p.total)) * 100)}% over ${p.n} ${p.n === 1 ? 'session' : 'sessions'}` : 'Not tried yet'}</small>
              </button>
            </li>
          );
        })}
      </ul>

      <section className={s.card} aria-labelledby="l1m-perf">
        <h2 id="l1m-perf" className={s.cardTitle}>
          Score & performance
        </h2>
        {history.length === 0 ? (
          <EmptyState title="No quiz results yet" body="Finish a quiz and your scores appear here." />
        ) : (
          <>
            <div className={s.statGrid}>
              <div className={s.stat}>
                <strong>{history.length}</strong>
                <span>Sessions</span>
              </div>
              <div className={s.stat}>
                <strong>{perf.accuracy === null ? '—' : `${Math.round(perf.accuracy * 100)}%`}</strong>
                <span>Average accuracy</span>
              </div>
              <div className={s.stat}>
                <strong>{Math.round(perf.best * 100)}%</strong>
                <span>Best score</span>
              </div>
            </div>
            <div className={s.historyChart} role="img" aria-label="Scores of your last 20 sessions">
              {history.slice(-20).map((r, i) => (
                <span key={i} title={`${MODE_LABEL[r.mode] ?? r.mode}: ${r.score}/${r.total}`} style={{ height: `${Math.max(4, (r.score / Math.max(1, r.total)) * 100)}%` }} />
              ))}
            </div>
            <table className={s.table}>
              <caption className={s.srOnly}>Recent quiz results</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Quiz</th>
                  <th scope="col">Score</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(-8).reverse().map((r, i) => (
                  <tr key={i}>
                    <td>{new Date(r.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</td>
                    <td>{MODE_LABEL[r.mode] ?? r.mode}</td>
                    <td>
                      {r.score}/{r.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      {run && (
        <Overlay label={MODE_LABEL[run.mode]} onClose={() => setRun(null)}>
          <div className={s.lessonCard}>
            <QuizRunner
              key={run.nonce}
              questions={run.questions}
              title={MODE_LABEL[run.mode]}
              onClose={() => setRun(null)}
              onAgain={run.mode === 'daily' ? undefined : () => start(run.mode)}
              onFinish={r =>
                dispatch({
                  type: 'quiz',
                  daily: run.mode === 'daily',
                  result: { at: new Date().toISOString(), day: today, mode: run.mode, score: r.score, total: r.total },
                })
              }
            />
          </div>
        </Overlay>
      )}
    </>
  );
}

export default function QuizPage() {
  return (
    <Ready>
      <Inner />
    </Ready>
  );
}
