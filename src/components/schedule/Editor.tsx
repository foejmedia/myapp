'use client';
/** Add / edit an activity. Time is either a clock time or "around a prayer". */
import { useEffect, useRef, useState } from 'react';
import type { DayWindows } from '@/lib/prayerTimes';
import {
  ANCHORS, ANCHOR_AR, CATS, REPEAT_LABEL, fromKey, fromMin, resolve, span, toMin,
  type Anchor, type Cat, type Repeat, type When,
} from '@/lib/schedule';
import { CatIcon, IconAnchor, IconClock, IconClose, IconTrash } from './icons';
import s from './schedule.module.css';

export interface Draft {
  id: string | null;
  title: string;
  cat: Cat;
  date: string;
  repeat: Repeat;
  note: string;
  when: When;
  /** the day that was clicked (for "remove this day only") */
  occurrenceDay: string;
}

const DURATIONS = [10, 15, 20, 30, 45, 60, 90, 120];
const SUGGEST: Record<Cat, string[]> = {
  salah: ['Duha prayer', 'Tahajjud', 'Taraweeh', 'Sunnah of Dhuhr'],
  quran: ['Read 1 juz', 'Revise memorised surahs', 'Surah Al-Kahf', 'Surah Al-Mulk'],
  study: ['Tafseer study', 'Fiqh class', 'Seerah reading', 'Arabic lesson'],
  dhikr: ['Morning adhkar', 'Evening adhkar', 'Istighfar', 'Dua before iftar'],
  fast: ['Suhoor', 'Iftar', 'Prepare iftar'],
  life: ['Family time', 'Work', 'Exercise', 'Sleep'],
};

export default function Editor({
  draft, times, onCancel, onSave, onDelete,
}: {
  draft: Draft;
  times: Record<string, DayWindows>;
  onCancel: () => void;
  onSave: (d: Draft) => void;
  onDelete: (d: Draft, onlyThisDay: boolean) => void;
}) {
  const [d, setD] = useState<Draft>(draft);
  const titleRef = useRef<HTMLInputElement>(null);
  const set = (p: Partial<Draft>) => setD(prev => ({ ...prev, ...p }));

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const t = times[d.date];
  const r = resolve(d.when, t);
  const isPrayer = d.when.kind === 'prayer';

  /* switching modes keeps the same rough time */
  const toClock = () => set({ when: { kind: 'at', start: fromMin(r.start), end: fromMin(r.end) } });
  const toPrayer = () => {
    // pick the prayer just before the current start, offset from it
    const startOf = (a: Anchor) => resolve({ kind: 'prayer', anchor: a, offset: 0, duration: 0 }, t).start;
    let anchor: Anchor = 'Fajr';
    for (const a of ANCHORS) if (startOf(a) <= r.start) anchor = a;
    const at = startOf(anchor);
    set({ when: { kind: 'prayer', anchor, offset: Math.max(0, Math.round((r.start - at) / 5) * 5), duration: Math.max(10, r.end - r.start) } });
  };

  const w = d.when;
  const rel = w.kind === 'prayer' ? (w.offset < 0 ? 'before' : w.offset > 0 ? 'after' : 'at') : 'at';
  const setPrayer = (p: Partial<{ anchor: Anchor; offset: number; duration: number }>) => {
    if (w.kind !== 'prayer') return;
    set({ when: { ...w, ...p } });
  };

  const valid = d.title.trim().length > 0 && (w.kind === 'prayer' || toMin(w.end) > toMin(w.start));
  const dayName = fromKey(d.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className={s.modalBack} onMouseDown={e => e.target === e.currentTarget && onCancel()}>
      <form
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ed-title"
        onSubmit={e => {
          e.preventDefault();
          if (valid) onSave(d);
        }}
      >
        <div className={s.modalHead}>
          <h2 id="ed-title">{d.id ? 'Edit activity' : 'New activity'}</h2>
          <button type="button" className={s.iconBtn} onClick={onCancel} aria-label="Close">
            <IconClose />
          </button>
        </div>

        <div className={s.modalBody}>
          <label className={s.field}>
            <span className={s.label}>Title</span>
            <input
              ref={titleRef}
              className={s.titleInput}
              value={d.title}
              onChange={e => set({ title: e.target.value })}
              placeholder="e.g. Revise Surah Al-Mulk"
              maxLength={80}
              list="sc-suggest"
            />
            <datalist id="sc-suggest">
              {SUGGEST[d.cat].map(x => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </label>

          <fieldset className={s.field}>
            <legend className={s.label}>Category</legend>
            <div className={s.catPick}>
              {CATS.map(c => (
                <label key={c.key} className={`${s.catChip} ${s[`c_${c.key}`]}`}>
                  <input type="radio" name="cat" checked={d.cat === c.key} onChange={() => set({ cat: c.key })} />
                  <span>
                    <CatIcon cat={c.key} /> {c.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={s.fieldRow}>
            <label className={s.field}>
              <span className={s.label}>{d.repeat === 'none' ? 'Date' : 'Starts on'}</span>
              <input type="date" className={s.input} value={d.date} onChange={e => e.target.value && set({ date: e.target.value })} />
            </label>
            <label className={s.field}>
              <span className={s.label}>Repeat</span>
              <select className={s.input} value={d.repeat} onChange={e => set({ repeat: e.target.value as Repeat })}>
                {(Object.keys(REPEAT_LABEL) as Repeat[]).map(k => (
                  <option key={k} value={k}>
                    {REPEAT_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className={s.field}>
            <legend className={s.label}>Time</legend>
            <div className={s.modeSeg}>
              <button type="button" aria-pressed={!isPrayer} onClick={() => isPrayer && toClock()}>
                <IconClock /> Clock time
              </button>
              <button type="button" aria-pressed={isPrayer} onClick={() => !isPrayer && toPrayer()}>
                <IconAnchor /> Around a prayer
              </button>
            </div>

            {w.kind === 'at' ? (
              <div className={s.fieldRow}>
                <label className={s.field}>
                  <span className={s.subLabel}>From</span>
                  <input type="time" className={s.input} value={w.start} step={300} onChange={e => e.target.value && set({ when: { ...w, start: e.target.value } })} />
                </label>
                <label className={s.field}>
                  <span className={s.subLabel}>To</span>
                  <input type="time" className={s.input} value={w.end} step={300} onChange={e => e.target.value && set({ when: { ...w, end: e.target.value } })} />
                </label>
              </div>
            ) : (
              <>
                <div className={s.prayerRow}>
                  {rel !== 'at' && (
                    <label className={s.minBox}>
                      <input
                        type="number"
                        className={s.input}
                        min={5}
                        max={300}
                        step={5}
                        value={Math.abs(w.offset)}
                        onChange={e => {
                          const n = Math.max(0, Math.min(300, Number(e.target.value) || 0));
                          setPrayer({ offset: rel === 'before' ? -n : n });
                        }}
                        aria-label="Minutes"
                      />
                      <span>min</span>
                    </label>
                  )}
                  <select
                    className={s.input}
                    value={rel}
                    aria-label="Before or after"
                    onChange={e => {
                      const v = e.target.value;
                      const n = Math.abs(w.offset) || 15;
                      setPrayer({ offset: v === 'at' ? 0 : v === 'before' ? -n : n });
                    }}
                  >
                    <option value="before">before</option>
                    <option value="at">at</option>
                    <option value="after">after</option>
                  </select>
                  <select className={s.input} value={w.anchor} aria-label="Prayer" onChange={e => setPrayer({ anchor: e.target.value as Anchor })}>
                    {ANCHORS.map(a => (
                      <option key={a} value={a}>
                        {a} {ANCHOR_AR[a]}
                      </option>
                    ))}
                  </select>
                </div>
                <label className={`${s.field} ${s.durField}`}>
                  <span className={s.subLabel}>Lasts</span>
                  <select className={s.input} value={w.duration} onChange={e => setPrayer({ duration: Number(e.target.value) })}>
                    {[...new Set([...DURATIONS, w.duration])].sort((a, b) => a - b).map(m => (
                      <option key={m} value={m}>
                        {m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}

            <p className={s.preview}>
              {dayName}: <b>{span(r.start, r.end)}</b>
              {isPrayer && <span> · moves with {w.kind === 'prayer' ? w.anchor : ''} each day{t ? '' : ' (estimated until prayer times load)'}</span>}
            </p>
          </fieldset>

          <label className={s.field}>
            <span className={s.label}>Note <em>optional</em></span>
            <textarea className={s.input} rows={2} value={d.note} onChange={e => set({ note: e.target.value })} placeholder="Which surah, page, teacher…" maxLength={300} />
          </label>
        </div>

        <div className={s.modalFoot}>
          {d.id && (
            <div className={s.delGroup}>
              {draft.repeat !== 'none' && (
                <button type="button" className={s.dangerGhost} onClick={() => onDelete(d, true)}>
                  Skip this day
                </button>
              )}
              <button type="button" className={s.dangerGhost} onClick={() => onDelete(d, false)}>
                <IconTrash /> {draft.repeat !== 'none' ? 'Delete all' : 'Delete'}
              </button>
            </div>
          )}
          <span className={s.spacer} />
          <button type="button" className={s.ghostBtn} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className={s.primaryBtn} disabled={!valid}>
            {d.id ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}
