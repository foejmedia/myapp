'use client';
/** The Seed Library: the codex of what each dhikr grows, and a short meaning-match practice. */
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DHIKR, UPCOMING } from '../content/dhikr';
import { mulberry32 } from '../lib/random';
import s from '../game.module.css';

function shuffle<T>(arr: T[], seed: number): T[] {
  const rnd = mulberry32(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Practice() {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const q = DHIKR[round % DHIKR.length];
  const options = useMemo(
    () => shuffle([q, ...shuffle(DHIKR.filter(d => d.id !== q.id), round + 1).slice(0, 2)], round + 99),
    [q, round],
  );
  const right = picked === q.id;
  return (
    <section className={s.card} aria-labelledby="gd-practice">
      <h2 id="gd-practice" className={s.cardTitle}>
        Match the meaning
      </h2>
      <p className={s.arabicLarge} lang="ar" dir="rtl">
        {q.arabic}
      </p>
      <p className={s.refLine}>Which meaning belongs to this phrase?</p>
      <div className={s.choiceList}>
        {options.map(o => (
          <button
            key={o.id}
            type="button"
            className={picked === o.id ? (o.id === q.id ? s.choiceRight : s.choiceWrong) : s.choice}
            onClick={() => setPicked(o.id)}
            disabled={right}
          >
            {o.translation}
          </button>
        ))}
      </div>
      <p role="status" className={s.note}>
        {picked === null ? ' ' : right ? `Yes: ${q.transliteration}. ${q.translation}` : 'Not quite. Try another.'}
      </p>
      {right && (
        <button
          type="button"
          className={s.primaryBtn}
          onClick={() => {
            setPicked(null);
            setRound(round + 1);
          }}
        >
          Next phrase
        </button>
      )}
    </section>
  );
}

export default function Library() {
  return (
    <div className={s.panelStack}>
      <h1 className={s.pageTitle}>The Seed Library</h1>
      <p className={s.lead}>
        Each plant is chosen for a reason you can learn, so the garden doubles as a map of meanings. All texts are awaiting
        scholar review.
      </p>
      <ul className={s.codex}>
        {DHIKR.map(d => (
          <li key={d.id}>
            <Link href={`/game/seeds/${d.id}`} className={s.codexItem}>
              <span className={s.seedArabic} lang="ar" dir="rtl">
                {d.arabic}
              </span>
              <span className={s.seedName}>{d.transliteration}</span>
              <span className={s.seedMeta}>
                {d.plant} · {d.sources[0].ref}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Practice />

      <section className={s.card} aria-labelledby="gd-upcoming">
        <h2 id="gd-upcoming" className={s.cardTitle}>
          Seeds still to come
        </h2>
        <p className={s.refLine}>These will unlock by learning their meaning and pronunciation, never by grinding counts.</p>
        <ul className={s.sources}>
          {UPCOMING.map(u => (
            <li key={u.title}>
              <strong>{u.title}</strong> — {u.grows} ({u.ref})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
