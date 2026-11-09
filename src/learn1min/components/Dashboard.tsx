'use client';
/**
 * Dashboard: cream centre column + "My journey" rail.
 * Illustrated goal / achievement cards and interactive charts — every number comes from saved progress.
 */
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CHAPTERS, chapter } from '../content/chapters';
import { VOCAB_BY_ID, meaningVerse } from '../content/vocabulary';
import { achievements } from '../lib/achievements';
import { recentActivity, relativeTime, type ActivityKind } from '../lib/activity';
import { keyToDate, lastSevenDays, monthGrid, msUntilTomorrow } from '../lib/dates';
import { describe, kindOf, KIND_LABEL, lessonForToday, lessonForTomorrow, refOf, wordOfTheDay } from '../lib/items';
import { buildSession } from '../lib/quiz';
import { computeStats } from '../lib/stats';
import { useLearn } from '../store/LearnProvider';
import { ExampleAyah } from './cards';
import { ActivityBars, Gauge, RadialRings, type Ring } from './charts';
import {
  IconArrow, IconBookmark, IconCheck, IconChevron, IconChevronLeft, IconFlame, IconNotebook, IconPencil, IconQuiz, IconRepeat,
  IconSearch, IconSpark, IconSurah,
} from './Icons';
import { BookArt, TargetArt, TrophyArt } from './Illustrations';
import LessonPlayer from './LessonPlayer';
import Overlay from './Overlay';
import QuizRunner from './QuizRunner';
import { openSearch } from './Search';
import { KindIcon } from './TrackIcon';
import { AudioButton, EmptyState, Ready, SaveButton } from './ui';
import s from '../learn.module.css';

const TOTAL_AYAT = CHAPTERS.reduce((n, c) => n + c.versesCount, 0);

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
  return (
    <span role="timer" aria-label={`${h} hours and ${m} minutes`}>
      {p(h)}:{p(m)}:{p(Math.floor((ms % 6e4) / 1000))}
    </span>
  );
}

function MiniCalendar({ days, learned, today }: { days: string[]; learned: Record<string, string>; today: string }) {
  const [offset, setOffset] = useState(0);
  const base = new Date(+today.slice(0, 4), +today.slice(5, 7) - 1 + offset, 1);
  const y = base.getFullYear();
  const m = base.getMonth();
  const active = new Set(days);
  return (
    <div className={s.miniCal}>
      <div className={s.rowBetween}>
        <strong className={s.railTitle}>{base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong>
        <div className={s.row}>
          <button type="button" className={s.iconBtnSm} onClick={() => setOffset(o => o - 1)} aria-label="Previous month">
            <IconChevronLeft className={s.i14} />
          </button>
          <button type="button" className={s.iconBtnSm} onClick={() => setOffset(o => Math.min(0, o + 1))} disabled={offset >= 0} aria-label="Next month">
            <IconChevron className={s.i14} />
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
                      className={[s.calDay, !c.inMonth && s.calOut, on && s.calOn, c.key === today && s.calToday, c.key > today && s.calFuture].filter(Boolean).join(' ')}
                      title={label}
                      aria-label={label}
                      role="img"
                    >
                      {on ? <IconCheck className={s.i12} /> : c.day}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ACTIVITY_ICON: Record<ActivityKind, { icon: React.ReactNode; tone: string }> = {
  lesson: { icon: <IconCheck className={s.i18} />, tone: s.tileGreen },
  learned: { icon: <IconSpark className={s.i18} />, tone: s.tileGreen },
  quiz: { icon: <IconQuiz className={s.i18} />, tone: s.tileOrange },
  saved: { icon: <IconBookmark className={s.i18} filled />, tone: s.tileGold },
  note: { icon: <IconPencil className={s.i18} />, tone: s.tileBlue },
};

function DashboardInner() {
  const { data, clock, dispatch } = useLearn();
  const today = clock!.today;
  const now = clock!.now;
  const router = useRouter();
  const params = useSearchParams();
  const stats = useMemo(() => computeStats(data, today), [data, today]);
  const ach = useMemo(() => achievements(stats, data), [stats, data]);
  const [lesson, setLesson] = useState<string | null>(null);
  const [quick, setQuick] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [allAch, setAllAch] = useState(false);

  const todayId = lessonForToday(data.learned, today);
  const tomorrowId = lessonForTomorrow(data.learned, today);
  const todayInfo = describe(todayId);
  const tomorrowInfo = describe(tomorrowId);
  const done = stats.learnedToday;
  const wotd = wordOfTheDay(today);
  const wotdSurah = chapter(Number(meaningVerse(wotd).split(':')[0]));
  const week = lastSevenDays(today);
  const active = new Set(stats.days);
  const activity = useMemo(() => recentActivity(data, showAll ? 15 : 4), [data, showAll]);
  const learnedWords = Object.keys(data.cards).filter(id => kindOf(id) === 'v').map(id => VOCAB_BY_ID[refOf(id)]).filter(Boolean);
  const quickQs = useMemo(
    () => (quick !== null && learnedWords.length >= 3 ? buildSession('mixed', learnedWords, 3, `quick:${today}:${quick}`) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quick],
  );
  const recentSaved = Object.entries(data.saved).sort((a, b) => (a[1] < b[1] ? 1 : -1)).slice(0, 3).map(([id]) => id);
  const surahInProgress = CHAPTERS.find(c => {
    const n = data.ayat[String(c.id)]?.length ?? 0;
    return n > 0 && n < c.versesCount;
  });
  const latestNote = Object.entries(data.notes).sort((a, b) => (a[1].updatedAt < b[1].updatedAt ? 1 : -1))[0];
  const daily = stats.quiz.dailyToday;
  const wk = stats.week;
  const goalRatio = Math.min(1, wk.activeThisWeek / wk.goal);
  const avg = wk.total / 7;
  const delta = wk.total - wk.prev7Total;

  const rings: Ring[] = [
    { key: 'v', label: 'Vocabulary', value: stats.vocab.learned / stats.vocab.total, detail: `${stats.vocab.learned} of ${stats.vocab.total} words`, color: '#22c55e' },
    { key: 'm', label: 'Mastered', value: stats.vocab.mastered / stats.vocab.total, detail: `${stats.vocab.mastered} words mastered`, color: '#2dd4bf' },
    { key: 'd', label: 'Duas', value: stats.duas.learned / stats.duas.total, detail: `${stats.duas.learned} of ${stats.duas.total} duas`, color: '#f59e0b' },
    { key: 'a', label: 'Ayat', value: stats.surahs.ayat / TOTAL_AYAT, detail: `${stats.surahs.ayat} of ${TOTAL_AYAT.toLocaleString()} ayat`, color: '#7dd3fc' },
    { key: 'q', label: 'Quiz accuracy', value: stats.quiz.accuracy ?? 0, detail: stats.quiz.sessions ? `${stats.quiz.sessions} quiz sessions` : 'No quizzes yet', color: '#f0475f' },
  ];

  // ?start=lesson (from the sidebar card) opens today's lesson
  useEffect(() => {
    if (params?.get('start') === 'lesson') {
      setLesson(todayId);
      router.replace('/learn-1-min', { scroll: false });
    }
  }, [params, todayId, router]);

  return (
    <div className={s.dashLayout}>
      <div className={s.dashMain}>
        <header className={s.welcomeRow}>
          <div>
            <h1 className={s.welcomeH}>Dashboard</h1>
            <p className={s.muted}>{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <span className={s.softBadge}>
            <IconFlame className={s.i16} /> {stats.streak}-day streak
          </span>
        </header>

        {/* illustrated goal + achievement */}
        <div className={s.heroCards}>
          <section className={`${s.illCard} ${s.illPeach}`} aria-labelledby="l1m-goal">
            <TargetArt className={s.illArtTarget} />
            <div className={s.illBody}>
              <p className={s.illKicker}>Weekly goal</p>
              <h2 id="l1m-goal" className={s.illTitle}>
                Learn on {wk.goal} days this week
              </h2>
              <div className={s.goalRow}>
                <strong className={s.goalPct}>{Math.round(goalRatio * 100)}%</strong>
                <span className={s.muted}>
                  {goalRatio >= 1 ? 'Goal reached — MashaAllah' : `${wk.activeThisWeek} of ${wk.goal} days`}
                </span>
              </div>
              <div className={s.coralBar} role="progressbar" aria-label="Weekly goal" aria-valuemin={0} aria-valuemax={wk.goal} aria-valuenow={wk.activeThisWeek}>
                <span style={{ width: `${goalRatio * 100}%` }} />
              </div>
            </div>
          </section>
          <section className={`${s.illCard} ${s.illYellow}`} aria-labelledby="l1m-ach">
            <TrophyArt className={s.illArtTrophy} dim={!ach.latest} />
            <div className={s.illBody}>
              <p className={s.illKicker}>{ach.latest ? 'Latest achievement' : 'First achievement'}</p>
              <h2 id="l1m-ach" className={s.illTitle}>
                {ach.latest ? ach.latest.title : 'One lesson away'}
              </h2>
              <p className={s.muted}>
                {ach.latest ? `${ach.earned.length} of ${ach.all.length} unlocked` : 'Complete today’s lesson to unlock it.'}
              </p>
            </div>
          </section>
        </div>

        {/* three feature cards */}
        <div className={s.featureRow}>
          <button type="button" className={s.featureCard} onClick={() => setLesson(todayId)}>
            <span className={s.featureTop}>
              <span className={`${s.tile} ${s.tileBlue}`}>
                <KindIcon kind={kindOf(todayId)} className={s.i20} />
              </span>
              <span className={`${s.pill} ${done ? s.pillGreen : s.pillBlue}`}>{done ? 'Done' : 'Start'}</span>
            </span>
            <strong>Today’s lesson</strong>
            <span className={s.featureSub}>
              {KIND_LABEL[kindOf(todayId)]} · {todayInfo?.title}
            </span>
          </button>
          <Link href="/learn-1-min/review" className={s.featureCard}>
            <span className={s.featureTop}>
              <span className={`${s.tile} ${s.tileGreen}`}>
                <IconRepeat className={s.i20} />
              </span>
              <span className={`${s.pill} ${s.pillGreen}`}>{stats.due.length ? 'Due' : 'Up to date'}</span>
            </span>
            <strong>Revision</strong>
            <span className={s.featureSub}>
              {stats.due.length} {stats.due.length === 1 ? 'word' : 'words'} due · {stats.vocab.mastered} mastered
            </span>
          </Link>
          <Link href="/learn-1-min/quiz" className={s.featureCard}>
            <span className={s.featureTop}>
              <span className={`${s.tile} ${s.tileOrange}`}>
                <IconSpark className={s.i20} />
              </span>
              <span className={`${s.pill} ${s.pillOrange}`}>{daily ? `${daily.score}/${daily.total}` : 'Today'}</span>
            </span>
            <strong>Daily challenge</strong>
            <span className={s.featureSub}>{daily ? 'Completed — play again for practice' : 'Five questions, about a minute'}</span>
          </Link>
        </div>

        {/* learning progress: rings + gauge + activity */}
        <section aria-labelledby="l1m-lp" className={s.lpSection}>
          <h2 id="l1m-lp" className={s.lpTitle}>
            Learning progress
          </h2>
          <div className={s.lpGrid}>
            <div className={s.ringsCard}>
              <RadialRings
                rings={rings}
                center={{ label: 'Overall', value: `${Math.round(stats.overall * 100)}%`, detail: 'words, duas & surahs' }}
              />
            </div>
            <div className={s.lpSide}>
              <div className={s.chartCard}>
                <div className={s.rowBetween}>
                  <p className={s.chartTitle}>Quiz accuracy</p>
                  <span className={s.selectLike}>All time</span>
                </div>
                <Gauge
                  value={stats.quiz.accuracy}
                  label="Quiz accuracy"
                  left={['Sessions', String(stats.quiz.sessions)]}
                  right={['Words learned', String(stats.vocab.learned)]}
                />
                <button type="button" className={s.btnGhostSm} disabled={learnedWords.length < 3} onClick={() => setQuick(Date.now())}>
                  <IconQuiz className={s.i14} /> {learnedWords.length >= 3 ? 'Quick review quiz' : `Learn ${3 - learnedWords.length} more words to quiz`}
                </button>
              </div>
              <div className={s.chartCard}>
                <div className={s.rowBetween}>
                  <p className={s.chartTitle}>Learning activity</p>
                  <span className={s.selectLike}>Last 7 days</span>
                </div>
                <p className={s.chartKicker}>Average per day</p>
                <p className={s.chartBig}>
                  {avg.toFixed(1)} actions{' '}
                  {delta !== 0 && (
                    <span className={delta > 0 ? s.deltaUp : s.deltaDown}>
                      {delta > 0 ? '↑' : '↓'} {Math.abs(delta)} vs last week
                    </span>
                  )}
                </p>
                <ActivityBars days={wk.last7} unit={['action', 'actions']} />
              </div>
            </div>
          </div>
        </section>

        {/* word of the day */}
        <section className={s.reflection} aria-labelledby="l1m-wotd">
          <div className={s.rowBetween}>
            <h2 id="l1m-wotd" className={s.sectionH}>
              Word of the day
            </h2>
            <span className={s.badgeInline}>
              <IconSpark className={s.i14} /> Changes daily
            </span>
          </div>
          <div className={s.reflectionBody}>
            <div className={s.reflectionAr}>
              <p lang="ar" dir="rtl">
                {wotd.form}
              </p>
              <AudioButton src={wotd.audio} label={`pronunciation of ${wotd.translit}`} />
            </div>
            <p className={s.reflectionQuote}>
              “{wotd.meaning}” <span>· {wotd.translit}</span>
            </p>
            <p className={s.reflectionRef}>{wotdSurah ? `Surah ${wotdSurah.nameSimple} (${meaningVerse(wotd)})` : meaningVerse(wotd)}</p>
          </div>
          <div className={s.insight}>
            <span className={`${s.tile} ${s.tileGreenSolid}`} aria-hidden>
              <IconSurah className={s.i18} />
            </span>
            <div className={s.insightBody}>
              <strong>Root & usage</strong>
              <p>
                From the root <b lang="ar">{wotd.root}</b> (dictionary form <b lang="ar">{wotd.lemma}</b>). Words of this form occur{' '}
                {wotd.occurrences.toLocaleString()} times in the Qur’an.
              </p>
              {wotd.examples[0] && <ExampleAyah ex={wotd.examples[0]} />}
              <div className={s.row}>
                <SaveButton itemId={`v:${wotd.id}`} withText />
                <Link href={`/learn-1-min/vocabulary?word=${wotd.id}`} className={s.textLink}>
                  All examples <IconArrow className={s.i16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* recent activity */}
        <section className={s.panelCard} aria-labelledby="l1m-activity">
          <div className={s.rowBetween}>
            <h2 id="l1m-activity" className={s.sectionH}>
              Recent activity
            </h2>
            {activity.length >= 4 && (
              <button type="button" className={s.linkBtn} onClick={() => setShowAll(v => !v)} aria-expanded={showAll}>
                {showAll ? 'Show less' : 'View all'}
              </button>
            )}
          </div>
          {activity.length === 0 ? (
            <EmptyState title="No activity yet" body="Complete today’s lesson and it will appear here." />
          ) : (
            <ul className={s.activityList}>
              {activity.map((a, i) => {
                const meta = ACTIVITY_ICON[a.kind];
                const body = (
                  <>
                    <span className={`${s.tile} ${meta.tone}`}>{meta.icon}</span>
                    <span className={s.activityText}>
                      <strong>{a.title}</strong>
                      <span>{a.detail}</span>
                    </span>
                    <time className={s.activityTime} dateTime={a.at}>
                      {relativeTime(a, now)}
                    </time>
                  </>
                );
                return (
                  <li key={`${a.kind}-${a.at}-${i}`}>
                    {a.href ? (
                      <Link href={a.href} className={s.activityRow}>
                        {body}
                      </Link>
                    ) : (
                      <div className={s.activityRow}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* My journey rail */}
      <aside className={s.journey} aria-label="My journey">
        <div className={s.rowBetween}>
          <h2 className={s.journeyH}>My journey</h2>
          <button type="button" className={s.linkBtn} onClick={() => setAllAch(v => !v)} aria-expanded={allAch}>
            {allAch ? 'Hide' : 'See all'}
          </button>
        </div>

        {allAch && (
          <ul className={s.achList} aria-label="All achievements">
            {ach.all.map(a => (
              <li key={a.id} className={a.earned ? s.achOn : s.achOff}>
                <span className={s.achIcon} aria-hidden>
                  {a.earned ? <IconCheck className={s.i14} /> : `${Math.round(a.ratio * 100)}%`}
                </span>
                <span>
                  <strong>{a.title}</strong>
                  <small>{a.earned ? 'Unlocked' : `${a.desc} · ${a.current} of ${a.target}`}</small>
                </span>
              </li>
            ))}
          </ul>
        )}

        {ach.next && (
          <div className={s.jCard}>
            <p className={s.jLabel}>Next milestone</p>
            <p className={s.jTitle}>{ach.next.title}</p>
            <p className={s.jSub}>{ach.next.desc}</p>
            <div className={s.jRow}>
              <strong>{Math.round(ach.next.ratio * 100)}%</strong>
              <span>
                {ach.next.current} of {ach.next.target}
              </span>
            </div>
            <div className={s.coralBar}>
              <span style={{ width: `${ach.next.ratio * 100}%` }} />
            </div>
          </div>
        )}

        <Link href={surahInProgress ? `/learn-1-min/surahs/${surahInProgress.id}` : '/learn-1-min/surahs/1'} className={s.jCard}>
          <p className={s.jLabel}>{surahInProgress ? 'In progress' : 'Start a surah'}</p>
          <p className={s.jTitleLg}>Surah {surahInProgress?.nameSimple ?? 'Al-Fatihah'}</p>
          {(() => {
            const c = surahInProgress ?? CHAPTERS[0];
            const n = data.ayat[String(c.id)]?.length ?? 0;
            return (
              <>
                <div className={s.jRow}>
                  <strong>{Math.round((n / c.versesCount) * 100)}%</strong>
                  <span>
                    {n} of {c.versesCount} ayat
                  </span>
                </div>
                <div className={s.coralBar}>
                  <span style={{ width: `${(n / c.versesCount) * 100}%` }} />
                </div>
              </>
            );
          })()}
        </Link>

        <div className={s.jCard}>
          <div className={s.rowBetween}>
            <p className={s.jLabel}>Latest note</p>
            <span className={s.chipDots} aria-hidden>
              <i className={s.tileGreen}>
                <IconPencil className={s.i12} />
              </i>
              <i className={s.tileGold}>
                <IconBookmark className={s.i12} filled />
              </i>
              <i className={s.tileBlue}>
                <IconSpark className={s.i12} />
              </i>
            </span>
          </div>
          {latestNote ? (
            <>
              <div className={s.noteHead}>
                <span className={`${s.tile} ${s.tileGreen}`}>
                  <KindIcon kind={kindOf(latestNote[0])} className={s.i18} />
                </span>
                <span>
                  <strong>{describe(latestNote[0])?.title}</strong>
                  <small>{KIND_LABEL[kindOf(latestNote[0])]}</small>
                </span>
              </div>
              <p className={s.noteQuote}>{latestNote[1].text}</p>
              <Link href={describe(latestNote[0])?.href ?? '/learn-1-min/notebook'} className={s.textLinkSm}>
                Read more <IconArrow className={s.i14} />
              </Link>
            </>
          ) : (
            <p className={s.jSub}>Add a personal note to any word, dua or surah — your latest one appears here.</p>
          )}
        </div>

        <div className={s.nextCard}>
          <BookArt className={s.nextArt} />
          <p className={s.nextLabel}>{done ? 'Next lesson' : 'Today’s lesson'}</p>
          <p className={s.nextTitle}>{(done ? tomorrowInfo : todayInfo)?.title}</p>
          <div className={s.nextMeta}>
            <span>
              <IconSpark className={s.i14} /> {done ? (
                <>
                  in <Countdown />
                </>
              ) : (
                'Ready now'
              )}
            </span>
            <span>
              <KindIcon kind={kindOf(done ? tomorrowId : todayId)} className={s.i14} /> {KIND_LABEL[kindOf(done ? tomorrowId : todayId)]} · 1 min
            </span>
          </div>
          {done ? (
            <Link href="/learn-1-min/flashcards" className={s.nextBtn}>
              Practise with flashcards
            </Link>
          ) : (
            <button type="button" className={s.nextBtn} onClick={() => setLesson(todayId)}>
              Start practice
            </button>
          )}
        </div>

        <div className={s.infoBox}>
          <p className={s.infoTitle}>
            <IconFlame className={s.i16} /> Your stats
          </p>
          <ul>
            <li>Current streak: {stats.streak} {stats.streak === 1 ? 'day' : 'days'}</li>
            <li>Longest streak: {stats.bestStreak} {stats.bestStreak === 1 ? 'day' : 'days'}</li>
            <li>Days learned: {stats.totalDays}</li>
            <li>Achievements: {ach.earned.length} of {ach.all.length}</li>
          </ul>
        </div>

        <div className={s.jCard}>
          <p className={s.jLabel}>This week</p>
          <div className={s.weekMini}>
            {week.map(k => {
              const d = keyToDate(k);
              const on = active.has(k);
              return (
                <span key={k} className={s.weekMiniDay}>
                  <small>{d.toLocaleDateString(undefined, { weekday: 'narrow' })}</small>
                  <span
                    className={[s.weekDot, on && s.weekOn, k === today && s.weekToday].filter(Boolean).join(' ')}
                    role="img"
                    aria-label={`${d.toLocaleDateString(undefined, { weekday: 'long' })}: ${on ? 'learned' : 'no learning'}`}
                  >
                    {on ? <IconCheck className={s.i12} /> : d.getDate()}
                  </span>
                </span>
              );
            })}
          </div>
          <MiniCalendar days={stats.days} learned={data.learned} today={today} />
        </div>

        <div className={s.jCard}>
          <div className={s.rowBetween}>
            <p className={s.jLabel}>Favourites</p>
            <Link href="/learn-1-min/notebook" className={s.textLinkSm}>
              View all
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
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={s.railEmpty}>
              <IconNotebook className={s.i16} /> Bookmark words, duas or surahs to see them here.
            </p>
          )}
        </div>

        <button type="button" className={s.railSearch} onClick={openSearch}>
          <span>Search words, duas, surahs…</span>
          <IconSearch className={s.i18} />
        </button>
      </aside>

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
              onFinish={r => dispatch({ type: 'quiz', daily: false, result: { at: new Date().toISOString(), day: today, mode: 'quick', score: r.score, total: r.total } })}
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
