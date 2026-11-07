'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import './theme-menu.css';

export type TasbihTheme = 'garden' | 'tooba' | 'noor';

const THEMES: { id: TasbihTheme; href: string; name: string; sub: string; icon: string }[] = [
  { id: 'tooba', href: '/tasbih/tooba', name: 'Tooba', sub: 'Grow a tree of dhikr', icon: 'park' },
  { id: 'garden', href: '/tasbih', name: 'Garden', sub: 'A flower for every count', icon: 'local_florist' },
  { id: 'noor', href: '/tasbih/noor', name: 'Noor', sub: 'Light a star at night', icon: 'dark_mode' },
];

/** Theme switcher shared by every tasbeeh page. All themes share one count. */
export default function ThemeMenu({ current, className }: { current: TasbihTheme; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="ttm" ref={ref}>
      <button className={className} onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="menu" aria-label="Change theme">
        <span className="material-symbols-outlined">palette</span>
      </button>
      {open && (
        <div className="ttm-pop" role="menu">
          <p className="ttm-head">Theme · your count carries over</p>
          {THEMES.map(t => (
            <Link key={t.id} href={t.href} role="menuitem" className={`ttm-item${t.id === current ? ' on' : ''}`} aria-current={t.id === current ? 'page' : undefined} onClick={() => setOpen(false)}>
              <span className={`ttm-ic ttm-ic-${t.id}`}><span className="material-symbols-outlined">{t.icon}</span></span>
              <span className="ttm-txt"><b>{t.name}</b><small>{t.sub}</small></span>
              {t.id === current && <span className="material-symbols-outlined ttm-check">check</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
