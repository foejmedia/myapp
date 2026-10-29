'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LANGS, LEVEL_SURAHS, type Lang, type Level } from '@/lib/quiz/content';
import {
  MODES, buildSession, checkAnswer, chooseSurahs, reshuffle, rngFrom, sessionTitle, shuffle,
  type Mode, type Question, type Response, type SessionKind, type Verdict,
} from '@/lib/quiz/engine';
import {
  dayKey, loadProgress, recordAnswer, recordSession, resolveLevel, revisionQueue, saveProgress, weakModes, type Progress,
} from '@/lib/quiz/progress';
import QuestionView, { Icon } from './QuestionView';
import Results, { type Answered } from './Results';
import { useQuizContent } from './useQuizContent';
import './quiz.css';

const KINDS: SessionKind[] = [...MODES.map(m => m.id), 'mixed', 'daily', 'revision'];
const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];
const DAILY_COUNT = 5;

/** Five different categories, weakest first, the rest picked by the day's seed */
function dailyModes(p: Progress, seed: string): Mode[] {
  const weak = weakModes(p);
  const rest = shuffle(MODES.map(m => m.id).filter(m => !weak.includes(m)), rngFrom(seed));
  return [...weak, ...rest].slice(0, DAILY_COUNT);
}

export default function QuizPlay() {
  const query = useSearchParams()?.toString() ?? '';
  const sp = useMemo(() => new URLSearchParams(query), [query]);
  const router = useRouter();
  const kindParam = sp.get('kind') as SessionKind;
  const kind: SessionKind = KINDS.includes(kindParam) ? kindParam : 'mixed';
  const levelParam = sp.get('level') as Level;
  const langParam = sp.get('lang') as Lang;
  const lang: Lang = LANGS.some(l => l.id === langParam) ? langParam : 'en';
  const count = Math.min(20, Math.max(3, Number(sp.get('count')) || 10));
  const surahParam = Number(sp.get('surah'));
  const focus = Number.isInteger(surahParam) && surahParam >= 1 && surahParam <= 114 ? surahParam : null;

  // progress as it was when the session started (questions are built from this) and as it is now
  const [start, setStart] = useState<Progress | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  useEffect(() => { const p = loadProgress(); setStart(p); setProgress(p); }, [query]);

  const level: Level | null = start ? (LEVELS.includes(levelParam) ? levelParam : resolveLevel(start)) : null;
  const seed = useMemo(
    () => (kind === 'daily' ? `daily:${dayKey()}:${level}:${lang}` : `${Date.now()}`),
    // a new seed per visit, but stable for the daily challenge
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, level, lang, query],
  );
  const surahs = useMemo(
    () => (kind === 'revision' || !level ? null : chooseSurahs(level, LEVEL_SURAHS, rngFrom(seed), focus)),
    [kind, level, seed, focus],
  );
  const { state, retry, loadDemo } = useQuizContent(surahs, lang);

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [roundKind, setRoundKind] = useState<SessionKind>(kind);
  const [i, setI] = useState(0);
  const [response, setResponse] = useState<Response | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [answers, setAnswers] = useState<Answered[]>([]);
  const [finished, setFinished] = useState(false);

  const begin = (qs: Question[], k: SessionKind) => {
    setQuestions(qs);
    setRoundKind(k);
    setI(0);
    setResponse(null);
    setVerdict(null);
    setAnswers([]);
    setFinished(false);
  };

  useEffect(() => {
    if (!start || !level) return;
    if (kind === 'revision') {
      begin(revisionQueue(start, count).map(q => reshuffle(q, rngFrom(seed))), 'revision');
      return;
    }
    if (state.status !== 'ready') return;
    const modes = kind === 'mixed' ? shuffle(MODES.map(m => m.id), rngFrom(seed)) : kind === 'daily' ? dailyModes(start, seed) : [kind];
    begin(buildSession(state.content, { modes, level, count: kind === 'daily' ? DAILY_COUNT : count, seed }), kind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, level, kind, state, seed, count]);

  const q = questions?.[i];

  const submit = () => {
    if (!q || !progress || verdict) return;
    const v = checkAnswer(q, response);
    if (!v.valid) return;
    setVerdict(v);
    setAnswers(a => [...a, { q, correct: v.correct }]);
    const next = recordAnswer(progress, q, v.correct);
    setProgress(next);
    saveProgress(next);
  };

  const advance = () => {
    if (!questions || !progress || !level) return;
    if (i + 1 < questions.length) {
      setI(i + 1);
      setResponse(null);
      setVerdict(null);
    } else {
      const next = recordSession(progress, {
        at: Date.now(), kind: roundKind, level, total: answers.length, correct: answers.filter(a => a.correct).length,
      });
      setProgress(next);
      saveProgress(next);
      setFinished(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const retryIncorrect = () => {
    const rng = rngFrom(Date.now());
    begin(answers.filter(a => !a.correct).map(a => reshuffle(a.q, rng)), 'revision');
    window.scrollTo({ top: 0 });
  };

  const demo = state.status === 'ready' && state.content.demo;

  let body: React.ReactNode;
  if (!start || (kind !== 'revision' && (state.status === 'loading' || state.status === 'idle')) || (state.status === 'ready' && !questions)) {
    body = <div className="qz-center" role="status"><span className="qz-spinner" aria-hidden="true" /><p>Preparing your questions…</p></div>;
  } else if (kind !== 'revision' && state.status === 'error') {
    body = (
      <div className="qz-state" role="alert">
        <Icon name="cloud_off" />
        <h2>Couldn’t load Quran content</h2>
        <p>{state.message} Questions are only built from verified text, so the quiz can’t start without it.</p>
        <div className="qz-actions center">
          <button type="button" className="qz-btn primary" onClick={retry}><Icon name="refresh" /> Try again</button>
          <button type="button" className="qz-btn" onClick={loadDemo}><Icon name="science" /> Use demo mode</button>
        </div>
        <p className="qz-small">Demo mode uses a saved sample of 13 surahs from the same verified source, so you can practise offline.</p>
      </div>
    );
  } else if (questions && questions.length === 0) {
    body = kind === 'revision' ? (
      <div className="qz-state">
        <Icon name="task_alt" />
        <h2>Nothing to revise right now</h2>
        <p>Questions you miss are saved here and come back until you’ve answered them correctly twice in a row.</p>
        <Link href="/quiz" className="qz-btn primary">Choose a quiz</Link>
      </div>
    ) : (
      <div className="qz-state">
        <Icon name="search_off" />
        <h2>Not enough questions for this choice</h2>
        <p>Try another level, category or surah.</p>
        <Link href="/quiz" className="qz-btn primary">Back to quizzes</Link>
      </div>
    );
  } else if (finished) {
    body = (
      <Results
        answers={answers}
        revisionCount={progress ? Object.keys(progress.revision).length : 0}
        onRetryIncorrect={retryIncorrect}
        onRevision={() => router.push('/quiz/play?kind=revision&count=10')}
      />
    );
  } else if (q) {
    body = (
      <QuestionView
        key={`${roundKind}-${i}-${q.id}`}
        q={q}
        index={i}
        total={questions!.length}
        response={response}
        onResponse={setResponse}
        verdict={verdict}
        onSubmit={submit}
        onContinue={advance}
        isLast={i + 1 === questions!.length}
      />
    );
  }

  return (
    <div className="qz">
      <div className="qz-wrap narrow">
        <header className="qz-play-head">
          <Link href="/quiz" className="qz-back"><Icon name="arrow_back" /> Quran Quiz</Link>
          <div className="qz-play-title">
            <h1>{sessionTitle(roundKind)}</h1>
            {level && roundKind !== 'revision' && <span className="qz-chip gold">{level}</span>}
          </div>
        </header>
        {demo && (
          <p className="qz-demo" role="note">
            <Icon name="science" />
            <span><b>Demo mode</b> — an offline sample of 13 surahs saved from Quran.com. Connect to the internet for the full quiz.</span>
          </p>
        )}
        {body}
      </div>
    </div>
  );
}
