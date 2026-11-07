'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import TreeArt, { MiniTree } from './TreeArt';
import ThemeMenu from '../tasbih-themes/ThemeMenu';
import { CUSTOM_ID, DHIKR, roundProgress, roundsDone } from '@/lib/tasbih';
import { buildTree, leavesShown } from '@/lib/tasbih-tree';
import { buzz, tone, useTasbih } from '@/lib/useTasbih';
import './tooba.css';

const SLOTS = buildTree().slots.length;
const GROVE_MAX = 9;
const RING_R = 92;
const RING_C = 2 * Math.PI * RING_R;
const HADITH_ID = 'subhanallahibihamdihi';
const CHIP_GOALS = [33, 99, 100, 313, 1000];

/** A soft water-drop "plip". */
const drop = () => tone(1250, 0.09, 0.05, 0, 'sine', 0.45);
/** A rising, airy chime. */
const bloom = () => [587.33, 739.99, 880, 1174.66].forEach((f, i) => tone(f, 1.3, 0.04, i * 0.08, 'sine', 0.998));

interface Fly { id: number; dx: number }

export default function ToobaTasbeeh() {
  const router = useRouter();
  const [celebrate, setCelebrate] = useState(0);
  const [note, setNote] = useState<{ title: string; body?: string } | null>(null);
  const [flies, setFlies] = useState<Fly[]>([]);
  const [armReset, setArmReset] = useState(false);
  const [customGoal, setCustomGoal] = useState(false);
  const flyId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const { st, setSt, tap, undo } = useTasbih((next, hit) => {
    if (next.sound) (hit ? bloom : drop)();
    buzz(hit ? [25, 60, 25, 60, 50] : 9);
    const id = ++flyId.current;
    setFlies(f => [...f.slice(-6), { id, dx: Math.round((Math.random() - 0.5) * 60) }]);
    later(() => setFlies(f => f.filter(x => x.id !== id)), 900);
    if (hit) {
      setCelebrate(c => c + 1);
      setNote(next.dhikrId === HADITH_ID
        ? { title: 'A tree is planted in your grove', body: '“Whoever says SubhanAllahi wa bihamdihi, a palm tree is planted for him in Paradise.” — Tirmidhi 3464' }
        : { title: 'MashaAllah — your tree is in full bloom', body: 'It has been planted in your grove.' });
      later(() => setNote(null), 4200);
    }
  });

  // Space/Enter count anywhere on the page; Backspace undoes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, button, a, [role="button"]')) return;
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); tap(); }
      if (e.key === 'Backspace') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tap, undo]);

  const pct = roundProgress(st.count, st.goal);
  const shown = leavesShown(st.count, st.goal, SLOTS);
  const rounds = roundsDone(st.count, st.goal);
  const inRound = st.count === 0 ? 0 : ((st.count - 1) % st.goal) + 1;
  const full = pct >= 1;
  const preset = DHIKR.find(d => d.id === st.dhikrId);
  const label = st.dhikrId === CUSTOM_ID ? st.custom || 'Zikr' : preset?.label ?? 'Zikr';
  const knob = useMemo(() => {
    const a = pct * Math.PI * 2 - Math.PI / 2;
    return { x: 110 + Math.cos(a) * RING_R, y: 110 + Math.sin(a) * RING_R };
  }, [pct]);

  const reset = () => {
    if (st.count === 0) return;
    if (!armReset) { setArmReset(true); later(() => setArmReset(false), 2500); return; }
    setArmReset(false);
    setSt(s => ({ ...s, count: 0 }));
  };

  const back = () => (window.history.length > 1 ? router.back() : router.push('/'));

  return (
    <div className="tb">
      <header className="tb-top">
        <button className="tb-round" onClick={back} aria-label="Back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="tb-title">
          <h1>Tasbeeh</h1>
          <span>Tree of Dhikr</span>
        </div>
        <ThemeMenu current="tooba" className="tb-round" />
      </header>

      <DhikrCarousel
        current={st.dhikrId}
        custom={st.custom}
        count={st.count}
        onPick={(dhikrId, custom) => setSt(s => ({ ...s, dhikrId, custom: custom ?? s.custom, count: s.dhikrId === dhikrId ? s.count : 0 }))}
      />

      <section className={`tb-stage${full ? ' full' : ''}`} aria-label={`Your tree is ${Math.round(pct * 100)}% grown`}>
        <div className="tb-pill">
          <span className="material-symbols-outlined">eco</span>
          {Math.round(pct * 100)}% grown
        </div>
        {rounds > 0 && <div className="tb-pill tb-pill-r"><span className="material-symbols-outlined">park</span>{rounds}</div>}

        <TreeArt shown={shown} full={full} />
        {st.count === 0 && <p className="tb-empty">Begin your dhikr — every count grows a leaf</p>}

        {celebrate > 0 && (
          <div key={celebrate} className="tb-petals" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, i) => (
              <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * 0.18}s`, ['--drift' as string]: `${((i * 53) % 80) - 40}px` }} />
            ))}
          </div>
        )}

        {note && (
          <div className="tb-note" role="status">
            <b>{note.title}</b>
            {note.body && <span>{note.body}</span>}
          </div>
        )}
      </section>

      <section className="tb-counter" aria-label="Counter">
        <button className="tb-side" onClick={undo} disabled={st.count === 0} aria-label="Undo last count">
          <span className="material-symbols-outlined">undo</span>
        </button>

        <div className="tb-dial">
          <svg viewBox="0 0 220 220" className="tb-ring" aria-hidden="true">
            <defs>
              <linearGradient id="tb-prog" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#b7d3b0" />
                <stop offset="1" stopColor="#5f8b6b" />
              </linearGradient>
            </defs>
            <circle cx="110" cy="110" r={RING_R} className="tb-track" />
            <circle
              cx="110" cy="110" r={RING_R}
              className="tb-progress"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - pct)}
              transform="rotate(-90 110 110)"
            />
            {st.count > 0 && <circle cx={knob.x} cy={knob.y} r="6" className="tb-knob" />}
          </svg>
          <button className="tb-tap" onClick={tap} aria-label={`Count ${label}. ${st.count} so far, goal ${st.goal}`}>
            <span key={st.count} className="tb-num">{st.count.toLocaleString()}</span>
            <span className="tb-of">{inRound} of {st.goal}</span>
          </button>
          {flies.map(f => (
            <span key={f.id} className="tb-fly" style={{ ['--dx' as string]: `${f.dx}px` }} aria-hidden="true">
              <svg viewBox="0 0 14 10"><path d={'M0 5 C3 0.4, 9 -0.2, 13.5 5 C9 10.2, 3 9.6, 0 5 Z'} /></svg>
            </span>
          ))}
        </div>

        <button
          className={`tb-side${st.sound ? '' : ' off'}`}
          onClick={() => { if (!st.sound) drop(); setSt(s => ({ ...s, sound: !s.sound })); }}
          aria-pressed={st.sound}
          aria-label="Sound"
        >
          <span className="material-symbols-outlined">{st.sound ? 'volume_up' : 'volume_off'}</span>
        </button>
      </section>

      <section className="tb-goals" aria-label="Goal">
        <span className="tb-goals-label">Goal</span>
        <div className="tb-chips">
          {CHIP_GOALS.map(g => (
            <button key={g} className={`tb-chip${st.goal === g ? ' on' : ''}`} onClick={() => { setCustomGoal(false); setSt(s => ({ ...s, goal: g })); }}>
              {g}
            </button>
          ))}
          {customGoal ? (
            <GoalInput
              initial={CHIP_GOALS.includes(st.goal) ? '' : String(st.goal)}
              onDone={g => { if (g) setSt(s => ({ ...s, goal: g })); setCustomGoal(false); }}
            />
          ) : (
            <button className={`tb-chip${CHIP_GOALS.includes(st.goal) ? '' : ' on'}`} onClick={() => setCustomGoal(true)}>
              {CHIP_GOALS.includes(st.goal) ? <><span className="material-symbols-outlined">edit</span>Custom</> : st.goal}
            </button>
          )}
        </div>
      </section>

      <section className="tb-grove" aria-label="Your grove">
        <div className="tb-grove-head">
          <h2>Your grove</h2>
          <button className={`tb-reset${armReset ? ' armed' : ''}`} onClick={reset} disabled={st.count === 0}>
            <span className="material-symbols-outlined">restart_alt</span>
            {armReset ? 'Tap again to reset' : 'Reset'}
          </button>
        </div>
        <div className="tb-grove-row">
          {rounds === 0 ? (
            <p className="tb-grove-empty">Reach your goal to plant your first tree</p>
          ) : (
            <>
              {Array.from({ length: Math.min(rounds, GROVE_MAX) }).map((_, i) => (
                <MiniTree key={i} fresh={i === Math.min(rounds, GROVE_MAX) - 1 && celebrate > 0} />
              ))}
              {rounds > GROVE_MAX && <span className="tb-grove-more">+{rounds - GROVE_MAX}</span>}
            </>
          )}
        </div>
        <dl className="tb-stats">
          <div><dt>Today</dt><dd>{st.today.toLocaleString()}</dd></div>
          <div><dt>Trees</dt><dd>{rounds}</dd></div>
          <div><dt>Lifetime</dt><dd>{st.total.toLocaleString()}</dd></div>
        </dl>
      </section>
    </div>
  );
}

function GoalInput({ initial, onDone }: { initial: string; onDone: (g: number | null) => void }) {
  const [v, setV] = useState(initial);
  const n = parseInt(v, 10);
  const ok = Number.isFinite(n) && n > 0 && n <= 100000;
  return (
    <form className="tb-goal-form" onSubmit={e => { e.preventDefault(); onDone(ok ? n : null); }}>
      <input autoFocus inputMode="numeric" value={v} onChange={e => setV(e.target.value.replace(/\D/g, ''))} onBlur={() => onDone(ok ? n : null)} placeholder="e.g. 500" aria-label="Custom goal" />
    </form>
  );
}

/** Swipe to browse; tap a card to count it. Switching asks twice if you have a count going. */
function DhikrCarousel({ current, custom, count, onPick }: {
  current: string;
  custom: string;
  count: number;
  onPick: (id: string, custom?: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(0);
  const [armed, setArmed] = useState<string | null>(null);
  const [text, setText] = useState(custom);
  const items = [...DHIKR.map(d => d.id), CUSTOM_ID];

  // centre the selected card on first paint
  useEffect(() => {
    const el = ref.current;
    const i = Math.max(0, items.indexOf(current));
    const card = el?.children[i] as HTMLElement | undefined;
    if (el && card) el.scrollLeft = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2;
    setFocus(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0, bd = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const h = c as HTMLElement;
      const d = Math.abs(h.offsetLeft + h.offsetWidth / 2 - mid);
      if (d < bd) { bd = d; best = i; }
    });
    setFocus(best);
  };

  const choose = (id: string, c?: string) => {
    if (id === current && id !== CUSTOM_ID) return;
    if (count > 0 && armed !== id) { setArmed(id); setTimeout(() => setArmed(a => (a === id ? null : a)), 2600); return; }
    setArmed(null);
    onPick(id, c);
  };

  return (
    <div className="tb-carousel" ref={ref} onScroll={onScroll} role="listbox" aria-label="Choose dhikr">
      {DHIKR.map((d, i) => {
        const on = d.id === current;
        return (
          <button
            key={d.id}
            role="option"
            aria-selected={on}
            className={`tb-card${on ? ' on' : ''}${focus === i ? ' focus' : ''}`}
            onClick={() => choose(d.id)}
          >
            <span className="tb-card-ar" lang="ar" dir="rtl">{d.ar}</span>
            <b>{d.label}</b>
            <small>{d.meaning}</small>
            {on && <span className="tb-badge">Counting</span>}
            {armed === d.id && <span className="tb-armed">Tap again to start a new tree</span>}
          </button>
        );
      })}
      <div className={`tb-card tb-card-own${current === CUSTOM_ID ? ' on' : ''}${focus === items.length - 1 ? ' focus' : ''}`} role="option" aria-selected={current === CUSTOM_ID}>
        <span className="material-symbols-outlined">edit_note</span>
        <form onSubmit={e => { e.preventDefault(); if (text.trim()) choose(CUSTOM_ID, text.trim()); }}>
          <input value={text} onChange={e => setText(e.target.value)} maxLength={40} placeholder="Your own dhikr" aria-label="Custom dhikr" />
          <button type="submit" disabled={!text.trim()}>Use</button>
        </form>
        {current === CUSTOM_ID && <span className="tb-badge">Counting</span>}
        {armed === CUSTOM_ID && <span className="tb-armed">Tap Use again to start a new tree</span>}
      </div>
    </div>
  );
}
