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
import './quiz.css';

const LEVEL_INFO: { id: Prefs['level']; label: string; hint: string }[] = [
  { id: 'auto', label: 'Personalised', hint: 'Follows your results' },
  { id: 'beginner', label: 'Beginner', hint: 'Short, familiar surahs' },
  { id: 'intermediate', label: 'Intermediate', hint: 'Longer passages' },
  { id: 'advanced', label: 'Advanced', hint: 'Longer surahs, harder recall' },
];
const COUNTS = [5, 10, 15];
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

  return (
    <div className="qz">
      <div className="qz-wrap">
        <header className="qz-head">
          <p className="qz-head-ar" lang="ar" dir="rtl">تَعَلَّمِ الْقُرْآنَ</p>
          <h1>Quran Quiz</h1>
          <p>Learn ayahs, surahs, translations and vocabulary — and revise what you’ve learned.</p>
        </header>

        <section className="qz-card qz-setup" aria-labelledby="qz-setup-h">
          <h2 id="qz-setup-h" className="qz-sr">Quiz settings</h2>
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
              <p className="qz-small"><Icon name="route" /> Now: <b>{suggestion.level}</b>. {suggestion.reason}</p>
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

        <div className="qz-feature">
          <Link href={href('daily')} className="qz-card qz-daily">
            <span className="qz-feature-icon"><Icon name="wb_sunny" /></span>
            <span className="qz-feature-body">
              <b>Daily Quran Challenge</b>
              <small>{today ? `Done today — ${today.correct}/${today.total}. Practise again anytime.` : 'Five questions picked for your level'}</small>
            </span>
            <Icon name="chevron_right" />
          </Link>
          {revisionCount > 0 ? (
            <Link href={href('revision')} className="qz-card qz-revise">
              <span className="qz-feature-icon"><Icon name="history" /></span>
              <span className="qz-feature-body">
                <b>Revision</b>
                <small>{revisionCount} question{revisionCount === 1 ? '' : 's'} to review</small>
              </span>
              <Icon name="chevron_right" />
            </Link>
          ) : (
            <div className="qz-card qz-revise is-empty">
              <span className="qz-feature-icon"><Icon name="history" /></span>
              <span className="qz-feature-body">
                <b>Revision</b>
                <small>Questions you miss will appear here.</small>
              </span>
            </div>
          )}
        </div>

        <section aria-labelledby="qz-modes-h">
          <h2 id="qz-modes-h" className="qz-h2">Choose a quiz</h2>
          <div className="qz-modes">
            <Link href={href('mixed')} className="qz-mode is-mixed">
              <Icon name="shuffle" />
              <b>{sessionTitle('mixed')}</b>
              <small>A bit of everything</small>
            </Link>
            {MODES.map(m => (
              <Link key={m.id} href={href(m.id)} className="qz-mode">
                <Icon name={m.icon} />
                <b>{m.title}</b>
                <small>{m.blurb}</small>
                {weak.includes(m.id) && <span className="qz-chip gold">Practise</span>}
              </Link>
            ))}
          </div>
        </section>

        <section className="qz-card" aria-labelledby="qz-prog-h">
          <h2 id="qz-prog-h" className="qz-h2 in-card">Your learning</h2>
          {!p ? (
            <div className="qz-skel" aria-busy="true" />
          ) : progress.total.answered === 0 ? (
            <p className="qz-small">Your progress will appear here after your first quiz.</p>
          ) : (
            <>
              <dl className="qz-stats">
                <div><dt>Answered</dt><dd>{progress.total.answered}</dd></div>
                <div><dt>Accuracy</dt><dd>{pct(accuracy(progress.total))}</dd></div>
                <div><dt>Sessions</dt><dd>{progress.sessions.length}</dd></div>
                <div><dt>To revise</dt><dd>{revisionCount}</dd></div>
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
