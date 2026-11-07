'use client';
/** A quiet walled corner: memory trees for people you make dua for. No counts, device only. */
import { useState } from 'react';
import { TEXTS } from '../content/dhikr';
import { randomSeed } from '../lib/storage';
import { useGarden } from '../state/GardenProvider';
import { PlantShape } from './Plant';
import s from '../game.module.css';

export default function DuaGarden() {
  const { state, dispatch, ready } = useGarden();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [made, setMade] = useState<string[]>([]);

  const trees = state.duaTrees;

  return (
    <div className={s.panelStack}>
      <h1 className={s.pageTitle}>The Dua Garden</h1>
      <p className={s.lead}>
        Plant a memory tree for someone: a parent, a friend, a relative who has passed away. Each visit is an invitation to make
        dua for them. These trees never show counts, and they stay only on this device.
      </p>
      <p className={s.refLine}>
        {TEXTS.duaInAbsence.body} ({TEXTS.duaInAbsence.ref})
      </p>

      <div className={s.duaWall} role="list" aria-label="Memory trees">
        {ready && trees.length === 0 && <p className={s.duaEmpty}>The walled garden is quiet. Plant the first tree below.</p>}
        {trees.map(t => (
          <div key={t.id} role="listitem" className={s.duaTree}>
            <button
              type="button"
              className={s.duaTreeBtn}
              aria-expanded={open === t.id}
              onClick={() => setOpen(open === t.id ? null : t.id)}
            >
              <svg viewBox="-50 -100 100 106" aria-hidden className={made.includes(t.id) ? s.duaGlow : undefined}>
                <ellipse cx={0} cy={2} rx={22} ry={5} fill="rgba(48,58,26,.22)" />
                <PlantShape species="olive" stage="tree" seed={`dua:${t.id}`} />
              </svg>
              <span>{t.name}</span>
            </button>
          </div>
        ))}
      </div>

      {trees
        .filter(t => t.id === open)
        .map(t => (
          <section key={t.id} className={s.card} aria-live="polite">
            <h2 className={s.cardTitle}>{t.name}</h2>
            {t.note && <p className={s.reflection}>{t.note}</p>}
            <p>Take a moment now to make dua for {t.name}, in your own words.</p>
            <div className={s.rowBtns}>
              <button type="button" className={s.primaryBtn} onClick={() => setMade(m => [...m, t.id])}>
                I made dua for them
              </button>
              <button
                type="button"
                className={s.dangerBtn}
                onClick={() => {
                  if (window.confirm(`Remove the tree for ${t.name}?`)) {
                    dispatch({ type: 'removeDuaTree', id: t.id });
                    setOpen(null);
                  }
                }}
              >
                Remove tree
              </button>
            </div>
            {made.includes(t.id) && <p className={s.note}>May Allah accept it, for them and for you.</p>}
          </section>
        ))}

      <form
        className={s.card}
        onSubmit={e => {
          e.preventDefault();
          const n = name.trim();
          if (!n) return;
          dispatch({
            type: 'addDuaTree',
            tree: { id: randomSeed(), name: n.slice(0, 60), ...(note.trim() ? { note: note.trim().slice(0, 280) } : {}), createdAt: new Date().toISOString() },
          });
          setName('');
          setNote('');
        }}
      >
        <h2 className={s.cardTitle}>Plant a memory tree</h2>
        <label className={s.field}>
          <span>Name</span>
          <input value={name} onChange={e => setName(e.target.value)} maxLength={60} required />
        </label>
        <label className={s.field}>
          <span>A short note (optional)</span>
          <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={280} rows={2} />
        </label>
        <button type="submit" className={s.primaryBtn} disabled={!ready}>
          Plant
        </button>
      </form>
    </div>
  );
}
