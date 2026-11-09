'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { VOCAB_BY_ID } from '../content/vocabulary';
import { greeting, keyToDate, lastSevenDays, monthGrid, msUntilTomorrow } from '../lib/dates';
import { describe, kindOf, KIND_LABEL, lessonForToday, lessonForTomorrow, refOf, wordOfTheDay } from '../lib/items';
import { buildSession } from '../lib/quiz';
import { computeStats } from '../lib/stats';
import { useLearn } from '../store/LearnProvider';
import { WordHead } from './cards';
import {
  IconArrow, IconCheck, IconChevron, IconChevronLeft, IconFlame, IconLock, IconNotebook, IconQuiz, IconRepeat, IconSpark,
} from './Icons';
import LessonPlayer from './LessonPlayer';
import Overlay from './Overlay';
import QuizRunner from './QuizRunner';
import { KindIcon } from './TrackIcon';
import { EmptyState, KindChip, Progress, Ready, SaveButton } from './ui';
import s from '../learn.module.css';

function Countdown() {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setMs(msUntilTomorrow(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  if (ms === null) return null;
  const p = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(ms / 36e5);
  const m = Math.floor((ms % 36e5) / 6e4);
  const sec = Math.floor((ms % 6e4) / 1000);
  return (
    <span className={s.countdown} role="timer" aria-label={`${h} hours and ${m} minutes`}>
      {p(h)}:{p(m)}:{p(sec)}
    </span>
  );
}

function Calendar({ days, learned, today }: { days: string[]; learned: Record<string, string>; today: string }) {
  const [offset, setOffset] = useState(0);
  const base = new Date(+today.slice(0, 4), +today.slice(5, 7) - 1 + offset, 1);
  const y = base.getFullYear();
  const m = base.getMonth();
  const active = new Set(days);
  const prefix = `${y}-${String(m + 1).padStart(2, '0')}-`;
  const count = days.filter(d => d.startsWith(prefix)).length;
  return (
    <section className={s.card} aria-labelledby="l1m-cal">
      <div className={s.cardHead}>
        <div>
          <h2 id="l1m-cal" className={s.cardTitle}>
            {base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h2>
          <p className={s.muted}>
            {count} {count === 1 ? 'day' : 'days'} of learning
          </p>
        </div>
        <div className={s.row}>
          <button type="button" className={s.iconBtnSm} onClick={() => setOffset(o => o - 1)} aria-label="Previous month">
            <IconChevronLeft className={s.i16} />
          </button>
          <button type="button" className={s.iconBtnSm} onClick={() => setOffset(o => Math.min(0, o + 1))} disabled={offset >= 0} aria-label="Next month">
            <IconChevron className={s.i16} />
          </button>
        </div>
      </div>
      <table className={s.cal}>
        <thead>
          <tr>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <th key={i} scope="col" abbr={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]}>
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(y, m).map(week => (
            <tr key={week[0].key}>
              {week.map(c => {
                const on = active.has(c.key);
                const lesson = learned[c.key] ? describe(learned[c.key])?.title : null;
                const label = `${keyToDate(c.key).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}: ${
                  on ? `learned${lesson ? ` — ${lesson}` : ''}` : c.key > today ? 'upcoming' : 'no learning'
                }`;
                return (
                  <td key={c.key}>
                    <span
                      className={[s.calDay, !c.inMonth && s.calOut, on && s.calOn, c.key === today && s.calToday, c.key > today && s.calFuture]
                        .filter(Boolean)
                        .join(' ')}
                      title={label}
                      aria-label={label}
                      role="img"
                    >
                      {on ? <IconCheck className={s.i14} /> : c.day}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function DashboardInner() {
  const { profile, data, clock, dispatch } = useLearn();
  const today = clock!.today;
  const now = clock!.now;
  const stats = useMemo(() => computeStats(data, today), [data, today]);
  const [lesson, setLesson] = useState<string | null>(null);
  const [quick, setQuick] = useState<number | null>(null);

  const todayId = lessonForToday(data.learned, today);
  const tomorrowId = lessonForTomorrow(data.learned, today);
  const todayInfo = describe(todayId);
  const done = stats.learnedToday;
  const wotd = wordOfTheDay(today);
  const week = lastSevenDays(today);
  const active = new Set(stats.days);

  const learnedWords = Object.keys(data.cards).filter(id => kindOf(id) === 'v').map(id => VOCAB_BY_ID[refOf(id)]).filter(Boolean);
  const quickQs = useMemo(
    () => (quick !== null && learnedWords.length >= 3 ? buildSession('mixed', learnedWords, 3, `quick:${today}:${quick}`) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quick],
  );
  const recentSaved = Object.entries(data.saved).sort((a, b) => (a[1] < b[1] ? 1 : -1)).slice(0, 4).map(([id]) => id);

  return (
    <div className={s.dash}>
      <header className={s.hero}>
        <div>
          <p className={s.eyebrow}>{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1 className={s.heroTitle}>
            {greeting(now.getHours())}, {profile?.name}.
          </h1>
          <p className={s.lead}>{done ? 'Today’s lesson is done. A short revision keeps it with you.' : 'Your one-minute lesson is ready.'}</p>
        </div>
        <div className={s.streakBadge} aria-label={`${stats.streak}-day learning streak`}>
          <IconFlame className={stats.streak ? s.flameOn : s.flameOff} />
          <strong>{stats.streak}</strong>
          <span>day streak</span>
        </div>
      </header>

      <section className={s.week} aria-label="Learning activity in the last seven days">
        {week.map(k => {
          const d = keyToDate(k);
          const on = active.has(k);
          return (
            <div key={k} className={s.weekDay}>
              <span className={s.weekName}>{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
              <span
                className={[s.weekDot, on && s.weekOn, k === today && s.weekToday].filter(Boolean).join(' ')}
                role="img"
                aria-label={`${d.toLocaleDateString(undefined, { weekday: 'long' })}: ${on ? 'learned' : 'no learning'}`}
              >
                {on ? <IconCheck className={s.i16} /> : d.getDate()}
              </span>
            </div>
          );
        })}
      </section>

      <div className={s.dashGrid}>
        <div className={s.col}>
          {/* today's lesson */}
          <section className={`${s.card} ${s.todayCard}`} aria-labelledby="l1m-today">
            <div className={s.cardHead}>
              <KindChip itemId={todayId} />
              <span className={done ? s.doneTag : s.muted}>
                {done ? (
                  <>
                    <IconCheck className={s.i14} /> Completed today
                  </>
                ) : (
                  'About 1 minute'
                )}
              </span>
            </div>
            <p className={s.todayAr} lang="ar" dir="rtl">
              {todayInfo?.arabic}
            </p>
            <h2 id="l1m-today" className={s.todayTitle}>
              {done || kindOf(todayId) !== 'v' ? todayInfo?.title : 'A word of the Qur’an'}
            </h2>
            {done && <p className={s.todaySub}>{todayInfo?.subtitle}</p>}
            <button type="button" className={done ? s.btnGhostWide : s.btnPrimaryWide} onClick={() => setLesson(todayId)}>
              {done ? 'Review today’s lesson' : 'Start today’s lesson'} <IconArrow className={s.i18} />
            </button>
            <div className={s.nextLesson}>
              <IconLock className={s.i16} />
              <span>
                {done ? (
                  <>
                    Next lesson in <Countdown />
                  </>
                ) : (
                  'Tomorrow'
                )}
                {' · '}a new {KIND_LABEL[kindOf(tomorrowId)].toLowerCase()} lesson
              </span>
              <KindIcon kind={kindOf(tomorrowId)} className={s.i16} />
            </div>
          </section>

          {/* word of the day */}
          <section className={s.card} aria-labelledby="l1m-wotd">
            <div className={s.cardHead}>
              <h2 id="l1m-wotd" className={s.cardTitle}>
                Word of the day
              </h2>
              <SaveButton itemId={`v:${wotd.id}`} />
            </div>
            <WordHead w={wotd} size="md" />
            <div className={s.wotdFacts}>
              <span>
                Root <b lang="ar">{wotd.root}</b>
              </span>
              <span>{wotd.occurrences.toLocaleString()}× in the Qur’an</span>
            </div>
            <Link href={`/learn-1-min/vocabulary?word=${wotd.id}`} className={s.textLink}>
              Examples and details <IconArrow className={s.i16} />
            </Link>
          </section>

          {/* progress */}
          <section className={s.card} aria-labelledby="l1m-progress">
            <div className={s.cardHead}>
              <div>
                <h2 id="l1m-progress" className={s.cardTitle}>
                  Your progress
                </h2>
                <p className={s.muted}>Words, duas and surahs you have learned</p>
              </div>
              <span className={s.bigPct}>{Math.round(stats.overall * 100)}%</span>
            </div>
            <Progress value={stats.overall} label="Overall progress" />
            <div className={s.moduleBars}>
              <Link href="/learn-1-min/vocabulary" className={s.moduleBar}>
                <span className={s.moduleName}>Qur’an vocabulary</span>
                <span className={s.moduleNum}>
                  {stats.vocab.learned} / {stats.vocab.total}
                </span>
                <Progress value={stats.vocab.learned / stats.vocab.total} label="Vocabulary learned" />
              </Link>
              <Link href="/learn-1-min/duas" className={s.moduleBar}>
                <span className={s.moduleName}>Daily duas</span>
                <span className={s.moduleNum}>
                  {stats.duas.learned} / {stats.duas.total}
                </span>
                <Progress value={stats.duas.learned / stats.duas.total} label="Duas learned" tone="gold" />
              </Link>
              <Link href="/learn-1-min/surahs" className={s.moduleBar}>
                <span className={s.moduleName}>Surahs</span>
                <span className={s.moduleNum}>
                  {stats.surahs.ayat} ayat · {stats.surahs.completed} complete
                </span>
                <Progress value={stats.surahs.learned / stats.surahs.total} label="Surahs learned" />
              </Link>
            </div>
          </section>

          {/* notebook */}
          <section className={s.card} aria-labelledby="l1m-notes">
            <div className={s.cardHead}>
              <h2 id="l1m-notes" className={s.cardTitle}>
                Notebook & favourites
              </h2>
              <Link href="/learn-1-min/notebook" className={s.textLink}>
                Open <IconArrow className={s.i16} />
              </Link>
            </div>
            {recentSaved.length ? (
              <ul className={s.miniList}>
                {recentSaved.map(id => {
                  const d = describe(id)!;
                  return (
                    <li key={id}>
                      <Link href={d.href} className={s.miniItem}>
                        <KindIcon kind={kindOf(id)} className={s.i16} />
                        <span className={s.miniText}>
                          <strong>{d.title}</strong>
                          <span>{data.notes[id]?.text ?? d.subtitle}</span>
                        </span>
                        <span className={s.miniAr} lang="ar" dir="rtl">
                          {d.arabic}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={<IconNotebook className={s.i20} />} title="Nothing saved yet" body="Tap the bookmark on any word, dua or surah to keep it here." />
            )}
          </section>
        </div>

        <div className={s.col}>
          <section className={s.statGrid} aria-label="Streaks">
            <div className={s.stat}>
              <IconFlame className={`${s.i20} ${s.flameOn}`} />
              <strong>{stats.streak}</strong>
              <span>Current streak</span>
            </div>
            <div className={s.stat}>
              <IconSpark className={`${s.i20} ${s.goldInk}`} />
              <strong>{stats.bestStreak}</strong>
              <span>Longest streak</span>
            </div>
            <div className={s.stat}>
              <IconCheck className={`${s.i20} ${s.primaryInk}`} />
              <strong>{stats.totalDays}</strong>
              <span>Days learned</span>
            </div>
          </section>

          <section className={`${s.card} ${s.reviewCard}`} aria-labelledby="l1m-rev">
            <div className={s.cardHead}>
              <h2 id="l1m-rev" className={s.cardTitle}>
                Revision
              </h2>
              <IconRepeat className={`${s.i20} ${s.primaryInk}`} />
            </div>
            <p className={s.reviewBig}>
              <strong>{stats.due.length}</strong> {stats.due.length === 1 ? 'word is' : 'words are'} due today
            </p>
            <p className={s.muted}>
              {stats.vocab.mastered} mastered · {stats.vocab.practice} need practice
            </p>
            <Link href="/learn-1-min/review" className={stats.due.length ? s.btnPrimary : s.btnGhost}>
              {stats.due.length ? 'Start revision' : 'Open revision'}
            </Link>
          </section>

          <section className={s.card} aria-labelledby="l1m-quick">
            <div className={s.cardHead}>
              <h2 id="l1m-quick" className={s.cardTitle}>
                Quick review quiz
              </h2>
              <IconQuiz className={`${s.i20} ${s.goldInk}`} />
            </div>
            <p className={s.muted}>
              {learnedWords.length >= 3
                ? 'Three questions on words you have learned. About 30 seconds.'
                : `Learn ${3 - learnedWords.length} more ${3 - learnedWords.length === 1 ? 'word' : 'words'} to unlock it.`}
            </p>
            <div className={s.row}>
              <button type="button" className={s.btnGhost} disabled={learnedWords.length < 3} onClick={() => setQuick(Date.now())}>
                Start quick quiz
              </button>
              <Link href="/learn-1-min/quiz" className={s.textLink}>
                {stats.quiz.dailyToday ? `Daily challenge: ${stats.quiz.dailyToday.score}/${stats.quiz.dailyToday.total}` : 'Daily challenge'}{' '}
                <IconArrow className={s.i16} />
              </Link>
            </div>
          </section>

          <Calendar days={stats.days} learned={data.learned} today={today} />
        </div>
      </div>

      {lesson && <LessonPlayer itemId={lesson} onClose={() => setLesson(null)} />}
      {quick !== null && (
        <Overlay label="Quick review quiz" onClose={() => setQuick(null)}>
          <div className={s.lessonCard}>
            <QuizRunner
              key={quick}
              questions={quickQs}
              title="Quick review"
              onClose={() => setQuick(null)}
              onAgain={() => setQuick(Date.now())}
              onFinish={r =>
                dispatch({ type: 'quiz', daily: false, result: { at: new Date().toISOString(), day: today, mode: 'quick', score: r.score, total: r.total } })
              }
            />
          </div>
        </Overlay>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Ready>
      <DashboardInner />
    </Ready>
  );
}
