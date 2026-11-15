/**
 * Homepage "about + FAQ" section. A server component: its text is in the HTML Google reads,
 * and it links to the main sections and most-searched surahs.
 */
import Link from 'next/link';
import { HOME_FAQ } from './homeFaq';
import { HOME_ABOUT_ICONS } from './HomeAboutIcons';
import s from './HomeAbout.module.css';

/** `tone` picks one of the neutral card colours (see HomeAbout.module.css) */
const FEATURES = [
  { href: '/read-quran', icon: 'read', tone: 'paperTone', title: 'Read the Quran online', text: 'All 114 surahs in clear Uthmani script, with translation, word-by-word meaning and tafseer.' },
  { href: '/learn-quran', icon: 'qaida', tone: 'stoneTone', title: 'Learn to read: Noorani Qaida', text: '18 audio lessons from the alphabet to fluent reading — perfect for beginners and kids.' },
  { href: '/quran-player', icon: 'listen', tone: 'mistTone', title: 'Listen with translation', text: 'Beautiful recitations, ayah by ayah, with the meaning in English, Urdu and more.' },
  { href: '/memorize-quran', icon: 'memorize', tone: 'paperTone', title: 'Memorize the Quran (Hifz)', text: 'Learn ayah by ayah with audio on repeat, at your own pace.' },
  { href: '/tajweed', icon: 'tajweed', tone: 'stoneTone', title: 'Tajweed rules', text: 'Color-coded Quran text and a guide to every rule: ikhfa, idgham, qalqalah, madd and more.' },
  { href: '/tafseer', icon: 'tafseer', tone: 'mistTone', title: 'Tafseer & understanding', text: 'Read the explanation behind each ayah and reflect on what Allah is saying.' },
] as const;

const POPULAR = [
  { n: 36, name: 'Surah Yasin' },
  { n: 67, name: 'Surah Al-Mulk' },
  { n: 18, name: 'Surah Al-Kahf' },
  { n: 55, name: 'Surah Ar-Rahman' },
  { n: 56, name: 'Surah Al-Waqiah' },
  { n: 1, name: 'Surah Al-Fatihah' },
  { n: 2, name: 'Surah Al-Baqarah' },
  { n: 19, name: 'Surah Maryam' },
  { n: 112, name: 'Surah Al-Ikhlas' },
  { n: 32, name: 'Surah As-Sajdah' },
];

export default function HomeAbout() {
  return (
    <section className={s.wrap} aria-labelledby="home-about">
      <div className={s.intro}>
        <span className={s.eyebrow}>Free, always</span>
        <h2 id="home-about" className={s.h2}>Learn Quran online, a little every day</h2>
        <p className={s.lead}>
          Learn Quran is a free place to read, listen to and understand the Holy Quran. Start from the Arabic
          alphabet with Noorani Qaida, read every surah with translation and tafseer, listen to recitations
          ayah by ayah, and memorize at your own pace — on your phone or computer, with no sign-up.
        </p>
      </div>

      <ul className={s.grid}>
        {FEATURES.map(f => {
          const Icon = HOME_ABOUT_ICONS[f.icon];
          return (
          <li key={f.href}>
            <Link href={f.href} className={`${s.card} ${s[f.tone]}`}>
              <span className={s.disc} aria-hidden="true" />
              <span className={s.icon} aria-hidden="true"><Icon className={s.iconSvg} /></span>
              <h3 className={s.h3}>{f.title}</h3>
              <p className={s.text}>{f.text}</p>
              <span className={s.more} aria-hidden="true">
                Open
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
              </span>
            </Link>
          </li>
          );
        })}
      </ul>

      <div className={s.popular}>
        <h2 className={s.h2Small}>Popular surahs to read</h2>
        <ul className={s.chips}>
          {POPULAR.map(p => (
            <li key={p.n}>
              <Link href={`/read-quran/${p.n}`} className={s.chip}>
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={s.faq}>
        <h2 className={s.h2Small}>Frequently asked questions</h2>
        {HOME_FAQ.map((f, i) => (
          <details key={f.q} className={s.qa} open={i === 0}>
            <summary className={s.q}>
              <h3 className={s.qText}>{f.q}</h3>
              <span className={s.chev} aria-hidden="true">+</span>
            </summary>
            <p className={s.a}>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
