import Link from 'next/link';
import './LearnSteps.css';

/* Simple stroke icons (inline, no extra requests) */
const BookIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 6c-2-1.3-5-1.5-8-.8V18c3-.7 6-.5 8 .8 2-1.3 5-1.5 8-.8V5.2c-3-.7-6-.5-8 .8z" />
    <path d="M12 6v12.8" />
  </svg>
);
const HeadphonesIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <rect x="3" y="14" width="4" height="6" rx="1.5" />
    <rect x="17" y="14" width="4" height="6" rx="1.5" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="8" />
    <path d="M8.5 12l2.5 2.5 4.5-5" />
  </svg>
);

const STEPS = [
  { title: 'Choose a Surah', desc: '114 Surahs, page by page or word by word', href: '/read-quran/1', Icon: BookIcon },
  { title: 'Listen & understand', desc: 'Reciters, Tajweed and Tafseer', href: '/quran-player', Icon: HeadphonesIcon },
  { title: 'Memorize & track', desc: 'Daily Hifz plan with a streak', href: '/memorize-quran', Icon: CheckIcon, gold: true },
];

export default function LearnSteps() {
  return (
    <section className="ls" aria-labelledby="ls-title">
      <div className="ls-intro">
        <p className="ls-kicker">Start your journey</p>
        <h2 id="ls-title" className="ls-title">
          3 steps to learn
          <br />
          the Quran
        </h2>
        <p className="ls-sub">Everything in one place: free, in your browser, at your own pace.</p>
        <Link href="/read-quran/1" className="ls-btn">
          Start reading <span aria-hidden="true">→</span>
        </Link>
      </div>

      <ol className="ls-list">
        {STEPS.map(({ title, desc, href, Icon, gold }, i) => (
          <li key={title}>
            <Link href={href} className="ls-row">
              <span className={`ls-icon${gold ? ' ls-icon-gold' : ''}`}>
                <Icon />
              </span>
              <span className="ls-text">
                <b>
                  {i + 1} · {title}
                </b>
                <span>{desc}</span>
              </span>
              <span className="ls-arrow" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
