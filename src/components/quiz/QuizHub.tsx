'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LANGS, SOURCES, langInfo, type Chapter } from '@/lib/quiz/content';
import { MODES, modeTitle, sessionTitle, type Mode, type SessionKind } from '@/lib/quiz/engine';
import {
  accuracy, clearProgress, dayKey, emptyProgress, loadProgress, saveProgress, suggestLevel, weakModes,
  type Prefs, type Progress,
} from '@/lib/quiz/progress';
import { Icon } from './QuestionView';
import { TargetArt, TrophyArt } from '@/learn1min/components/Illustrations';
import './quiz.css';

const LEVEL_INFO: { id: Prefs['level']; label: string; hint: string }[] = [
  { id: 'auto', label: 'Personalised', hint: 'Follows your results' },
  { id: 'beginner', label: 'Beginner', hint: 'Short, familiar surahs' },
  { id: 'intermediate', label: 'Intermediate', hint: 'Longer passages' },
  { id: 'advanced', label: 'Advanced', hint: 'Longer surahs, harder recall' },
];
const COUNTS = [5, 10, 15];
/** icon tile colours for the quiz types, as on the Learn in 1 Minute dashboard */
const TONES = ['blue', 'orange', 'green', 'gold'] as const;
const pct = (n: number | null) => (n == null ? '—' : `${Math.round(n * 100)}%`);

export default function QuizHub() {
  const [p, setP] = useState<Progress | null>(null);
  const [focus, setFocus] = useState<number | ''>('');
  const [chapters, setChapters] = useState<Chapter[] | null>(null);

  useEffect(() => { setP(loadProgress()); }, []);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch('/api/quiz/chapters', { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setChapters(d.chapters))
      .catch(() => { if (!ctrl.signal.aborted) setChapters([]); });
    return () => ctrl.abort();
  }, []);

  const progress = p ?? emptyProgress();
  const prefs = progress.prefs;
  const setPrefs = (patch: Partial<Prefs>) => {
    const next = { ...progress, prefs: { ...prefs, ...patch } };
    setP(next);
    saveProgress(next);
  };

  const suggestion = suggestLevel(progress);
  const today = progress.daily[dayKey()];
  const revisionCount = Object.keys(progress.revision).length;
  const weak = weakModes(progress);

  const href = (kind: SessionKind) => {
    const qs = new URLSearchParams({ kind, level: prefs.level, lang: prefs.lang, count: String(prefs.count) });
    if (focus && kind !== 'daily' && kind !== 'revision') qs.set('surah', String(focus));
    return `/quiz/play?${qs}`;
  };

  const reset = () => {
    if (!window.confirm('Clear all quiz progress and revision questions on this device?')) return;
    clearProgress();
    setP({ ...emptyProgress(), prefs });
    saveProgress({ ...emptyProgress(), prefs });
  };

  const answeredToday = today ? `${today.correct}/${today.total}` : null;

  return (
    <div className="qz">
      <div className="qz-wrap">
        {/* ── header, like a Learn in 1 Minute module page ── */}
        <header className="qz-head">
          <div>
            <p className="qz-kicker">Quran Quiz <span lang="ar" dir="rtl">تَعَلَّمِ الْقُرْآنَ</span></p>
            <h1>Quizzes</h1>
            <p className="qz-head-sub">Learn ayahs, surahs, translations and vocabulary, then revise what you miss.</p>
          </div>
          {p && progress.total.answered > 0 && (
            <span className="qz-badge">
              <Icon name="target" /> {pct(accuracy(progress.total))} accuracy
            </span>
          )}
        </header>

        {/* ── illustrated cards: today's challenge and revision ── */}
        <div className="qz-hero-cards">
          <Link href={href('daily')} className="qz-ill peach">
            <TargetArt className="qz-ill-art" />
            <span className="qz-ill-body">
              <span className="qz-ill-kicker">Daily Quran Challenge</span>
              <b className="qz-ill-title">{today ? 'Done for today, mashaAllah' : 'Five questions picked for your level'}</b>
              <span className="qz-ill-row">
                <strong>{answeredToday ?? '0/5'}</strong>
                <span>{today ? 'Practise again any time' : 'Takes about two minutes'}</span>
              </span>
              <span className="qz-coral" aria-hidden="true"><i style={{ width: today ? `${(today.correct / Math.max(1, today.total)) * 100}%` : '0%' }} /></span>
            </span>
          </Link>

          {revisionCount > 0 ? (
            <Link href={href('revision')} className="qz-ill yellow">
              <TrophyArt className="qz-ill-art trophy" />
              <span className="qz-ill-body">
                <span className="qz-ill-kicker">Revision</span>
                <b className="qz-ill-title">{revisionCount} question{revisionCount === 1 ? '' : 's'} to review</b>
                <span className="qz-ill-sub">The ones you missed come back until you get them right.</span>
                <span className="qz-ill-cta">Start revision <Icon name="arrow_forward" /></span>
              </span>
            </Link>
          ) : (
            <div className="qz-ill yellow is-empty">
              <TrophyArt className="qz-ill-art trophy" dim />
              <span className="qz-ill-body">
                <span className="qz-ill-kicker">Revision</span>
                <b className="qz-ill-title">Nothing to revise yet</b>
                <span className="qz-ill-sub">Questions you miss will appear here, ready to practise again.</span>
              </span>
            </div>
          )}
        </div>

        {/* ── quiz types ── */}
        <section aria-labelledby="qz-modes-h">
          <h2 id="qz-modes-h" className="qz-h2">Choose a quiz</h2>
          <div className="qz-modes">
            <Link href={href('mixed')} className="qz-mode">
              <span className="qz-mode-top">
                <span className="qz-tile green"><Icon name="shuffle" /></span>
                <span className="qz-pill green">Recommended</span>
              </span>
              <b>{sessionTitle('mixed')}</b>
              <small>A bit of everything</small>
            </Link>
            {MODES.map((m, i) => {
              const t = progress.byMode[m.id];
              const tone = TONES[i % TONES.length];
              return (
                <Link key={m.id} href={href(m.id)} className="qz-mode">
                  <span className="qz-mode-top">
                    <span className={`qz-tile ${tone}`}><Icon name={m.icon} /></span>
                    {weak.includes(m.id)
                      ? <span className="qz-pill orange">Practise</span>
                      : t?.answered ? <span className="qz-pill gray">{pct(accuracy(t))}</span> : null}
                  </span>
                  <b>{m.title}</b>
                  <small>{m.blurb}</small>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── settings ── */}
        <section className="qz-card qz-setup" aria-labelledby="qz-setup-h">
          <div className="qz-card-head">
            <h2 id="qz-setup-h" className="qz-h2 in-card"><Icon name="tune" /> Quiz settings</h2>
            {prefs.level === 'auto' && p && <span className="qz-pill blue">Now: {suggestion.level}</span>}
          </div>
          <div className="qz-field">
            <span className="qz-label">Level</span>
            <div className="qz-seg-group" role="radiogroup" aria-label="Level">
              {LEVEL_INFO.map(l => (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={prefs.level === l.id}
                  className={prefs.level === l.id ? 'is-on' : ''}
                  onClick={() => setPrefs({ level: l.id })}
                >
                  <b>{l.label}</b><small>{l.hint}</small>
                </button>
              ))}
            </div>
            {prefs.level === 'auto' && p && (
              <p className="qz-small"><Icon name="route" /> {suggestion.reason}</p>
            )}
          </div>

          <div className="qz-field-row">
            <label className="qz-field">
              <span className="qz-label">Questions</span>
              <select value={prefs.count} onChange={e => setPrefs({ count: Number(e.target.value) })}>
                {COUNTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="qz-field">
              <span className="qz-label">Translation &amp; meanings</span>
              <select value={prefs.lang} onChange={e => setPrefs({ lang: e.target.value as Prefs['lang'] })}>
                {LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </label>
            <label className="qz-field">
              <span className="qz-label">Focus on a surah</span>
              <select value={focus} onChange={e => setFocus(e.target.value ? Number(e.target.value) : '')} disabled={!chapters?.length}>
                <option value="">{chapters == null ? 'Loading…' : chapters.length ? 'Any surah for my level' : 'Unavailable offline'}</option>
                {chapters?.map(c => <option key={c.id} value={c.id}>{c.id}. {c.nameSimple} ({c.versesCount} ayahs)</option>)}
              </select>
            </label>
          </div>
        </section>

        {/* ── progress ── */}
        <section className="qz-card" aria-labelledby="qz-prog-h">
          <div className="qz-card-head">
            <h2 id="qz-prog-h" className="qz-h2 in-card"><Icon name="insights" /> Score &amp; performance</h2>
          </div>
          {!p ? (
            <div className="qz-skel" aria-busy="true" />
          ) : progress.total.answered === 0 ? (
            <div className="qz-empty">
              <b>No quiz results yet</b>
              <span>Finish a quiz and your scores appear here.</span>
            </div>
          ) : (
            <>
              <dl className="qz-stats">
                <div className="tone-green"><dt>Answered</dt><dd>{progress.total.answered}</dd></div>
                <div className="tone-blue"><dt>Accuracy</dt><dd>{pct(accuracy(progress.total))}</dd></div>
                <div className="tone-gold"><dt>Sessions</dt><dd>{progress.sessions.length}</dd></div>
                <div className="tone-orange"><dt>To revise</dt><dd>{revisionCount}</dd></div>
              </dl>
              <h3 className="qz-h3">By category</h3>
              <ul className="qz-cats">
                {(Object.entries(progress.byMode) as [Mode, { answered: number; correct: number }][]).map(([m, t]) => (
                  <li key={m}>
                    <span>{modeTitle(m)}</span>
                    <span className="qz-meter" aria-hidden="true"><i style={{ width: `${(t.correct / t.answered) * 100}%` }} /></span>
                    <b>{pct(accuracy(t))}</b>
                  </li>
                ))}
              </ul>
              {progress.sessions.length > 0 && (
                <>
                  <h3 className="qz-h3">Recent sessions</h3>
                  <ul className="qz-recent">
                    {progress.sessions.slice(0, 5).map(s => (
                      <li key={s.at}>
                        <span>{sessionTitle(s.kind)} <small>· {s.level}</small></span>
                        <span>{s.correct}/{s.total}</span>
                        <time dateTime={new Date(s.at).toISOString()}>{new Date(s.at).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</time>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <button type="button" className="qz-link danger" onClick={reset}><Icon name="delete" /> Reset progress</button>
            </>
          )}
        </section>

        <footer className="qz-foot">
          <p>Quran text: {SOURCES.text}. Translation: {langInfo(prefs.lang).translation}. Word meanings: {SOURCES.words}. {SOURCES.audio}.</p>
          <p>Questions are generated from this verified text — every answer is checked against the source.</p>
        </footer>
      </div>
    </div>
  );
}
