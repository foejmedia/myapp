'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Garden, { Corner } from './Garden';
import GoalDial from './GoalDial';
import ThemeMenu from '../tasbih-themes/ThemeMenu';
import { CUSTOM_ID, DHIKR, GOALS, roundProgress, roundsDone, type TasbihState } from '@/lib/tasbih';
import { buzz, tone, useTasbih } from '@/lib/useTasbih';
import './tasbih.css';

const TICKS = 72;
const RING_R = 104;
const RING_C = 2 * Math.PI * RING_R;

export default function TasbeehGarden() {
  const router = useRouter();
  const [celebrate, setCelebrate] = useState(0);
  const [toast, setToast] = useState('');
  const [picker, setPicker] = useState(false);
  const [armReset, setArmReset] = useState(false);
  const { st, setSt, tap, undo } = useTasbih((next, hit) => {
    if (next.sound) {
      if (hit) { tone(660, 0.4, 0.08); tone(880, 0.45, 0.07, 0.12); tone(1320, 0.6, 0.05, 0.24); }
      else tone(1400, 0.06, 0.05, 0, 'triangle');
    }
    buzz(hit ? [40, 60, 40] : 10);
    if (hit) {
      const n = next.count / next.goal;
      setCelebrate(c => c + 1);
      flash(`MashaAllah! ${next.goal}${n > 1 ? ` × ${n}` : ''} complete`);
    }
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => { clearTimeout(toastTimer.current); clearTimeout(resetTimer.current); }, []);

  const flash = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  };

  const preset = DHIKR.find(d => d.id === st.dhikrId);
  const label = st.dhikrId === CUSTOM_ID ? st.custom || 'Zikr' : preset?.label ?? 'Zikr';
  const pct = roundProgress(st.count, st.goal);
  const rounds = roundsDone(st.count, st.goal);

  const reset = () => {
    if (st.count === 0) return;
    if (!armReset) {
      setArmReset(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setArmReset(false), 2500);
      return;
    }
    clearTimeout(resetTimer.current);
    setArmReset(false);
    setSt(s => ({ ...s, count: 0 }));
    flash('Counter reset');
  };

  const toggleSound = () => {
    if (!st.sound) tone(1400, 0.06, 0.05, 0, 'triangle');
    setSt(s => ({ ...s, sound: !s.sound }));
  };

  const setGoal = (goal: number) => {
    setSt(s => ({ ...s, goal }));
    if (st.sound) tone(900, 0.04, 0.03, 0, 'triangle');
  };

  // Space/Enter count anywhere on the page (unless typing); Backspace undoes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (picker || t.closest('input, textarea, [role="slider"], button, a')) return;
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); tap(); }
      if (e.key === 'Backspace') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [picker, tap, undo]);

  const back = () => (window.history.length > 1 ? router.back() : router.push('/'));

  return (
    <div className="tg">
      <header className="tg-top">
        <button className="tg-icon" onClick={back} aria-label="Back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1>Tasbeeh</h1>
        <ThemeMenu current="garden" className="tg-icon" />
      </header>

      <div className="tg-wrap">
        <section className="tg-card" aria-label="Your dhikr garden">
          <Garden count={st.count} celebrate={celebrate} />
          <Corner />
          <Corner flip />

          <button className="tg-dhikr" onClick={() => setPicker(true)} aria-label={`Dhikr: ${label}. Change`}>
            <span className="tg-dhikr-label">{label}</span>
            {st.dhikrId !== CUSTOM_ID && preset?.ar && (
              <span className="tg-dhikr-ar" lang="ar" dir="rtl">{preset.ar}</span>
            )}
            <span className="tg-dhikr-edit material-symbols-outlined" aria-hidden="true">edit</span>
          </button>

          <div className="tg-meta" aria-live="polite">
            <span>Today <b>{st.today.toLocaleString()}</b></span>
            {rounds > 0 && <span className="tg-rounds"><span className="material-symbols-outlined">done_all</span>{rounds}</span>}
          </div>

          {toast && <div className="tg-toast" role="status">{toast}</div>}
        </section>

        <div className="tg-controls">
          <button className={`tg-icon${st.sound ? '' : ' off'}`} onClick={toggleSound} aria-pressed={st.sound} aria-label="Sound">
            <span className="material-symbols-outlined">{st.sound ? 'volume_up' : 'volume_off'}</span>
          </button>
          <h2>Set Goals</h2>
          <button className={`tg-icon${armReset ? ' armed' : ''}`} onClick={reset} disabled={st.count === 0} aria-label={armReset ? 'Tap again to reset' : 'Reset counter'}>
            <span className="material-symbols-outlined">refresh</span>
            {armReset && <span className="tg-armed-tip">Tap again</span>}
          </button>
        </div>

        <GoalDial values={GOALS} value={st.goal} onChange={setGoal} />

        <div className="tg-counter">
          <svg className="tg-ring" viewBox="0 0 260 260" aria-hidden="true">
            {Array.from({ length: TICKS }).map((_, i) => {
              const a = (i / TICKS) * Math.PI * 2 + Math.PI / 2; // start at the bottom, like the arc
              const on = i < Math.round(pct * TICKS);
              const r1 = 118, r2 = on ? 128 : 126;
              return (
                <line
                  key={i}
                  x1={130 + Math.cos(a) * r1} y1={130 + Math.sin(a) * r1}
                  x2={130 + Math.cos(a) * r2} y2={130 + Math.sin(a) * r2}
                  className={`tg-tick${on ? ' on' : ''}`}
                />
              );
            })}
            <circle cx="130" cy="130" r={RING_R} className="tg-track" />
            <circle
              cx="130" cy="130" r={RING_R}
              className="tg-prog"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - pct)}
              transform="rotate(90 130 130)"
            />
          </svg>
          <button
            className="tg-tap"
            onClick={tap}
            onKeyDown={e => { if (e.key === 'Backspace') { e.preventDefault(); undo(); } }}
            aria-label={`Count ${label}. ${st.count} of ${st.goal}`}
          >
            <span key={st.count} className="tg-num">{st.count}</span>
            <span className="tg-of">/ {st.goal}</span>
          </button>
        </div>

        <div className="tg-under">
          <button className="tg-undo" onClick={undo} disabled={st.count === 0}>
            <span className="material-symbols-outlined">undo</span>Undo
          </button>
          <span className="tg-life">Lifetime {st.total.toLocaleString()}</span>
        </div>
      </div>

      {picker && (
        <DhikrPicker
          state={st}
          onClose={() => setPicker(false)}
          onPick={(dhikrId, custom) => {
            setSt(s => ({ ...s, dhikrId, custom: custom ?? s.custom, count: s.dhikrId === dhikrId ? s.count : 0 }));
            setPicker(false);
          }}
        />
      )}
    </div>
  );
}

function DhikrPicker({ state, onPick, onClose }: {
  state: TasbihState;
  onPick: (id: string, custom?: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(state.custom);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="tg-sheet-bg" onClick={onClose}>
      <div className="tg-sheet" role="dialog" aria-modal="true" aria-label="Choose dhikr" onClick={e => e.stopPropagation()}>
        <div className="tg-sheet-grip" />
        <h3>Choose your dhikr</h3>
        <p className="tg-sheet-note">Switching dhikr starts a fresh count.</p>
        <ul>
          {DHIKR.map(d => (
            <li key={d.id}>
              <button className={state.dhikrId === d.id ? 'on' : ''} onClick={() => onPick(d.id)}>
                <span className="tg-sheet-txt">
                  <b>{d.label}</b>
                  <small>{d.meaning}</small>
                </span>
                <span className="tg-sheet-ar" lang="ar" dir="rtl">{d.ar}</span>
              </button>
            </li>
          ))}
        </ul>
        <form
          className="tg-custom"
          onSubmit={e => { e.preventDefault(); if (text.trim()) onPick(CUSTOM_ID, text.trim()); }}
        >
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={40}
            placeholder="Or write your own…"
            aria-label="Custom dhikr"
          />
          <button type="submit" disabled={!text.trim()}>Use</button>
        </form>
      </div>
    </div>
  );
}
