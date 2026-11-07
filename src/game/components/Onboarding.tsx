'use client';
import { useEffect, useRef, useState } from 'react';
import { TEXTS } from '../content/dhikr';
import s from '../game.module.css';

const SCREENS = [
  {
    title: 'Plant with your tongue. Grow with your heart.',
    body: TEXTS.ibrahim.body,
    ref: TEXTS.ibrahim.ref,
  },
  {
    title: 'A reminder, not a reward',
    body: `${TEXTS.reminder} ${TEXTS.honesty}`,
    ref: 'Your counts stay on this device. There are no leaderboards.',
  },
  {
    title: 'How to remember',
    body:
      'Choose a seed, then tap anywhere on the screen, or press Space, once for each phrase. Taps faster than a phrase can be said make a ripple but do not count. Nothing here ever wilts, and a missed day takes nothing away.',
    ref: `${TEXTS.consistency.body} (${TEXTS.consistency.ref})`,
  },
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headRef.current?.focus(), [i]);
  const sc = SCREENS[i];
  const last = i === SCREENS.length - 1;
  return (
    <div className={s.modalBack} role="dialog" aria-modal="true" aria-labelledby="gd-onb-title">
      <div className={s.modal}>
        <p className={s.kicker}>
          {i + 1} of {SCREENS.length}
        </p>
        <h2 id="gd-onb-title" ref={headRef} tabIndex={-1} className={s.modalTitle}>
          {sc.title}
        </h2>
        <p className={s.modalBody}>{sc.body}</p>
        <p className={s.refLine}>{sc.ref}</p>
        <div className={s.modalActions}>
          {!last && (
            <button type="button" className={s.ghostBtn} onClick={onDone}>
              Skip
            </button>
          )}
          <button type="button" className={s.primaryBtn} onClick={() => (last ? onDone() : setI(i + 1))}>
            {last ? 'Enter the garden' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
