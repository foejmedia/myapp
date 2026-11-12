'use client';
/**
 * Homepage preview (/home-v2): a second design for the Learn Quran homepage.
 * Warm cream page, white cards, bold flat colour blocks and pill buttons.
 * It carries its own header and footer, so the live homepage (src/app/page.tsx) is untouched.
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronRight, Flame, Menu, X } from 'lucide-react';
import { SOCIALS } from '@/community/config';
import { dayKey, streaks } from '@/learn1min/lib/dates';
import { Icon, LogoMark, type IconName } from './icons';
import s from './home.module.css';

type Group = 'read' | 'learn' | 'listen' | 'daily';
type Item = { group: Group; icon: IconName; label: string; sub: string; href: string };

const FILTERS: { key: 'all' | Group; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'read', label: 'Read' },
  { key: 'learn', label: 'Learn' },
  { key: 'listen', label: 'Listen' },
  { key: 'daily', label: 'Daily' },
];

const ITEMS: Item[] = [
  { group: 'read', icon: 'read', label: 'Read Quran', sub: '114 surahs', href: '/read-quran/1' },
  { group: 'read', icon: 'mushaf', label: 'Mushaf', sub: '604 pages', href: '/quran-pages' },
  { group: 'read', icon: 'wbw', label: 'Word by Word', sub: 'Every word explained', href: '/read-quran/1?mode=word-by-word' },
  { group: 'read', icon: 'tafseer', label: 'Tafseer', sub: 'Ayah explanations', href: '/tafseer' },
  { group: 'read', icon: 'search', label: 'Search Quran', sub: 'Find any ayah by topic', href: '/search-quran' },
  { group: 'learn', icon: 'learn', label: 'Learn Quran', sub: 'Structured lessons from Alif', href: '/learn-quran' },
  { group: 'learn', icon: 'hifz', label: 'Hifz Program', sub: 'Smart spaced repetition', href: '/memorize-quran' },
  { group: 'learn', icon: 'tajweed', label: 'Tajweed', sub: 'Rules of recitation', href: '/tajweed' },
  { group: 'learn', icon: 'quiz', label: 'Quran Quiz', sub: 'Revise ayahs, surahs and words', href: '/quiz' },
  { group: 'learn', icon: 'library', label: 'Library', sub: 'Free Islamic books', href: '/books' },
  { group: 'listen', icon: 'player', label: 'Quran Player', sub: 'Renowned reciters', href: '/quran-player' },
  { group: 'listen', icon: 'radio', label: 'Quran Radio', sub: 'Live channels 24/7', href: '/radio' },
  { group: 'listen', icon: 'headphones', label: 'Translation Audio', sub: 'Each ayah in your language', href: '/translation-audio' },
  { group: 'listen', icon: 'watch', label: 'Watch', sub: 'Recitations, lectures and kids', href: '/video-gallery' },
  { group: 'daily', icon: 'dua', label: 'Duas', sub: 'Supplications for every moment', href: '/dua' },
  { group: 'daily', icon: 'hadith', label: 'Hadith', sub: 'The Prophet’s ﷺ sayings', href: '/hadees' },
  { group: 'daily', icon: 'mosque', label: 'Mosques Near You', sub: 'Nearby mosques and directions', href: '/mosques' },
  { group: 'daily', icon: 'schedule', label: 'My Schedule', sub: 'Plan your day around the prayers', href: '/my-schedule' },
];

const NAV = [
  { label: 'Read', href: '/read-quran/1' },
  { label: 'Learn', href: '/learn-quran' },
  { label: 'Listen', href: '/quran-player' },
  { label: 'Prayer', href: '/namaz-tracker' },
  { label: 'Community', href: '/community' },
];

/* The first four surahs, as they appear in the reader */
const SURAHS = [
  { n: 1, name: 'Al-Fatihah', note: 'The Opening · 7 ayahs' },
  { n: 2, name: 'Al-Baqarah', note: 'The Cow · 286 ayahs' },
  { n: 3, name: 'Aal-Imran', note: 'Family of Imran · 200 ayahs' },
  { n: 4, name: 'An-Nisa', note: 'The Women · 176 ayahs' },
];

const STEPS = [
  { title: 'Choose a surah', text: '114 surahs, page by page or word by word', href: '/read-quran/1' },
  { title: 'Listen and understand', text: 'Reciters, Tajweed and Tafseer', href: '/quran-player' },
  { title: 'Memorize and track', text: 'Daily Hifz plan with a streak', href: '/memorize-quran' },
];

const DAILY: { icon: IconName; tone: string; title: string; text: string; href: string }[] = [
  { icon: 'namaz', tone: s.tileBlush, title: 'Namaz Tracker', text: 'Log your five prayers and qaza', href: '/namaz-tracker' },
  { icon: 'tasbih', tone: s.tileYellow, title: 'Tasbeeh Garden', text: 'Every count plants a flower', href: '/tasbih' },
  { icon: 'qibla', tone: s.tilePlum, title: 'Qibla Compass', text: 'Find the direction of the Kaaba', href: '/qibla' },
];

const FOOT: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Read',
    links: [
      { label: 'Read Quran', href: '/read-quran/1' },
      { label: 'Mushaf', href: '/quran-pages' },
      { label: 'Word by Word', href: '/read-quran/1?mode=word-by-word' },
      { label: 'Tafseer', href: '/tafseer' },
      { label: 'Search Quran', href: '/search-quran' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'Learn Quran', href: '/learn-quran' },
      { label: 'Learn in 1 Minute', href: '/learn-1-min' },
      { label: 'Hifz Program', href: '/memorize-quran' },
      { label: 'Tajweed', href: '/tajweed' },
      { label: 'Quran Quiz', href: '/quiz' },
      { label: 'Library', href: '/books' },
    ],
  },
  {
    title: 'Listen',
    links: [
      { label: 'Quran Player', href: '/quran-player' },
      { label: 'Quran Radio', href: '/radio' },
      { label: 'Translation Audio', href: '/translation-audio' },
      { label: 'Watch', href: '/video-gallery' },
    ],
  },
  {
    title: 'Daily',
    links: [
      { label: 'Duas', href: '/dua' },
      { label: 'Hadith', href: '/hadees' },
      { label: 'Namaz Tracker', href: '/namaz-tracker' },
      { label: 'Tasbeeh Garden', href: '/tasbih' },
      { label: 'Qibla Compass', href: '/qibla' },
      { label: 'Mosques Near You', href: '/mosques' },
      { label: 'My Schedule', href: '/my-schedule' },
    ],
  },
  {
    title: 'More',
    links: [
      { label: 'Community', href: '/community' },
      { label: 'Log in', href: '/login' },
      { label: 'Sign up', href: '/signup' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

/** The visitor's real Learn in 1 Minute streak, read from this browser (same source as the live homepage) */
function readStreak(): number | null {
  try {
    const profiles = JSON.parse(localStorage.getItem('l1m:profiles') ?? 'null') as { current: string | null } | null;
    if (!profiles?.current) return null;
    const data = JSON.parse(localStorage.getItem(`l1m:data:${profiles.current}`) ?? 'null') as {
      learned?: Record<string, string>;
      activity?: Record<string, number>;
    } | null;
    if (!data) return null;
    const days = new Set([
      ...Object.keys(data.learned ?? {}),
      ...Object.entries(data.activity ?? {})
        .filter(([, n]) => n > 0)
        .map(([k]) => k),
    ]);
    return streaks(days, dayKey(new Date())).current;
  } catch {
    return null;
  }
}

export default function HomeV2() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | Group>('all');
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => setStreak(readStreak()), []);

  const shown = filter === 'all' ? ITEMS : ITEMS.filter(i => i.group === filter);

  return (
    <div className={s.root}>
      <header className={`${s.top}${scrolled ? ` ${s.topUp}` : ''}`}>
        <Link href="/community" className={s.strip}>
          <b>New</b>
          <span>
            The Learn Quran Community is open<span className={s.stripMore}>. Find a circle at your level</span>
          </span>
          <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
        </Link>

        <div className={s.bar}>
          <div className={`${s.wrap} ${s.barIn}`}>
            <Link href="/home-v2" className={s.brand} aria-label="Learn Quran, home">
              <LogoMark />
              <span>Learn Quran</span>
            </Link>

            <nav className={s.nav} aria-label="Main">
              {NAV.map(n => (
                <Link key={n.label} href={n.href} className={s.navLink}>
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className={s.barEnd}>
              <Link href="/login" className={`${s.btn} ${s.btnGhost} ${s.btnSm} ${s.login}`}>
                Log in
              </Link>
              <Link href="/signup" className={`${s.btn} ${s.btnDark} ${s.btnSm}`}>
                Sign up
              </Link>
              <button
                type="button"
                className={s.burger}
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                aria-controls="hv-menu"
                onClick={() => setOpen(o => !o)}
              >
                {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {open && (
            <nav id="hv-menu" className={s.menu} aria-label="Main, mobile">
              {NAV.map(n => (
                <Link key={n.label} href={n.href} className={s.menuLink} onClick={() => setOpen(false)}>
                  {n.label}
                  <ChevronRight size={18} aria-hidden="true" />
                </Link>
              ))}
              <Link href="/login" className={s.menuLink} onClick={() => setOpen(false)}>
                Log in
                <ChevronRight size={18} aria-hidden="true" />
              </Link>
            </nav>
          )}
        </div>
      </header>

      <div className={s.wrap}>
        {/* ---------- hero ---------- */}
        <section className={s.hero} aria-labelledby="hv-title">
          <h1 id="hv-title" className={s.display}>
            Learn the Quran, <span className={s.mark}>a little</span> every day.
          </h1>
          <p className={s.lede}>
            Read, listen, memorize and understand. Everything in one place: free, in your browser, at your own pace.
          </p>
          <div className={s.actions}>
            <Link href="/read-quran/1" className={`${s.btn} ${s.btnBlue}`}>
              Start reading
              <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
            </Link>
            <a href="#explore" className={`${s.btn} ${s.btnGhost}`}>
              See everything
            </a>
          </div>
        </section>

        <div className={s.duo}>
          <article className={`${s.feat} ${s.featRead}`}>
            <span className={s.discA} aria-hidden="true" />
            <svg className={s.crescent} viewBox="0 0 60 60" aria-hidden="true">
              <path d="M38 6a25 25 0 1 0 16 32A20 20 0 0 1 38 6z" />
            </svg>
            <div className={s.featText}>
              <p className={s.chip}>Read</p>
              <h2 className={s.featTitle}>The whole Quran, always open</h2>
              <p className={s.featBody}>
                114 surahs, page by page or word by word. Start with <span className={s.nb}>Al-Fatihah</span>, the seven ayahs that begin every prayer.
              </p>
              <Link href="/read-quran/1" className={`${s.btn} ${s.btnLight}`}>
                Open the Quran
                <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </div>
            <div className={s.featArt} aria-hidden="true">
              <div className={s.phone}>
                <div className={s.phoneBar}>
                  <i />
                  <b>Surahs</b>
                  <i />
                </div>
                <div className={s.bism} />
                <ul className={s.surahs}>
                  {SURAHS.map(x => (
                    <li key={x.n}>
                      <i>{x.n}</i>
                      <span>
                        <b>{x.name}</b>
                        <small>{x.note}</small>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          <article className={`${s.feat} ${s.featMinute}`}>
            <span className={s.discB} aria-hidden="true" />
            <div className={s.featText}>
              <p className={s.chip}>One minute a day</p>
              <h2 className={s.featTitle}>Learn in 1 minute</h2>
              <p className={s.featBody}>
                The words of the Qur’an, daily duas and surahs in one minute a day, with flashcards, quizzes and revision.
              </p>
              <Link href="/learn-1-min" className={`${s.btn} ${s.btnDark} ${s.btnOnColor}`}>
                Take one minute
                <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </div>
            <div className={s.featArt} aria-hidden="true">
              <div className={s.lesson}>
                <svg className={s.ring} viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" className={s.ringTrack} />
                  <circle cx="60" cy="60" r="50" className={s.ringFill} pathLength="100" />
                  <text x="60" y="58" className={s.ringNum}>
                    1:00
                  </text>
                  <text x="60" y="78" className={s.ringUnit}>
                    minute
                  </text>
                </svg>
                <div className={s.tags}>
                  <span>Words</span>
                  <span>Duas</span>
                  <span>Surahs</span>
                </div>
                <div className={s.streak}>
                  <Flame size={16} strokeWidth={2.4} />
                  {streak && streak > 0 ? `${streak}-day streak` : 'Start your streak today'}
                </div>
              </div>
            </div>
          </article>
        </div>

        {/* ---------- everything, by filter ---------- */}
        <section id="explore" className={s.section} aria-labelledby="hv-explore">
          <div className={s.head}>
            <div>
              <h2 id="hv-explore" className={s.title}>
                What would you like to do today?
              </h2>
              <p className={s.sub}>Pick a path. Everything opens straight away, with nothing to install.</p>
            </div>
            <div className={s.pills} role="group" aria-label="Show">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  type="button"
                  className={filter === f.key ? `${s.pill} ${s.pillOn}` : s.pill}
                  aria-pressed={filter === f.key}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <ul className={s.cats}>
            {shown.map(i => (
              <li key={i.label}>
                <Link href={i.href} className={s.cat}>
                  <Icon name={i.icon} />
                  <span className={s.catText}>
                    <b>{i.label}</b>
                    <small>{i.sub}</small>
                  </span>
                  <ChevronRight className={s.chev} size={20} strokeWidth={2.2} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- three steps ---------- */}
        <section className={s.section} aria-labelledby="hv-steps">
          <div className={s.head}>
            <div>
              <p className={s.kicker}>Start your journey</p>
              <h2 id="hv-steps" className={s.title}>
                Begin in three steps
              </h2>
            </div>
          </div>
          <ol className={s.steps}>
            {STEPS.map((st, i) => (
              <li key={st.title}>
                <Link href={st.href} className={s.step}>
                  <span className={s.stepNum}>{i + 1}</span>
                  <span className={s.stepText}>
                    <b>{st.title}</b>
                    <small>{st.text}</small>
                  </span>
                  <span className={s.stepGo} aria-hidden="true">
                    <ArrowRight size={18} strokeWidth={2.4} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- through the day ---------- */}
        <section className={s.section} aria-labelledby="hv-daily">
          <div className={s.head}>
            <div>
              <h2 id="hv-daily" className={s.title}>
                Through your day
              </h2>
              <p className={s.sub}>Small tools for the five prayers and the moments between them.</p>
            </div>
          </div>
          <ul className={s.trio}>
            {DAILY.map(d => (
              <li key={d.title}>
                <Link href={d.href} className={`${s.tile} ${d.tone}`}>
                  <span className={s.tileTop}>
                    <Icon name={d.icon} size={76} />
                    <span className={s.tileGo} aria-hidden="true">
                      <ArrowUpRight size={20} strokeWidth={2.4} />
                    </span>
                  </span>
                  <span className={s.tileText}>
                    <b>{d.title}</b>
                    <small>{d.text}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- community ---------- */}
        <section className={`${s.section} ${s.comm}`} aria-labelledby="hv-comm">
          <span className={s.discC} aria-hidden="true" />
          <div className={s.commText}>
            <p className={s.chip}>Community</p>
            <h2 id="hv-comm" className={s.commTitle}>
              Learn alongside others
            </h2>
            <p className={s.commBody}>
              A small, moderated community for people learning to read, memorize and understand the Quran. Find a circle at
              your level and a partner to revise with.
            </p>
            <Link href="/community" className={`${s.btn} ${s.btnLight}`}>
              Visit the community
              <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </div>

          <div className={s.chat}>
            <p className={s.chatTag}>Example conversation</p>
            <div className={s.msg}>
              <span className={`${s.who} ${s.whoA}`} aria-hidden="true" />
              <p>Anyone revising Juz 30 this week?</p>
            </div>
            <div className={`${s.msg} ${s.msgMe}`}>
              <span className={`${s.who} ${s.whoB}`} aria-hidden="true" />
              <p>Yes. Shall we test each other after Fajr?</p>
            </div>
            <div className={s.msg}>
              <span className={`${s.who} ${s.whoA}`} aria-hidden="true" />
              <p>
                Perfect. I’ll start from <span className={s.nb}>Surah An-Naba</span>.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- closing invitation ---------- */}
        <section className={`${s.section} ${s.start}`} aria-labelledby="hv-start">
          <span className={`${s.blob} ${s.blobA}`} aria-hidden="true" />
          <span className={`${s.blob} ${s.blobB}`} aria-hidden="true" />
          <span className={`${s.blob} ${s.blobC}`} aria-hidden="true" />
          <span className={`${s.blob} ${s.blobD}`} aria-hidden="true" />
          <h2 id="hv-start" className={s.startTitle}>
            Start with <span className={s.nb}>Al-Fatihah</span>
          </h2>
          <p className={s.startBody}>The Opening: 7 ayahs that begin every prayer.</p>
          <Link href="/read-quran/1" className={`${s.btn} ${s.btnBlue}`}>
            Read now
            <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </section>
      </div>

      <footer className={s.foot}>
        <div className={`${s.wrap} ${s.footGrid}`}>
          <div className={s.footBrand}>
            <Link href="/home-v2" className={s.brand} aria-label="Learn Quran, home">
              <LogoMark />
              <span>Learn Quran</span>
            </Link>
            <p>A little every day.</p>
            <ul className={s.socials}>
              {SOCIALS.map(x => (
                <li key={x.label}>
                  <a href={x.href} target="_blank" rel="noopener noreferrer" className={s.social}>
                    {x.label}
                    <ArrowUpRight size={14} strokeWidth={2.4} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {FOOT.map(col => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className={s.footHead}>{col.title}</h3>
              <ul className={s.footLinks}>
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className={s.wrap}>
          <div className={s.footEnd}>
            <span>© {new Date().getFullYear()} Learn Quran</span>
            <span>Free, in your browser, at your own pace.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
