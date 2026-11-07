'use client';
/**
 * The Tasbih Ring. The whole screen is the tap target; Space and Enter also count.
 * Taps faster than settings.minTapGapMs ripple but do not count.
 */
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AFTER_SALAH, DHIKR_BY_ID, TEXTS } from '../content/dhikr';
import { localDay } from '../lib/day';
import { beadClick, haptic } from '../lib/feedback';
import { useGarden } from '../state/GardenProvider';
import s from '../game.module.css';

export type Session = { kind: 'single'; dhikrId: string } | { kind: 'set' };

type Ripple = { id: number; x: number; y: number; soft: boolean };

const RING_R = 118;

export default function TasbihRing({ session, onClose }: { session: Session; onClose: () => void }) {
  const { state, count } = useGarden();
  const { settings } = state;
  const khushu = settings.khushuMode;
  const steps = session.kind === 'set' ? AFTER_SALAH.steps : null;

  const [step, setStep] = useState(0);
  const firstId = steps ? steps[0].dhikrId : (session as { dhikrId: string }).dhikrId;
  const [choice, setChoice] = useState<33 | 100>(DHIKR_BY_ID[firstId]?.defaultTarget ?? 33);
  const [inRound, setInRound] = useState(0);
  const [bloom, setBloom] = useState(0);
  const [done, setDone] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [live, setLive] = useState('');
  const [caption, setCaption] = useState<string | null>(null);

  const dhikrId = steps ? steps[step].dhikrId : firstId;
  const d = DHIKR_BY_ID[dhikrId];
  const target = steps ? steps[step].target : choice;

  // Refs keep the tap handler free of stale state between rapid taps.
  const r = useRef({ last: -Infinity, inRound: 0, step: 0, done: false, choice, rid: 0 });
  r.current.choice = choice;

  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => rootRef.current?.focus(), []);

  const tap = useCallback(
    (x: number, y: number) => {
      const st = r.current;
      const now = performance.now();
      const tooFast = now - st.last < settings.minTapGapMs;
      const id = ++st.rid;
      setRipples(list => [...list.slice(-6), { id, x, y, soft: tooFast }]);
      setTimeout(() => setRipples(list => list.filter(rp => rp.id !== id)), 700);
      if (tooFast || st.done) return;
      st.last = now;

      const tgtOf = (i: number) => (steps ? steps[i].target : st.choice);
      if (st.inRound >= tgtOf(st.step)) st.inRound = 0; // a completed single round restarts on the next tap
      const cur = steps ? steps[st.step].dhikrId : firstId;
      const tgt = tgtOf(st.step);
      const next = count(cur);
      st.inRound += 1;
      const n = st.inRound;
      const complete = n === tgt;
      const lastStep = !steps || st.step === steps.length - 1;

      if (khushu) {
        if (n % 33 === 0 || complete) haptic(settings.haptics, [20, 40, 20]);
      } else if (complete && (tgt === 100 || (steps && lastStep))) haptic(settings.haptics, 80);
      else if (complete || n % 33 === 0) haptic(settings.haptics, [20, 40, 20]);
      else haptic(settings.haptics, 10);
      beadClick(settings.sound, complete);

      setInRound(n);
      setLive(khushu ? (complete ? 'Round complete' : '') : `${n} of ${tgt}`);

      const total = next.totals[cur] ?? 0;
      if (total % 100 === 0) {
        const dd = DHIKR_BY_ID[cur];
        setToast(
          dd?.species === 'rain'
            ? 'Rain falls across the whole garden.'
            : `A new ${dd?.plant.toLowerCase() ?? 'plant'} stands in your garden. ${TEXTS.honesty}`,
        );
      }

      if (complete) {
        setBloom(b => b + 1);
        if (steps && !lastStep) {
          st.step += 1;
          st.inRound = 0;
          setStep(st.step);
          setInRound(0);
          setCaption(`Now: ${DHIKR_BY_ID[steps[st.step].dhikrId]?.transliteration} × ${steps[st.step].target}`);
          setTimeout(() => setCaption(null), 1800);
        } else if (steps) {
          st.done = true;
          setDone(true);
        }
      }
    },
    [count, firstId, khushu, settings.haptics, settings.minTapGapMs, settings.sound, steps],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== ' ' && e.key !== 'Enter') return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('button, a, input, select, textarea')) return; // let real controls work
      e.preventDefault();
      if (e.repeat) return;
      tap(window.innerWidth / 2, window.innerHeight / 2);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tap, onClose]);

  const today = state.days[localDay(Date.now())]?.[dhikrId] ?? 0;
  const lifetime = state.totals[dhikrId] ?? 0;
  const beadR = target <= 34 ? 7.5 : 3.6;
  const shown = Math.min(inRound, target);

  if (!d) return null;

  return (
    <div
      ref={rootRef}
      className={s.ringOverlay}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`Counting ${d.transliteration}`}
      onPointerDown={e => {
        if ((e.target as HTMLElement).closest('[data-notap]')) return;
        e.preventDefault();
        tap(e.clientX, e.clientY);
      }}
    >
      {ripples.map(rp => (
        <span key={rp.id} className={rp.soft ? `${s.tapRipple} ${s.tapRippleSoft}` : s.tapRipple} style={{ left: rp.x, top: rp.y }} />
      ))}

      <div className={s.ringTop} data-notap>
        <button type="button" className={s.ghostBtn} onClick={onClose}>
          Return to garden
        </button>
        {!steps && (
          <div className={s.segmented} role="group" aria-label="Beads in a round">
            {([33, 100] as const).map(n => (
              <button
                key={n}
                type="button"
                aria-pressed={choice === n}
                className={choice === n ? s.segOn : s.seg}
                onClick={() => {
                  setChoice(n);
                  r.current.inRound = 0;
                  setInRound(0);
                }}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={s.ringBody}>
        {steps && (
          <p className={s.ringStep}>
            {AFTER_SALAH.label} · {step + 1} of {steps.length}
          </p>
        )}
        <p className={s.arabicLarge} lang="ar" dir="rtl">
          {d.arabic}
        </p>
        <p className={s.translit}>{d.transliteration}</p>
        <p className={s.meaning}>{d.translation}</p>

        <button
          type="button"
          className={s.ringButton}
          data-notap
          aria-label={khushu ? 'Count' : `Count. ${shown} of ${target}`}
          onClick={e => {
            if (e.detail === 0) tap(window.innerWidth / 2, window.innerHeight / 2); // keyboard activation only
          }}
          onPointerDown={e => {
            e.preventDefault();
            tap(e.clientX, e.clientY);
          }}
        >
          <svg viewBox="0 0 300 300" className={s.ringSvg} aria-hidden>
            <circle cx={150} cy={150} r={RING_R} fill="none" className={s.ringTrack} strokeWidth={2} />
            {khushu ? (
              <>
                <g className={s.orbit}>
                  <circle cx={150} cy={150 - RING_R} r={9} className={s.beadOn} />
                </g>
                <circle cx={150} cy={150} r={46} className={s.breath} />
              </>
            ) : (
              Array.from({ length: target }, (_, i) => {
                const a = (i / target) * Math.PI * 2 - Math.PI / 2;
                const on = i < shown;
                return (
                  <circle
                    key={`${target}-${i}`}
                    cx={150 + Math.cos(a) * RING_R}
                    cy={150 + Math.sin(a) * RING_R}
                    r={i === shown - 1 ? beadR * 1.35 : beadR}
                    className={on ? s.beadOn : s.beadOff}
                  />
                );
              })
            )}
            {!khushu && (
              <text x={150} y={162} textAnchor="middle" className={s.ringCount}>
                {shown}
              </text>
            )}
            {!khushu && (
              <text x={150} y={190} textAnchor="middle" className={s.ringOf}>
                of {target}
              </text>
            )}
          </svg>
          {bloom > 0 && <span key={bloom} className={s.bloom} aria-hidden />}
        </button>

        {khushu ? (
          <p className={s.hint}>Say the phrase as you breathe in, and rest as you breathe out.</p>
        ) : (
          <p className={s.hint}>
            Today {today} · Lifetime {lifetime}
          </p>
        )}
        {caption && <p className={s.caption}>{caption}</p>}
        {done && (
          <div className={s.doneCard} data-notap>
            <p>The set is complete. The fountain flows today.</p>
            <p className={s.refLine}>{AFTER_SALAH.source.ref}</p>
            <button type="button" className={s.primaryBtn} onClick={onClose}>
              Return to garden
            </button>
          </div>
        )}
        {toast && (
          <div className={s.toast} data-notap role="status">
            <p>{toast}</p>
            <button type="button" className={s.ghostBtn} onClick={() => setToast(null)}>
              Close
            </button>
          </div>
        )}
        <p className={s.ringFoot} data-notap>
          <Link href={`/game/seeds/${dhikrId}`} className={s.textLink}>
            Meaning and source
          </Link>
          <span aria-hidden> · </span>
          <span>Tap anywhere, or press Space</span>
        </p>
      </div>

      <div className={s.srOnly} aria-live="polite">
        {live}
      </div>
    </div>
  );
}
