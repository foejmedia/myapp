'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { LessonInfo } from '../lib/progress';
import { summary } from '../lib/progress';
import type { QaidaTracker } from '../lib/useQaidaTracker';

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function Ring({ pct }: { pct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg className="lqt-ring" viewBox="0 0 80 80" role="img" aria-label={`${Math.round(pct * 100)}% of the course`}>
      <circle cx="40" cy="40" r={r} className="lqt-ring-track" />
      <circle
        cx="40" cy="40" r={r}
        className="lqt-ring-fill"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="44" textAnchor="middle" className="lqt-ring-text">{Math.round(pct * 100)}%</text>
    </svg>
  );
}

function NameForm({ onSubmit, cta, autoFocus }: { onSubmit: (name: string) => boolean; cta: string; autoFocus?: boolean }) {
  const [name, setName] = useState('');
  return (
    <form
      className="lqt-name-form"
      onSubmit={e => {
        e.preventDefault();
        if (name.trim() && onSubmit(name)) setName('');
      }}
    >
      <input
        className="lqt-input"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Your name"
        maxLength={40}
        aria-label="Learner name"
        autoFocus={autoFocus}
      />
      <button type="submit" className="lqt-btn" disabled={!name.trim()}>{cta}</button>
    </form>
  );
}

export default function TrackerPanel({ tracker, lessons }: { tracker: QaidaTracker; lessons: LessonInfo[] }) {
  const { status, profile, profiles, progress, today, saveError } = tracker;
  const [menu, setMenu] = useState(false);
  const [adding, setAdding] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menuRef.current?.contains(e.target as Node)) {
        setMenu(false);
        setAdding(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [menu]);

  if (status === 'loading' || !today) return <div className="lqt-panel lqt-skeleton" aria-hidden="true" />;

  /* ── No learner chosen: pick or add a name ── */
  if (status === 'guest' || !profile) {
    return (
      <section className="lqt-panel lqt-welcome" aria-labelledby="lqt-who">
        <div className="lqt-welcome-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
        </div>
        <div className="lqt-welcome-body">
          <h2 id="lqt-who">Track your progress</h2>
          <p>Choose who is learning. Each person gets their own progress, streak and next lesson.</p>
          {profiles.length > 0 && (
            <div className="lqt-chips" role="list" aria-label="Learners on this device">
              {profiles.map(p => (
                <button key={p.id} type="button" role="listitem" className="lqt-chip" onClick={() => tracker.signIn(p.id)}>
                  <span className="lqt-avatar lqt-avatar-sm" aria-hidden="true">{p.name.slice(0, 1).toUpperCase()}</span>
                  {p.name}
                </button>
              ))}
            </div>
          )}
          <NameForm onSubmit={tracker.signUp} cta={profiles.length ? 'Add learner' : 'Start tracking'} />
          <p className="lqt-fineprint">Saved privately in this browser. No account or password needed.</p>
        </div>
      </section>
    );
  }

  const s = summary(progress, lessons, today);
  const nextPct = s.next ? Math.round(((progress.heard[String(s.next.id)]?.length ?? 0) / Math.max(1, s.next.total)) * 100) : 0;
  const allDone = lessons.length > 0 && s.completed === lessons.length;

  return (
    <section className="lqt-panel" aria-label={`${profile.name}'s progress`}>
      {/* header row */}
      <div className="lqt-head">
        <div className="lqt-who">
          <span className="lqt-avatar" aria-hidden="true">{profile.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <div className="lqt-greet">Assalamu alaikum,</div>
            <div className="lqt-name">{profile.name}</div>
          </div>
        </div>
        <div className="lqt-menu-wrap" ref={menuRef}>
          <button type="button" className="lqt-ghost" aria-expanded={menu} aria-haspopup="menu" onClick={() => setMenu(m => !m)}>
            Switch learner
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {menu && (
            <div className="lqt-menu" role="menu">
              {profiles.map(p => (
                <button
                  key={p.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={p.id === profile.id}
                  className={`lqt-menu-item ${p.id === profile.id ? 'is-current' : ''}`}
                  onClick={() => { tracker.signIn(p.id); setMenu(false); }}
                >
                  <span className="lqt-avatar lqt-avatar-sm" aria-hidden="true">{p.name.slice(0, 1).toUpperCase()}</span>
                  <span className="lqt-menu-name">{p.name}</span>
                  {p.id === profile.id && <span className="lqt-check" aria-hidden="true">✓</span>}
                </button>
              ))}
              <hr className="lq-divider" />
              {adding ? (
                <NameForm autoFocus cta="Add" onSubmit={n => { const ok = tracker.signUp(n); if (ok) { setAdding(false); setMenu(false); } return ok; }} />
              ) : (
                <button type="button" role="menuitem" className="lqt-menu-item" onClick={() => setAdding(true)}>
                  <span className="lqt-plus" aria-hidden="true">+</span> Add a learner
                </button>
              )}
              <button type="button" role="menuitem" className="lqt-menu-item lqt-muted" onClick={() => { tracker.signOut(); setMenu(false); }}>
                Browse without tracking
              </button>
            </div>
          )}
        </div>
      </div>

      {/* stats */}
      <div className="lqt-body">
        <Ring pct={s.pct} />
        <div className="lqt-stats">
          <div className="lqt-stat">
            <span className="lqt-stat-v">{s.completed}<small>/{lessons.length}</small></span>
            <span className="lqt-stat-l">Lessons done</span>
          </div>
          <div className="lqt-stat">
            <span className="lqt-stat-v">{s.practised}<small>/{s.totalItems}</small></span>
            <span className="lqt-stat-l">Items practised</span>
          </div>
          <div className="lqt-stat">
            <span className="lqt-stat-v">
              <span className={`lqt-flame ${s.streak ? 'is-on' : ''}`} aria-hidden="true">🔥</span>
              {s.streak}<small> day{s.streak === 1 ? '' : 's'}</small>
            </span>
            <span className="lqt-stat-l">Streak{s.bestStreak > s.streak ? ` · best ${s.bestStreak}` : ''}</span>
          </div>
        </div>
      </div>

      {/* week strip + continue */}
      <div className="lqt-foot">
        <div className="lqt-week" aria-label="Practice this week">
          {s.week.map(d => {
            const wd = WEEKDAY[new Date(d.day + 'T12:00').getDay()];
            return (
              <div key={d.day} className={`lqt-day ${d.count ? 'is-active' : ''} ${d.day === today ? 'is-today' : ''}`} title={`${d.day}: ${d.count} practised`}>
                <span className="lqt-day-dot">{d.count ? '✓' : ''}</span>
                <span className="lqt-day-l">{wd}</span>
              </div>
            );
          })}
        </div>

        {allDone ? (
          <div className="lqt-continue lqt-finished">
            <div>
              <div className="lqt-continue-l">Course complete · MashaAllah!</div>
              <div className="lqt-continue-t">All {lessons.length} lessons finished. Keep revising any lesson below.</div>
            </div>
          </div>
        ) : s.next ? (
          <Link href={`/learn-quran/lesson/${s.next.id}`} className="lqt-continue">
            <div>
              <div className="lqt-continue-l">{nextPct > 0 ? 'Continue' : 'Up next'} · Lesson {s.next.id}</div>
              <div className="lqt-continue-t">{s.next.title}</div>
              <div className="lqt-bar" aria-hidden="true"><span style={{ width: `${nextPct}%` }} /></div>
            </div>
            <span className="lqt-continue-go" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </Link>
        ) : null}
      </div>

      {saveError && <p className="lqt-error" role="alert">Progress could not be saved — this browser is blocking storage.</p>}
    </section>
  );
}
