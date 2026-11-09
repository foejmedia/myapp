'use client';
import { useEffect, useMemo, useState } from 'react';
import { TRACK_LABEL, type Lesson, type Track } from '../lib/lessons';
import {
  dayKey, lessonForToday, lessonForTomorrow, monthGrid, msUntilTomorrow, streaks, weekStrip,
} from '../lib/progress';
import { shuffle } from '../lib/random';
import { useLearn, useToday } from '../useLearn';
import { IconBookmark, IconCheck, IconChevron, IconFlame, IconLock, IconRepeat, IconSpark } from './Icons';
import LessonPlayer from './LessonPlayer';
import { TrackIcon } from './TrackIcon';
import s from '../learn.module.css';

const greeting = (h: number) => (h < 5 ? 'Peaceful night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');

function Countdown({ to }: { to: 'tomorrow' }) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setMs(msUntilTomorrow(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [to]);
  if (ms === null) return null;
  const h = Math.floor(ms / 36e5);
  const m = Math.floor((ms % 36e5) / 6e4);
  const sec = Math.floor((ms % 6e4) / 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    <span className={s.countdown} aria-label={`${h} hours ${m} minutes`}>
      {p(h)}:{p(m)}:{p(sec)}
    </span>
  );
}

function Calendar({ learned, today, lessonsById }: { learned: Record<string, string>; today: string; lessonsById: Map<string, Lesson> }) {
  const [offset, setOffset] = useState(0);
  const base = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1 + offset, 1);
  const y = base.getFullYear();
  const m = base.getMonth();
  const weeks = monthGrid(y, m);
  const prefix = `${y}-${String(m + 1).padStart(2, '0')}-`;
  const count = Object.keys(learned).filter(k => k.startsWith(prefix)).length;
  const elapsed = offset < 0 ? new Date(y, m + 1, 0).getDate() : Number(today.slice(8, 10));
  return (
    <section className={s.panel} aria-labelledby="l1-cal">
      <div className={s.panelHead}>
        <div>
          <h2 id="l1-cal" className={s.panelTitle}>
            {base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h2>
          <p className={s.muted}>
            {count} of {elapsed} {elapsed === 1 ? 'day' : 'days'} learned
          </p>
        </div>
        <div className={s.navBtns}>
          <button type="button" className={s.iconBtn} onClick={() => setOffset(o => o - 1)} aria-label="Previous month">
            <IconChevron dir="left" className={s.icon18} />
          </button>
          <button type="button" className={s.iconBtn} onClick={() => setOffset(o => Math.min(0, o + 1))} disabled={offset >= 0} aria-label="Next month">
            <IconChevron className={s.icon18} />
          </button>
        </div>
      </div>
      <div className={s.calGrid} role="grid" aria-label="Days learned this month">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className={s.calHead} aria-hidden>
            {d}
          </span>
        ))}
        {weeks.flat().map(c => {
          const id = learned[c.key];
          const l = id ? lessonsById.get(id) : undefined;
          const future = c.key > today;
          const label = `${new Date(c.key + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}: ${
            id ? `learned ${l?.title ?? ''}` : future ? 'upcoming' : 'not learned'
          }`;
          return (
            <span
              key={c.key}
              role="gridcell"
              aria-label={label}
              title={label}
              className={[
                s.calDay,
                !c.inMonth && s.calOut,
                id && s.calDone,
                id && l && s[`calDone_${l.track}`],
                c.key === today && s.calToday,
                future && s.calFuture,
              ].filter(Boolean).join(' ')}
            >
              {id ? <IconCheck className={s.calCheck} /> : c.day}
            </span>
          );
        })}
      </div>
      <div className={s.legend}>
        {(['word', 'dua', 'surah'] as Track[]).map(t => (
          <span key={t}>
            <i className={`${s.legendDot} ${s[`dot_${t}`]}`} /> {TRACK_LABEL[t]}
          </span>
        ))}
      </div>
    </section>
  );
}

function Notebook({
  items, saved, onToggleSave,
}: { items: { day: string; lesson: Lesson }[]; saved: string[]; onToggleSave: (id: string) => void }) {
  const [filter, setFilter] = useState<'all' | Track | 'saved'>('all');
  const [open, setOpen] = useState<string | null>(null);
  const shown = items.filter(i => (filter === 'all' ? true : filter === 'saved' ? saved.includes(i.lesson.id) : i.lesson.track === filter));
  return (
    <section className={s.panel} aria-labelledby="l1-notebook">
      <div className={s.panelHead}>
        <div>
          <h2 id="l1-notebook" className={s.panelTitle}>
            Your notebook
          </h2>
          <p className={s.muted}>Everything you have learned, ready to revisit.</p>
        </div>
      </div>
      <div className={s.filters} role="group" aria-label="Filter notebook">
        {(['all', 'word', 'dua', 'surah', 'saved'] as const).map(f => (
          <button key={f} type="button" className={filter === f ? s.filterOn : s.filter} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'saved' ? 'Favourites' : f === 'word' ? 'Words' : f === 'dua' ? 'Duas' : 'Surahs'}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className={s.empty}>
          {items.length === 0 ? 'Your first card appears here after today’s lesson.' : 'Nothing here yet.'}
        </p>
      ) : (
        <ul className={s.cards}>
          {shown.map(({ day, lesson: l }) => {
            const isOpen = open === l.id;
            return (
              <li key={l.id} className={`${s.noteCard} ${s[`noteCard_${l.track}`]}`}>
                <button type="button" className={s.noteMain} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : l.id)}>
                  <span className={s.noteTop}>
                    <TrackIcon track={l.track} className={s.icon16} />
                    <span>{new Date(day + 'T12:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                  </span>
                  {l.arabic && (
                    <span className={l.track === 'dua' ? s.noteArabicSmall : s.noteArabic} lang="ar" dir="rtl">
                      {l.arabic}
                    </span>
                  )}
                  <span className={s.noteTitle}>{l.track === 'word' ? l.transliteration : l.title}</span>
                  <span className={isOpen ? s.noteMeaningOpen : s.noteMeaning}>{l.meaning}</span>
                  {isOpen && l.note && <span className={s.noteExtra}>{l.note}</span>}
                  {isOpen && l.ref && <span className={s.noteRef}>{l.ref}</span>}
                </button>
                <button
                  type="button"
                  className={s.saveBtn}
                  aria-pressed={saved.includes(l.id)}
                  aria-label={saved.includes(l.id) ? `Remove ${l.title} from favourites` : `Add ${l.title} to favourites`}
                  onClick={() => onToggleSave(l.id)}
                >
                  <IconBookmark className={s.icon18} filled={saved.includes(l.id)} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function LearnApp({ lessons }: { lessons: Lesson[] }) {
  const { state, storageOk, markLearned, toggleSaved, addReviews } = useLearn();
  const clock = useToday();
  const [player, setPlayer] = useState<null | { mode: 'lesson' | 'review'; lessons: Lesson[] }>(null);
  const lessonsById = useMemo(() => new Map(lessons.map(l => [l.id, l])), [lessons]);

  const ready = !!state && !!clock;
  const learned = state?.learned ?? {};
  const today = clock?.today ?? '';
  const todayLesson = ready ? lessonForToday(lessons, learned, today) : lessons[0];
  const tomorrow = ready ? lessonForTomorrow(lessons, learned, today) : lessons[1];
  const doneToday = !!learned[today];
  const st = ready ? streaks(learned, today) : { current: 0, best: 0 };
  const week = ready ? weekStrip(learned, today) : [];
  const totalDays = Object.keys(learned).length;
  const explored = new Set(Object.values(learned)).size;
  const notebook = useMemo(
    () =>
      Object.entries(learned)
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .map(([day, id]) => ({ day, lesson: lessonsById.get(id) }))
        .filter((x): x is { day: string; lesson: Lesson } => !!x.lesson),
    [learned, lessonsById],
  );

  const startReview = () => {
    const pool = notebook.map(n => n.lesson);
    setPlayer({ mode: 'review', lessons: shuffle(pool, `${today}:${state?.reviews ?? 0}`).slice(0, 3) });
  };

  return (
    <div className={s.root}>
      <div className={s.wrap}>
        <header className={s.hero}>
          <div>
            <p className={s.kicker}>
              {clock ? clock.now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) : ' '}
            </p>
            <h1 className={s.h1}>
              {clock ? `${greeting(clock.now.getHours())}.` : ' '}
              <span>Learn something new in one minute.</span>
            </h1>
          </div>
          <div className={s.streakBadge} aria-label={`Current streak ${st.current} days`}>
            <IconFlame className={st.current > 0 ? s.flameOn : s.flameOff} />
            <strong>{st.current}</strong>
            <span>day streak</span>
          </div>
        </header>

        {!storageOk && (
          <p className={s.warn} role="status">
            This browser is not saving your progress. It will be lost when the tab closes.
          </p>
        )}

        <div className={s.weekStrip} aria-label="The last seven days">
          {week.map(d => {
            const date = new Date(d.key + 'T12:00');
            return (
              <div key={d.key} className={s.weekDay}>
                <span className={s.weekName}>{date.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                <span
                  className={[s.weekDot, d.done && s.weekDone, d.isToday && s.weekToday].filter(Boolean).join(' ')}
                  aria-label={`${date.toLocaleDateString(undefined, { weekday: 'long' })}: ${d.done ? 'learned' : 'not yet'}`}
                  role="img"
                >
                  {d.done ? <IconCheck className={s.icon14} /> : date.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        <div className={s.grid}>
          <div className={s.colMain}>
            {/* Today */}
            <section className={`${s.today} ${s[`today_${todayLesson.track}`]}`} aria-labelledby="l1-today">
              <div className={s.todayTop}>
                <span className={`${s.chip} ${s[`chip_${todayLesson.track}`]}`}>
                  <TrackIcon track={todayLesson.track} className={s.chipIcon} /> {TRACK_LABEL[todayLesson.track]}
                </span>
                <span className={s.muted}>{doneToday ? 'Completed today' : 'Today · about 1 minute'}</span>
              </div>
              {todayLesson.arabic && (
                <p className={todayLesson.track === 'dua' ? s.todayArabicDua : s.todayArabic} lang="ar" dir="rtl">
                  {todayLesson.arabic}
                </p>
              )}
              <h2 id="l1-today" className={s.todayTitle}>
                {doneToday ? (todayLesson.track === 'word' ? `${todayLesson.transliteration}: ${todayLesson.meaning}` : todayLesson.title) : todayLesson.track === 'word' ? 'What does this word mean?' : todayLesson.title}
              </h2>
              {doneToday ? (
                <div className={s.todayDone}>
                  <span className={s.doneMark}>
                    <IconCheck className={s.icon18} /> Learned
                  </span>
                  <button type="button" className={s.secondary} onClick={() => setPlayer({ mode: 'lesson', lessons: [todayLesson] })}>
                    Review today&apos;s lesson
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={s.startBtn}
                  disabled={!ready}
                  onClick={() => setPlayer({ mode: 'lesson', lessons: [todayLesson] })}
                >
                  <span className={s.startRing} aria-hidden>
                    1:00
                  </span>
                  Start today&apos;s lesson
                </button>
              )}
            </section>

            {/* Tomorrow */}
            <section className={s.tomorrow} aria-label="Tomorrow's lesson">
              <span className={s.lockIcon}>
                <IconLock className={s.icon18} />
              </span>
              <div>
                <p className={s.tomorrowLabel}>
                  {doneToday ? 'Next lesson unlocks in' : 'Tomorrow'} {doneToday && ready && <Countdown to="tomorrow" />}
                </p>
                <p className={s.tomorrowTitle}>
                  A new {TRACK_LABEL[tomorrow.track].toLowerCase()} is waiting for you
                </p>
              </div>
              <span className={`${s.chip} ${s[`chip_${tomorrow.track}`]}`}>
                <TrackIcon track={tomorrow.track} className={s.chipIcon} />
              </span>
            </section>

            {/* Stats */}
            <section className={s.stats} aria-label="Your progress">
              <div className={s.stat}>
                <IconFlame className={`${s.statIcon} ${s.statFlame}`} />
                <strong>{st.current}</strong>
                <span>Current streak</span>
              </div>
              <div className={s.stat}>
                <IconSpark className={`${s.statIcon} ${s.statGold}`} />
                <strong>{st.best}</strong>
                <span>Best streak</span>
              </div>
              <div className={s.stat}>
                <IconCheck className={`${s.statIcon} ${s.statTeal}`} />
                <strong>{totalDays}</strong>
                <span>Days learned</span>
              </div>
              <div className={s.stat}>
                <IconBookmark className={`${s.statIcon} ${s.statIndigo}`} filled />
                <strong>{state?.saved.length ?? 0}</strong>
                <span>Favourites</span>
              </div>
            </section>

            <section className={s.panel} aria-labelledby="l1-path">
              <div className={s.panelHead}>
                <div>
                  <h2 id="l1-path" className={s.panelTitle}>
                    Your learning path
                  </h2>
                  <p className={s.muted}>
                    {explored} of {lessons.length} lessons · words, duas and surahs
                  </p>
                </div>
                <span className={s.pct}>{Math.round((explored / lessons.length) * 100)}%</span>
              </div>
              <div className={s.pathBar} role="progressbar" aria-valuemin={0} aria-valuemax={lessons.length} aria-valuenow={explored}>
                <span style={{ width: `${Math.max(1.5, (explored / lessons.length) * 100)}%` }} />
              </div>
              <div className={s.trackRow}>
                {(['word', 'dua', 'surah'] as Track[]).map(t => {
                  const total = lessons.filter(l => l.track === t).length;
                  const done = notebook.filter(n => n.lesson.track === t).length;
                  return (
                    <div key={t} className={s.trackStat}>
                      <TrackIcon track={t} className={`${s.icon18} ${s[`ink_${t}`]}`} />
                      <span>
                        <strong>{done}</strong> / {total}
                      </span>
                      <small>{t === 'word' ? 'Words' : t === 'dua' ? 'Duas' : 'Surahs'}</small>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className={s.colSide}>
            {ready && <Calendar learned={learned} today={today} lessonsById={lessonsById} />}

            <section className={s.reviewCard} aria-labelledby="l1-review">
              <IconRepeat className={s.reviewIcon} />
              <div>
                <h2 id="l1-review" className={s.panelTitle}>
                  Quick review
                </h2>
                <p className={s.muted}>
                  {notebook.length >= 3
                    ? 'Three questions from what you have learned. About 30 seconds.'
                    : `Unlocks after ${3 - notebook.length} more ${3 - notebook.length === 1 ? 'lesson' : 'lessons'}.`}
                </p>
              </div>
              <button type="button" className={s.secondary} disabled={notebook.length < 3} onClick={startReview}>
                Start
              </button>
            </section>
          </div>
        </div>

        {ready && <Notebook items={notebook} saved={state!.saved} onToggleSave={toggleSaved} />}

        <p className={s.footnote}>
          Your progress stays on this device. Duas and surah notes come from this site&apos;s collections; word examples are quoted
          with their ayah.
        </p>
      </div>

      {player && state && clock && (
        <LessonPlayer
          key={`${player.mode}:${player.lessons.map(l => l.id).join(',')}`}
          mode={player.mode}
          lessons={player.lessons}
          dayNumber={doneToday ? totalDays : totalDays + 1}
          streak={doneToday ? st.current : st.current + 1}
          saved={state.saved}
          onLearned={l => markLearned(dayKey(new Date()), l.id)}
          onToggleSave={toggleSaved}
          onReviewed={addReviews}
          onClose={() => setPlayer(null)}
        />
      )}
    </div>
  );
}
