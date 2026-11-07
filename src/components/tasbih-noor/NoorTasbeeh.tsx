'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import NightSky from './NightSky';
import Misbaha from './Misbaha';
import ThemeMenu from '../tasbih-themes/ThemeMenu';
import { Lanterns, Moon, Skyline } from './Scene';
import { CUSTOM_ID, DHIKR, GOALS, roundProgress, roundsDone } from '@/lib/tasbih';
import { buzz, tone, useTasbih } from '@/lib/useTasbih';
import './noor.css';

const HOLD_MS = 900;

/** A soft wooden "clack" of two beads meeting. */
function clack() {
  tone(2600, 0.028, 0.05, 0, 'triangle', 0.5);
  tone(1500, 0.05, 0.035, 0.006, 'sine', 0.7);
}
/** A gentle bell chord for a completed round. */
function chime() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 1.6, 0.045, i * 0.09, 'sine', 0.995));
}

export default function NoorTasbeeh() {
  const router = useRouter();
  const [celebrate, setCelebrate] = useState(0);
  const [toast, setToast] = useState('');
  const [sheet, setSheet] = useState<'dhikr' | 'goal' | null>(null);
  const [holding, setHolding] = useState(false);
  const [bump, setBump] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flash = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  };

  const { st, setSt, tap, undo } = useTasbih((next, hit) => {
    if (next.sound) (hit ? chime : clack)();
    buzz(hit ? [30, 70, 30, 70, 60] : 8);
    setBump(b => b + 1);
    if (hit) {
      const n = next.count / next.goal;
      setCelebrate(c => c + 1);
      flash(n > 1 ? `MashaAllah — round ${n} complete` : `MashaAllah — ${next.goal} complete`);
    }
  });

  useEffect(() => () => { clearTimeout(toastTimer.current); clearTimeout(holdTimer.current); }, []);

  // Space/Enter count from anywhere on the page; Backspace undoes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (sheet || t.closest('input, textarea, button, a, [role="button"]')) return;
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); tap(); }
      if (e.key === 'Backspace') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet, tap, undo]);

  const preset = DHIKR.find(d => d.id === st.dhikrId);
  const custom = st.dhikrId === CUSTOM_ID;
  const label = custom ? st.custom || 'Zikr' : preset?.label ?? 'Zikr';
  const pct = roundProgress(st.count, st.goal);
  const rounds = roundsDone(st.count, st.goal);
  const inRound = st.count === 0 ? 0 : ((st.count - 1) % st.goal) + 1;

  // press-and-hold to reset, so a stray tap can never wipe a long count
  const startHold = () => {
    if (st.count === 0) return;
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      setHolding(false);
      setSt(s => ({ ...s, count: 0 }));
      buzz(40);
      flash('Counter reset');
    }, HOLD_MS);
  };
  const endHold = () => { clearTimeout(holdTimer.current); setHolding(false); };

  const back = () => (window.history.length > 1 ? router.back() : router.push('/'));

  return (
    <div className="nr">
      <div className="nr-col">
        <header className="nr-top">
          <button className="nr-ib" onClick={back} aria-label="Back">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="nr-brand">
            <span lang="ar" dir="rtl">نور</span>
            <h1>Tasbeeh</h1>
          </div>
          <ThemeMenu current="noor" className="nr-ib" />
        </header>

        <section className="nr-hero" aria-label="Night sky — every count lights a star">
          <NightSky count={st.count} goal={st.goal} celebrate={celebrate} />
          <Moon progress={pct} full={pct >= 1} />
          <Skyline />
          {celebrate > 0 && <Lanterns id={celebrate} />}

          <button className="nr-dhikr" onClick={() => setSheet('dhikr')} aria-label={`Dhikr: ${label}. Change`}>
            {!custom && preset?.ar && <span className="nr-ar" lang="ar" dir="rtl">{preset.ar}</span>}
            <span className={custom ? 'nr-custom-label' : 'nr-translit'}>{label}</span>
            {!custom && preset?.meaning && <span className="nr-meaning">{preset.meaning}</span>}
            <span className="nr-change"><span className="material-symbols-outlined">swap_horiz</span>Change</span>
          </button>

          <div className="nr-stars-note" aria-live="polite">
            <span className="material-symbols-outlined">auto_awesome</span>
            {inRound} {inRound === 1 ? 'star' : 'stars'} tonight
          </div>

          {toast && <div className="nr-toast" role="status"><span>✦</span>{toast}<span>✦</span></div>}
        </section>

        <section className="nr-count" aria-label="Counter">
          <div className="nr-num-wrap">
            <span key={bump} className="nr-num">{st.count.toLocaleString()}</span>
            <button className="nr-goal" onClick={() => setSheet('goal')} aria-label={`Goal ${st.goal}. Change`}>
              <span className="nr-goal-bar"><i style={{ width: `${pct * 100}%` }} /></span>
              {inRound} / {st.goal}
              <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>

          <Misbaha count={st.count} onCount={tap} label={label} />
          <p className="nr-hint">Swipe the beads or tap</p>

          <div className="nr-actions">
            <button className="nr-act" onClick={undo} disabled={st.count === 0} aria-label="Undo last count">
              <span className="material-symbols-outlined">undo</span>
            </button>
            <button
              className={`nr-act nr-hold${holding ? ' on' : ''}`}
              disabled={st.count === 0}
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onPointerCancel={endHold}
              onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); startHold(); } }}
              onKeyUp={e => { if (e.key === 'Enter' || e.key === ' ') endHold(); }}
              aria-label="Hold to reset"
              style={{ ['--hold' as string]: `${HOLD_MS}ms` }}
            >
              <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" /></svg>
              <span className="material-symbols-outlined">restart_alt</span>
              <small>Hold</small>
            </button>
            <button
              className={`nr-act${st.sound ? '' : ' off'}`}
              onClick={() => { if (!st.sound) clack(); setSt(s => ({ ...s, sound: !s.sound })); }}
              aria-pressed={st.sound}
              aria-label="Sound"
            >
              <span className="material-symbols-outlined">{st.sound ? 'volume_up' : 'volume_off'}</span>
            </button>
          </div>

          <dl className="nr-stats">
            <div><dt>Today</dt><dd>{st.today.toLocaleString()}</dd></div>
            <div><dt>Rounds</dt><dd>{rounds}</dd></div>
            <div><dt>Lifetime</dt><dd>{st.total.toLocaleString()}</dd></div>
          </dl>
        </section>
      </div>

      {sheet && (
        <Sheet title={sheet === 'dhikr' ? 'Choose your dhikr' : 'Set your goal'} onClose={() => setSheet(null)}>
          {sheet === 'dhikr' ? (
            <DhikrList
              current={st.dhikrId}
              custom={st.custom}
              onPick={(dhikrId, c) => {
                setSt(s => ({ ...s, dhikrId, custom: c ?? s.custom, count: s.dhikrId === dhikrId ? s.count : 0 }));
                setSheet(null);
              }}
            />
          ) : (
            <GoalPicker
              value={st.goal}
              onPick={goal => { setSt(s => ({ ...s, goal })); setSheet(null); }}
            />
          )}
        </Sheet>
      )}
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="nr-sheet-bg" onClick={onClose}>
      <div className="nr-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="nr-grip" />
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function DhikrList({ current, custom, onPick }: { current: string; custom: string; onPick: (id: string, c?: string) => void }) {
  const [text, setText] = useState(custom);
  return (
    <>
      <p className="nr-sheet-note">Switching dhikr begins a new night sky.</p>
      <ul className="nr-dlist">
        {DHIKR.map(d => (
          <li key={d.id}>
            <button className={current === d.id ? 'on' : ''} onClick={() => onPick(d.id)}>
              <span lang="ar" dir="rtl">{d.ar}</span>
              <b>{d.label}</b>
              <small>{d.meaning}</small>
            </button>
          </li>
        ))}
      </ul>
      <form className="nr-form" onSubmit={e => { e.preventDefault(); if (text.trim()) onPick(CUSTOM_ID, text.trim()); }}>
        <input value={text} onChange={e => setText(e.target.value)} maxLength={40} placeholder="Or write your own…" aria-label="Custom dhikr" />
        <button type="submit" disabled={!text.trim()}>Use</button>
      </form>
    </>
  );
}

function GoalPicker({ value, onPick }: { value: number; onPick: (n: number) => void }) {
  const [text, setText] = useState(GOALS.includes(value) ? '' : String(value));
  const n = parseInt(text, 10);
  const valid = Number.isFinite(n) && n > 0 && n <= 100000;
  return (
    <>
      <p className="nr-sheet-note">The moon reaches full when you reach your goal.</p>
      <div className="nr-goals">
        {GOALS.map(g => (
          <button key={g} className={g === value ? 'on' : ''} onClick={() => onPick(g)}>{g}</button>
        ))}
      </div>
      <form className="nr-form" onSubmit={e => { e.preventDefault(); if (valid) onPick(n); }}>
        <input inputMode="numeric" value={text} onChange={e => setText(e.target.value.replace(/\D/g, ''))} placeholder="Custom goal" aria-label="Custom goal" />
        <button type="submit" disabled={!valid}>Set</button>
      </form>
    </>
  );
}
