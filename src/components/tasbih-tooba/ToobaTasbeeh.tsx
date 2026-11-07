'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import TreeArt, { MiniTree } from './TreeArt';
import ThemeMenu from '../tasbih-themes/ThemeMenu';
import {
  CUSTOM_ID, DHIKR, lastDays, progressOf, roundProgress, streak, type TasbihState,
} from '@/lib/tasbih';
import { leavesShown } from '@/lib/tasbih-tree';
import { speciesOf, treeOf } from '@/lib/tasbih-species';
import { buzz, tone, useTasbih } from '@/lib/useTasbih';
import './tooba.css';

const RING_R = 92;
const RING_C = 2 * Math.PI * RING_R;
const HADITH_ID = 'subhanallahibihamdihi';
const CHIP_GOALS = [33, 99, 100, 313, 1000];
const GROVE_SHOW = 24;

/** A soft water-drop "plip". */
const drop = () => tone(1250, 0.09, 0.05, 0, 'sine', 0.45);
/** A rising, airy chime. */
const bloom = () => [587.33, 739.99, 880, 1174.66].forEach((f, i) => tone(f, 1.3, 0.04, i * 0.08, 'sine', 0.998));

const labelOf = (s: TasbihState, id: string) =>
  id === CUSTOM_ID ? s.custom || 'Your own dhikr' : DHIKR.find(d => d.id === id)?.label ?? 'Dhikr';

interface Note { title: string; body?: string }
interface Fly { id: number; dx: number }

export default function ToobaTasbeeh() {
  const router = useRouter();
  const [celebrate, setCelebrate] = useState(0);
  const [note, setNote] = useState<Note | null>(null);
  const [flies, setFlies] = useState<Fly[]>([]);
  const [armReset, setArmReset] = useState(false);
  const [customGoal, setCustomGoal] = useState(false);
  const [groveTab, setGroveTab] = useState<'today' | 'all'>('today');
  const flyId = useRef(0);
  const noteTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
  useEffect(() => () => { timers.current.forEach(clearTimeout); clearTimeout(noteTimer.current); }, []);

  const show = (n: Note, ms = 3800) => {
    setNote(n);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(null), ms);
  };

  const { st, setSt, tap, undo, switchTo } = useTasbih((next, hit) => {
    if (next.sound) (hit ? bloom : drop)();
    if (next.haptics) buzz(hit ? [25, 60, 25, 60, 50] : 9);
    const id = ++flyId.current;
    setFlies(f => [...f.slice(-6), { id, dx: Math.round((Math.random() - 0.5) * 60) }]);
    later(() => setFlies(f => f.filter(x => x.id !== id)), 900);
    if (hit) {
      const sp = speciesOf(next.dhikrId);
      setCelebrate(c => c + 1);
      show(next.dhikrId === HADITH_ID
        ? { title: `A ${sp.name.toLowerCase()} is planted in your grove`, body: '“Whoever says SubhanAllahi wa bihamdihi, a palm tree is planted for him in Paradise.” — Tirmidhi 3464' }
        : { title: `MashaAllah — your ${sp.name.toLowerCase()} is in full bloom`, body: `It has been planted in your grove. Keep going to grow the next one.` }, 4600);
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

  // keep the screen awake while counting, if asked
  const [wakeSupported, setWakeSupported] = useState(false);
  useEffect(() => setWakeSupported('wakeLock' in navigator), []);
  useEffect(() => {
    if (!st.wake || !wakeSupported) return;
    let lock: WakeLockSentinel | null = null;
    let alive = true;
    const acquire = async () => {
      try {
        if (document.visibilityState === 'visible') lock = await navigator.wakeLock.request('screen');
        if (!alive) void lock?.release();
      } catch { /* denied, e.g. battery saver */ }
    };
    void acquire();
    const onVis = () => { if (document.visibilityState === 'visible') void acquire(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { alive = false; document.removeEventListener('visibilitychange', onVis); void lock?.release(); };
  }, [st.wake, wakeSupported]);

  const sp = speciesOf(st.dhikrId);
  const slots = treeOf(sp).slots.length;
  const pct = roundProgress(st.count, st.goal);
  const shown = leavesShown(st.count, st.goal, slots);
  const inRound = st.count === 0 ? 0 : ((st.count - 1) % st.goal) + 1;
  const full = pct >= 1;
  const preset = DHIKR.find(d => d.id === st.dhikrId);
  const label = labelOf(st, st.dhikrId);
  const planted = st.grove.filter(g => g.d === st.dhikrId).length;
  const knob = useMemo(() => {
    const a = pct * Math.PI * 2 - Math.PI / 2;
    return { x: 110 + Math.cos(a) * RING_R, y: 110 + Math.sin(a) * RING_R };
  }, [pct]);

  const pick = (id: string, custom?: string) => {
    if (id === st.dhikrId && custom === undefined) return;
    const next = switchTo(id, custom);
    const nsp = speciesOf(id);
    const name = labelOf(next, id);
    const trees = next.grove.filter(g => g.d === id).length;
    if (next.count === 0 && trees === 0) {
      show({ title: `A new ${nsp.name.toLowerCase()} for ${name}`, body: 'A seedling is planted — every count grows a leaf.' }, 3200);
    } else if (id !== st.dhikrId) {
      show({ title: `Back to your ${nsp.name.toLowerCase()}`, body: `${name} · ${next.count === 0 ? 0 : ((next.count - 1) % next.goal) + 1} of ${next.goal}${trees ? ` · ${trees} planted` : ''}` }, 2800);
    }
  };

  const reset = () => {
    if (st.count === 0) return;
    if (!armReset) { setArmReset(true); later(() => setArmReset(false), 2500); return; }
    setArmReset(false);
    setSt(s => ({ ...s, count: 0 }));
    show({ title: 'Tree reset', body: 'Trees you planted stay in your grove.' }, 2400);
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

      <div className="tb-layout">
        <div className="tb-left">
          {/* ── current dhikr ── */}
          <section className="tb-hero" style={{ ['--bloom' as string]: sp.blossom }} aria-live="polite">
            <div className="tb-hero-top">
              <span className="tb-species"><i />{sp.name}</span>
              {planted > 0 && <span className="tb-planted"><span className="material-symbols-outlined">park</span>{planted} planted</span>}
            </div>
            {preset?.ar && st.dhikrId !== CUSTOM_ID && <p className="tb-hero-ar" lang="ar" dir="rtl">{preset.ar}</p>}
            <p className={st.dhikrId === CUSTOM_ID ? 'tb-hero-own' : 'tb-hero-label'}>{label}</p>
            {preset?.meaning && st.dhikrId !== CUSTOM_ID && <p className="tb-hero-meaning">{preset.meaning}</p>}
          </section>

          <DhikrChips state={st} onPick={pick} />

          {/* ── the tree ── */}
          <section className={`tb-stage${full ? ' full' : ''}`} aria-label={`Your ${sp.name} is ${Math.round(pct * 100)}% grown`}>
            <div className="tb-pill">
              <span className="material-symbols-outlined">eco</span>
              {Math.round(pct * 100)}% grown
            </div>
            <TreeArt sp={sp} shown={shown} full={full} />
            {st.count === 0 && !note && <p className="tb-empty">Begin your dhikr — every count grows a leaf</p>}

            {celebrate > 0 && (
              <div key={celebrate} className="tb-petals" aria-hidden="true" style={{ ['--petal' as string]: sp.blossom }}>
                {Array.from({ length: 16 }).map((_, i) => (
                  <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * 0.18}s`, ['--drift' as string]: `${((i * 53) % 80) - 40}px` }} />
                ))}
              </div>
            )}

            {note && (
              <div key={note.title} className="tb-note" role="status">
                <b>{note.title}</b>
                {note.body && <span>{note.body}</span>}
              </div>
            )}
          </section>
        </div>

        <div className="tb-right">
          {/* ── counter ── */}
          <section className="tb-counter" aria-label="Counter">
            <button className="tb-side" onClick={undo} disabled={st.count === 0} aria-label="Undo last count" title="Undo (Backspace)">
              <span className="material-symbols-outlined">undo</span>
            </button>
            <div className="tb-dial">
              <svg viewBox="0 0 220 220" className="tb-ring" aria-hidden="true">
                <defs>
                  <linearGradient id="tb-prog" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#7fd396" />
                    <stop offset="1" stopColor="#16a34a" />
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
                  <svg viewBox="0 0 14 10"><path d="M0 5 C3 0.4, 9 -0.2, 13.5 5 C9 10.2, 3 9.6, 0 5 Z" /></svg>
                </span>
              ))}
            </div>
            <button className={`tb-side${armReset ? ' armed' : ''}`} onClick={reset} disabled={st.count === 0} aria-label={armReset ? 'Tap again to reset this tree' : 'Reset this tree'} title="Reset this tree">
              <span className="material-symbols-outlined">restart_alt</span>
            </button>
          </section>
          <p className={`tb-hint${armReset ? ' warn' : ''}`}>
            {armReset ? 'Tap reset again to start this tree over' : 'Tap the circle · Space on a keyboard'}
          </p>

          {/* ── goal ── */}
          <section className="tb-panel" aria-label="Goal">
            <h2 className="tb-h">Goal for this tree</h2>
            <div className="tb-chips">
              {CHIP_GOALS.map(g => (
                <button key={g} className={`tb-chip${st.goal === g ? ' on' : ''}`} aria-pressed={st.goal === g} onClick={() => { setCustomGoal(false); setSt(s => ({ ...s, goal: g })); }}>
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

            <div className="tb-toggles">
              <Toggle icon={st.sound ? 'volume_up' : 'volume_off'} label="Sound" on={st.sound} onClick={() => { if (!st.sound) drop(); setSt(s => ({ ...s, sound: !s.sound })); }} />
              <Toggle icon="vibration" label="Vibrate" on={st.haptics} onClick={() => { if (!st.haptics) buzz(15); setSt(s => ({ ...s, haptics: !s.haptics })); }} />
              <Toggle
                icon="light_mode"
                label="Screen on"
                on={st.wake && wakeSupported}
                disabled={!wakeSupported}
                title={wakeSupported ? 'Keep the screen awake while counting' : 'Not supported in this browser'}
                onClick={() => setSt(s => ({ ...s, wake: !s.wake }))}
              />
            </div>
          </section>

          <Grove state={st} tab={groveTab} setTab={setGroveTab} fresh={celebrate} />
          <Week state={st} />
        </div>
      </div>
    </div>
  );
}

function Toggle({ icon, label, on, onClick, disabled, title }: {
  icon: string; label: string; on: boolean; onClick: () => void; disabled?: boolean; title?: string;
}) {
  return (
    <button className={`tb-toggle${on ? ' on' : ''}`} onClick={onClick} aria-pressed={on} disabled={disabled} title={title}>
      <span className="material-symbols-outlined">{icon}</span>
      {label}
      <i aria-hidden="true" />
    </button>
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

/** One chip per dhikr, each showing its own tree's progress. */
function DhikrChips({ state, onPick }: { state: TasbihState; onPick: (id: string, custom?: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(state.custom);
  const ids = [...DHIKR.map(d => d.id), ...(state.custom ? [CUSTOM_ID] : [])];
  const ref = useRef<HTMLDivElement>(null);

  // keep the active chip in view
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('.tb-dchip.on');
    const box = ref.current;
    if (el && box) box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' });
  }, [state.dhikrId]);

  return (
    <div className="tb-dchips" ref={ref} role="tablist" aria-label="Choose dhikr — each grows its own tree">
      {ids.map(id => {
        const p = progressOf(state, id);
        const sp = speciesOf(id);
        const frac = roundProgress(p.count, p.goal);
        const on = id === state.dhikrId;
        return (
          <button key={id} role="tab" aria-selected={on} className={`tb-dchip${on ? ' on' : ''}`} onClick={() => onPick(id)} title={`${sp.name} · ${p.count} counted`}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="10" cy="10" r="7.5" className="tb-dchip-track" />
              <circle cx="10" cy="10" r="7.5" className="tb-dchip-prog" strokeDasharray={47.1} strokeDashoffset={47.1 * (1 - frac)} transform="rotate(-90 10 10)" />
              <circle cx="10" cy="10" r="3.4" fill={sp.blossom} stroke="rgba(0,0,0,0.08)" strokeWidth="0.6" />
            </svg>
            {labelOf(state, id)}
          </button>
        );
      })}
      {editing ? (
        <form className="tb-own" onSubmit={e => { e.preventDefault(); if (text.trim()) { onPick(CUSTOM_ID, text.trim()); setEditing(false); } }}>
          <input autoFocus value={text} onChange={e => setText(e.target.value)} maxLength={40} placeholder="Your own dhikr" aria-label="Your own dhikr" onBlur={() => !text.trim() && setEditing(false)} />
          <button type="submit" disabled={!text.trim()} aria-label="Use"><span className="material-symbols-outlined">check</span></button>
        </form>
      ) : (
        <button className="tb-dchip tb-dchip-add" onClick={() => setEditing(true)}>
          <span className="material-symbols-outlined">add</span>{state.custom ? 'Rename own' : 'Your own'}
        </button>
      )}
    </div>
  );
}

function Grove({ state, tab, setTab, fresh }: {
  state: TasbihState; tab: 'today' | 'all'; setTab: (t: 'today' | 'all') => void; fresh: number;
}) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const list = tab === 'today' ? state.grove.filter(g => g.t >= start.getTime()) : state.grove;
  const visible = list.slice(-GROVE_SHOW);
  const tally = new Map<string, number>();
  for (const g of list) tally.set(g.d, (tally.get(g.d) ?? 0) + 1);

  return (
    <section className="tb-panel tb-grove" aria-label="Your grove">
      <div className="tb-grove-head">
        <h2 className="tb-h">Your grove</h2>
        <div className="tb-tabs" role="tablist">
          {(['today', 'all'] as const).map(t => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              {t === 'today' ? 'Today' : 'All time'}
            </button>
          ))}
        </div>
      </div>
      <div className="tb-grove-row">
        {visible.length === 0 ? (
          <p className="tb-grove-empty">{tab === 'today' ? 'Reach a goal to plant today’s first tree' : 'Your planted trees will grow here'}</p>
        ) : (
          <>
            {list.length > GROVE_SHOW && <span className="tb-grove-more">+{list.length - GROVE_SHOW}</span>}
            {visible.map((g, i) => (
              <MiniTree
                key={`${g.t}-${i}`}
                sp={speciesOf(g.d)}
                fresh={fresh > 0 && i === visible.length - 1}
                title={`${speciesOf(g.d).name} · ${labelOf(state, g.d)} · ${new Date(g.t).toLocaleString()}`}
              />
            ))}
          </>
        )}
      </div>
      {tally.size > 0 && (
        <ul className="tb-tally">
          {[...tally.entries()].sort((a, b) => b[1] - a[1]).map(([d, n]) => (
            <li key={d}>
              <i style={{ background: speciesOf(d).blossom }} />
              <span>{speciesOf(d).name}</span>
              <small>{labelOf(state, d)}</small>
              <b>×{n}</b>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Week({ state }: { state: TasbihState }) {
  const days = lastDays(state.history, 7);
  const max = Math.max(1, ...days.map(d => d.count));
  const s = streak(state.history);
  const best = Math.max(0, ...Object.values(state.history));
  return (
    <section className="tb-panel tb-week" aria-label="This week">
      <div className="tb-grove-head">
        <h2 className="tb-h">This week</h2>
        <span className={`tb-streak${s ? ' on' : ''}`}>
          <span className="material-symbols-outlined">local_fire_department</span>
          {s} day{s === 1 ? '' : 's'} streak
        </span>
      </div>
      <div className="tb-bars">
        {days.map(d => (
          <div key={d.iso} className={`tb-bar${d.today ? ' today' : ''}`} title={`${d.iso}: ${d.count}`}>
            <small>{d.count ? d.count.toLocaleString() : ''}</small>
            <span><i style={{ height: `${(d.count / max) * 100}%` }} /></span>
            <b>{d.label}</b>
          </div>
        ))}
      </div>
      <dl className="tb-stats">
        <div><dt>Today</dt><dd>{state.today.toLocaleString()}</dd></div>
        <div><dt>Best day</dt><dd>{best.toLocaleString()}</dd></div>
        <div><dt>Lifetime</dt><dd>{state.total.toLocaleString()}</dd></div>
      </dl>
    </section>
  );
}
