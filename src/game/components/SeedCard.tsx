'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { TEXTS, type Dhikr } from '../content/dhikr';
import { PER_PLANT, growingStage } from '../lib/engine';
import { useGarden } from '../state/GardenProvider';
import { PlantShape } from './Plant';
import s from '../game.module.css';

function Preview({ d }: { d: Dhikr }) {
  if (d.species === 'rain') {
    return (
      <svg viewBox="-60 -110 120 120" className={s.previewSvg} aria-hidden>
        <ellipse cx={0} cy={-80} rx={40} ry={14} fill="#c9d6de" />
        <ellipse cx={-18} cy={-88} rx={20} ry={14} fill="#dbe5ea" />
        <g stroke="#6fb6d0" strokeWidth={2} strokeLinecap="round">
          {[-28, -14, 0, 14, 28].map((x, i) => (
            <line key={x} x1={x} y1={-60 + (i % 2) * 8} x2={x - 4} y2={-46 + (i % 2) * 8} />
          ))}
        </g>
        <path d="M-50 0Q0-12 50 0Z" fill="#93a877" />
      </svg>
    );
  }
  return (
    <svg viewBox="-80 -160 160 168" className={s.previewSvg} aria-hidden>
      <ellipse cx={0} cy={2} rx={34} ry={7} fill="rgba(48,58,26,.2)" />
      <PlantShape species={d.species} stage="blossom" seed={`card:${d.id}`} />
    </svg>
  );
}

export default function SeedCard({ dhikr: d }: { dhikr: Dhikr }) {
  const { state, ready } = useGarden();
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => audio.current?.pause(), []);

  const total = ready ? state.totals[d.id] ?? 0 : 0;
  const plants = Math.floor(total / PER_PLANT);
  const stage = growingStage(total);

  const play = () => {
    if (!d.audio) return;
    audio.current ??= new Audio(d.audio);
    const a = audio.current;
    a.onended = () => setPlaying(false);
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.currentTime = 0;
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  return (
    <article className={s.seedCard}>
      <Link href="/game" className={s.textLink}>
        Back to the garden
      </Link>
      {d.reviewStatus !== 'approved' && (
        <p className={s.reviewBadge}>Awaiting scholar review: the text, meaning and references below are not yet approved.</p>
      )}
      <div className={s.seedHero}>
        <Preview d={d} />
        <div>
          <p className={s.arabicLarge} lang="ar" dir="rtl">
            {d.arabic}
          </p>
          <h1 className={s.seedTitle}>{d.transliteration}</h1>
          <p className={s.meaning}>{d.translation}</p>
        </div>
      </div>

      <div className={s.rowBtns}>
        <Link href={`/game#count=${d.id}`} className={s.primaryBtn}>
          Plant this seed now
        </Link>
        <button
          type="button"
          className={s.ghostBtn}
          onClick={play}
          disabled={!d.audio}
          aria-pressed={playing}
          title={d.audio ? undefined : 'A recitation will be added once recorded with permission'}
        >
          {d.audio ? (playing ? 'Stop recitation' : 'Listen') : 'Recitation coming soon'}
        </button>
      </div>

      <section className={s.card}>
        <h2 className={s.cardTitle}>What it grows</h2>
        <p>
          <strong>{d.plant}</strong> — {d.place}.
        </p>
        <p>{d.why}</p>
        <p className={s.reflection}>{d.reflection}</p>
      </section>

      <section className={s.card}>
        <h2 className={s.cardTitle}>Sources</h2>
        <ul className={s.sources}>
          {d.sources.map(src => (
            <li key={src.ref}>
              <strong>{src.ref}.</strong> {src.note}
            </li>
          ))}
        </ul>
      </section>

      {d.species !== 'rain' && (
        <section className={s.card}>
          <h2 className={s.cardTitle}>In your garden</h2>
          {!ready ? (
            <p>&nbsp;</p>
          ) : state.settings.khushuMode ? (
            <p>Numbers are hidden in Khushu mode.</p>
          ) : (
            <p>
              {plants} full {plants === 1 ? 'plant' : 'plants'}
              {stage ? `, and one more growing (${stage}).` : '.'} Lifetime count: {total}.
            </p>
          )}
          <p className={s.refLine}>{TEXTS.honesty}</p>
        </section>
      )}
    </article>
  );
}
