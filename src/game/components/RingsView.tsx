'use client';
/** A cross-section of the Good Tree: one ring for each day of return. Ramadan rings glow gold. */
import { useMemo } from 'react';
import { TEXTS } from '../content/dhikr';
import { dayKeyToDate } from '../lib/day';
import { ringDays } from '../lib/engine';
import { toHijri } from '../lib/hijri';
import { useGarden } from '../state/GardenProvider';
import s from '../game.module.css';

export default function RingsView({ onClose }: { onClose: () => void }) {
  const { state } = useGarden();
  const days = useMemo(() => ringDays(state), [state]);
  const rings = useMemo(
    () =>
      days.map(k => {
        const h = toHijri(dayKeyToDate(k), state.settings.hijriOffset);
        return { k, ramadan: h?.month === 9 };
      }),
    [days, state.settings.hijriOffset],
  );
  const n = rings.length;
  const step = n ? Math.min(9, 118 / n) : 0;
  return (
    <div className={s.modalBack} role="dialog" aria-modal="true" aria-labelledby="gd-rings-title" onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <h2 id="gd-rings-title" className={s.modalTitle}>
          The rings of the Good Tree
        </h2>
        <svg viewBox="0 0 300 300" className={s.ringsSvg} role="img" aria-label={`${n} rings, one for each day of remembrance`}>
          <circle cx={150} cy={150} r={140} fill="#e7cfa2" stroke="#6b4c32" strokeWidth={8} />
          {rings
            .map((r, i) => (
              <circle
                key={r.k}
                cx={150}
                cy={150}
                r={14 + (i + 1) * step}
                fill="none"
                stroke={r.ramadan ? '#d9a93a' : i % 2 ? '#b98d5f' : '#a5784b'}
                strokeWidth={Math.max(0.6, step * 0.55)}
              />
            ))
            .reverse()}
          <circle cx={150} cy={150} r={12} fill="#a5784b" />
        </svg>
        <p className={s.modalBody}>
          {n === 0
            ? 'The first ring forms on the first day you remember. Missed days add nothing and remove nothing.'
            : `${n} ${n === 1 ? 'ring' : 'rings'}, one for each day you returned. Missed days add nothing and remove nothing.`}
        </p>
        <p className={s.refLine}>
          {TEXTS.consistency.body} ({TEXTS.consistency.ref})
        </p>
        <div className={s.modalActions}>
          <button type="button" className={s.primaryBtn} onClick={onClose} autoFocus>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
