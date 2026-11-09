'use client';
/** Full-screen focus mode for lessons, quizzes and reviews: Esc closes, focus stays inside, page behind doesn't scroll. */
import { useEffect, useRef } from 'react';
import { IconClose } from './Icons';
import { stopAudio } from './ui';
import s from '../learn.module.css';

export default function Overlay({ label, onClose, children, aside }: { label: string; onClose: () => void; children: React.ReactNode; aside?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
      if (e.key !== 'Tab' || !ref.current) return;
      const f = [...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])')];
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      stopAudio();
      prevFocus?.focus?.();
    };
  }, []);

  return (
    <div className={s.overlay} role="dialog" aria-modal="true" aria-label={label} ref={ref}>
      <div className={s.overlayTop}>
        <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Close">
          <IconClose className={s.i20} />
        </button>
        <div className={s.overlayAside}>{aside}</div>
      </div>
      <div className={s.overlayBody}>{children}</div>
    </div>
  );
}
