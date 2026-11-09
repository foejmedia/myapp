'use client';
/** Small reusable pieces shared by every Learn in 1 Minute screen. */
import Link from 'next/link';
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { describe, kindOf, KIND_LABEL } from '../lib/items';
import { useLearn } from '../store/LearnProvider';
import { IconBookmark, IconPause, IconPencil, IconSpeaker } from './Icons';
import { KindIcon } from './TrackIcon';
import s from '../learn.module.css';

/* ---------- audio: one clip at a time across the app ---------- */

type AudioState = { src: string | null; state: 'idle' | 'loading' | 'playing' | 'error' };
let audioState: AudioState = { src: null, state: 'idle' };
let player: HTMLAudioElement | null = null;
const listeners = new Set<() => void>();
const setAudio = (next: AudioState) => {
  audioState = next;
  listeners.forEach(l => l());
};

export function playAudio(src: string) {
  if (!player) {
    player = new Audio();
    player.preload = 'auto';
    player.addEventListener('playing', () => setAudio({ src: player!.src, state: 'playing' }));
    player.addEventListener('ended', () => setAudio({ src: null, state: 'idle' }));
    player.addEventListener('pause', () => audioState.state === 'playing' && setAudio({ src: null, state: 'idle' }));
    player.addEventListener('error', () => setAudio({ src: player!.src, state: 'error' }));
  }
  if (audioState.src === src && audioState.state === 'playing') {
    player.pause();
    return;
  }
  player.src = src;
  setAudio({ src, state: 'loading' });
  player.play().catch(() => setAudio({ src, state: 'error' }));
}

export function stopAudio() {
  player?.pause();
}

function useAudio() {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => audioState,
    () => audioState,
  );
}

export function AudioButton({ src, label, text, small }: { src: string | null | undefined; label: string; text?: string; small?: boolean }) {
  const a = useAudio();
  if (!src) return null;
  const mine = a.src === src;
  const state = mine ? a.state : 'idle';
  return (
    <button
      type="button"
      className={`${text ? s.audioBtnText : s.audioBtn} ${small ? s.audioSmall : ''} ${state === 'playing' ? s.audioOn : ''}`}
      onClick={e => {
        e.stopPropagation();
        playAudio(src);
      }}
      aria-label={state === 'playing' ? `Stop ${label}` : `Play ${label}`}
      aria-pressed={state === 'playing'}
      title={state === 'error' ? 'Audio could not be loaded. Check your connection.' : undefined}
    >
      {state === 'loading' ? <span className={s.spinner} aria-hidden /> : state === 'playing' ? <IconPause className={s.i18} /> : <IconSpeaker className={s.i18} />}
      {text && <span>{state === 'error' ? 'Audio unavailable' : text}</span>}
    </button>
  );
}

/* ---------- notebook controls ---------- */

export function SaveButton({ itemId, withText = false }: { itemId: string; withText?: boolean }) {
  const { data, dispatch, status } = useLearn();
  const saved = !!data.saved[itemId];
  const name = describe(itemId)?.title ?? 'item';
  return (
    <button
      type="button"
      className={`${withText ? s.btnGhost : s.iconBtn} ${saved ? s.savedOn : ''}`}
      aria-pressed={saved}
      aria-label={withText ? undefined : saved ? `Remove ${name} from notebook` : `Save ${name} to notebook`}
      disabled={status !== 'ready'}
      onClick={e => {
        e.stopPropagation();
        dispatch({ type: 'toggleSave', itemId, at: new Date().toISOString() });
      }}
    >
      <IconBookmark className={s.i18} filled={saved} />
      {withText && (saved ? 'Saved' : 'Save')}
    </button>
  );
}

export function NoteEditor({ itemId, compact }: { itemId: string; compact?: boolean }) {
  const { data, dispatch } = useLearn();
  const note = data.notes[itemId]?.text ?? '';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);
  useEffect(() => setDraft(note), [note]);

  if (!editing) {
    return note ? (
      <div className={s.noteView}>
        <p>{note}</p>
        <button type="button" className={s.linkBtn} onClick={() => setEditing(true)}>
          <IconPencil className={s.i14} /> Edit note
        </button>
      </div>
    ) : (
      <button type="button" className={compact ? s.linkBtn : s.btnGhost} onClick={() => setEditing(true)}>
        <IconPencil className={s.i16} /> Add a note
      </button>
    );
  }
  const save = () => {
    dispatch({ type: 'setNote', itemId, text: draft, at: new Date().toISOString() });
    setEditing(false);
  };
  return (
    <div className={s.noteEdit}>
      <label htmlFor={id} className={s.srOnly}>
        Personal note
      </label>
      <textarea
        id={id}
        ref={ref}
        rows={3}
        maxLength={2000}
        value={draft}
        placeholder="Write a reflection, a reminder or how you will use this…"
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
      <div className={s.row}>
        <button type="button" className={s.btnPrimarySm} onClick={save}>
          Save note
        </button>
        <button
          type="button"
          className={s.linkBtn}
          onClick={() => {
            setDraft(note);
            setEditing(false);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ---------- layout pieces ---------- */

export function PageHeader({ eyebrow, title, lead, actions }: { eyebrow?: string; title: string; lead?: string; actions?: React.ReactNode }) {
  return (
    <header className={s.pageHead}>
      <div>
        {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
        <h1 className={s.pageTitle}>{title}</h1>
        {lead && <p className={s.lead}>{lead}</p>}
      </div>
      {actions && <div className={s.pageActions}>{actions}</div>}
    </header>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className={s.empty}>
      {icon && <span className={s.emptyIcon}>{icon}</span>}
      <p className={s.emptyTitle}>{title}</p>
      {body && <p className={s.emptyBody}>{body}</p>}
      {action}
    </div>
  );
}

export const Skeleton = ({ h = 16, w = '100%', r = 10 }: { h?: number; w?: number | string; r?: number }) => (
  <span className={s.skeleton} style={{ height: h, width: w, borderRadius: r }} aria-hidden />
);

export function Progress({ value, label, tone = 'primary' }: { value: number; label: string; tone?: 'primary' | 'gold' }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={s.progress} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <span className={tone === 'gold' ? s.progressGold : undefined} style={{ width: `${Math.max(pct, value > 0 ? 2 : 0)}%` }} />
    </div>
  );
}

export function KindChip({ itemId }: { itemId: string }) {
  const k = kindOf(itemId);
  return (
    <span className={`${s.chip} ${s[`chip_${k}`]}`}>
      <KindIcon kind={k} className={s.i14} /> {KIND_LABEL[k]}
    </span>
  );
}

export function ItemLink({ itemId }: { itemId: string }) {
  const d = describe(itemId);
  if (!d) return null;
  return (
    <Link href={d.href} className={s.itemLink}>
      <span className={s.itemLinkAr} lang="ar" dir="rtl">
        {d.arabic}
      </span>
      <span>{d.title}</span>
    </Link>
  );
}

/** Shows a calm placeholder until storage has been read (no hydration mismatch). */
export function Ready({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { status, clock } = useLearn();
  if (status !== 'ready' || !clock) {
    return (
      fallback ?? (
        <div className={s.loadingStack} aria-busy="true" aria-label="Loading">
          <Skeleton h={34} w="45%" />
          <Skeleton h={18} w="70%" />
          <Skeleton h={160} r={22} />
          <Skeleton h={120} r={22} />
        </div>
      )
    );
  }
  return <>{children}</>;
}
