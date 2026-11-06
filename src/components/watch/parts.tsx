'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ROWS, ago, thumb, views, type Video } from '@/lib/videos/catalog';
import type { Snap } from './store';

export function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ''}`} aria-hidden="true">{name}</span>;
}

/** YouTube thumbnail; some sizes don't exist for every video, so fall back step by step */
export function Thumb({ id, sizes, alt = '', className }: { id: string; sizes: ('card' | 'hero' | 'hq' | 'short')[]; alt?: string; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [id]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={thumb(id, sizes[Math.min(i, sizes.length - 1)])}
      alt={alt}
      loading="lazy"
      // a missing maxres image comes back as a tiny grey placeholder rather than an error
      onLoad={e => { if (e.currentTarget.naturalWidth <= 120 && i < sizes.length - 1) setI(i + 1); }}
      onError={() => { if (i < sizes.length - 1) setI(i + 1); }}
    />
  );
}

export const meta = (v: Partial<Video> & Snap) =>
  [v.channel, v.published ? ago(v.published) : null, v.views != null ? views(v.views) : null].filter(Boolean).join(' · ');

interface CardProps { v: Partial<Video> & Snap; progress?: number; onOpen: () => void }

export function Card({ v, progress, onOpen }: CardProps) {
  return (
    <li className="wt-card">
      <button type="button" onClick={onOpen} aria-label={`Watch ${v.title}`}>
        <span className="wt-card-art">
          <Thumb id={v.id} sizes={['card', 'hq']} />
          <span className="wt-card-play"><Icon name="play_arrow" /></span>
          {progress != null && <span className="wt-progress" aria-label={`${Math.round(progress * 100)}% watched`}><i style={{ width: `${Math.max(4, progress * 100)}%` }} /></span>}
        </span>
        <b>{v.title}</b>
        <small>{meta(v)}</small>
      </button>
    </li>
  );
}

export function ShortCard({ v, onOpen }: { v: Snap; onOpen: () => void }) {
  return (
    <li className="wt-short">
      <button type="button" onClick={onOpen} aria-label={`Watch ${v.title}`}>
        <Thumb id={v.id} sizes={['short', 'hq']} />
        <span className="wt-short-text"><b>{v.title}</b><small>{v.channel}</small></span>
      </button>
    </li>
  );
}

/** A titled, horizontally scrolling row with arrow buttons on wide screens */
export function Shelf({ title, onSeeAll, children, tall }: { title: string; onSeeAll?: () => void; children: ReactNode; tall?: boolean }) {
  const ref = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' });
  return (
    <section className={`wt-shelf${tall ? ' is-tall' : ''}`} aria-label={title}>
      <header>
        <h2>{title}</h2>
        {onSeeAll && <button type="button" className="wt-seeall" onClick={onSeeAll}>See all <Icon name="chevron_right" /></button>}
      </header>
      <div className="wt-shelf-body">
        <button type="button" className="wt-arrow left" onClick={() => scroll(-1)} aria-label={`Scroll ${title} back`}><Icon name="chevron_left" /></button>
        <ul ref={ref} className="wt-shelf-row">{children}</ul>
        <button type="button" className="wt-arrow right" onClick={() => scroll(1)} aria-label={`Scroll ${title} forward`}><Icon name="chevron_right" /></button>
      </div>
    </section>
  );
}

interface HeroProps {
  items: Video[];
  inList: (id: string) => boolean;
  onWatch: (v: Video) => void;
  onToggleList: (v: Video) => void;
}

/** Rotating spotlight; pauses while hovered or focused */
export function Hero({ items, inList, onWatch, onToggleList }: HeroProps) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (hold || items.length < 2) return;
    const t = window.setInterval(() => setI(n => (n + 1) % items.length), 8000);
    return () => window.clearInterval(t);
  }, [hold, items.length]);
  const v = items[i % Math.max(1, items.length)];
  if (!v) return <div className="wt-hero is-loading" />;
  const row = ROWS.find(r => r.id === v.row)!;

  return (
    <section className="wt-hero" aria-roledescription="carousel" aria-label="Featured videos"
      onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
      <div className="wt-hero-art" key={v.id}><Thumb id={v.id} sizes={['hero', 'hq']} /></div>
      <div className="wt-hero-shade" />
      <div className="wt-hero-body">
        <p className="wt-hero-tag"><Icon name={row.icon} /> {row.title}</p>
        <h1>{v.title}</h1>
        <p className="wt-hero-meta">{meta(v)}</p>
        {v.summary && <p className="wt-hero-summary">{v.summary}</p>}
        <div className="wt-hero-actions">
          <button type="button" className="wt-btn primary" onClick={() => onWatch(v)}><Icon name="play_arrow" /> Watch now</button>
          <button type="button" className="wt-btn icon" onClick={() => onToggleList(v)} aria-pressed={inList(v.id)}
            aria-label={inList(v.id) ? 'Remove from My List' : 'Add to My List'}>
            <Icon name={inList(v.id) ? 'check' : 'add'} />
          </button>
        </div>
      </div>
      {items.length > 1 && (
        <ul className="wt-hero-picks" aria-label="Choose featured video">
          {items.map((x, n) => (
            <li key={x.id}>
              <button type="button" className={n === i % items.length ? 'is-on' : ''} onClick={() => setI(n)} aria-label={x.title} aria-current={n === i % items.length}>
                <Thumb id={x.id} sizes={['card', 'hq']} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
