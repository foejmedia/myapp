import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { PREVIEW } from '@/community/config';
import s from './cv.module.css';

/**
 * The preview lives at /community-v2 so the live community at /community is untouched.
 * Main-site links use the community's own site() helper.
 */
export const BASE = '/community-v2';
export const to = (page = '') => `${BASE}${page}`;

/** The highlighted words in a headline: a yellow marker stroke */
export const Mark = ({ children }: { children: ReactNode }) => <span className={s.mark}>{children}</span>;

export function PageHead({
  kicker,
  title,
  sub,
  tone = 'yellow',
  children,
}: {
  kicker: string;
  title: ReactNode;
  sub: ReactNode;
  tone?: 'yellow' | 'blush' | 'celeste' | 'mauve';
  children?: ReactNode;
}) {
  const t = { yellow: s.toneYellow, blush: s.toneBlush, celeste: s.toneCeleste, mauve: s.toneMauve }[tone];
  return (
    <header className={s.pageHead}>
      <div className={s.wrap}>
        <div className={`${s.pageCard} ${t}`}>
          <span className={`${s.dot} ${s.dotA}`} aria-hidden="true" />
          <span className={`${s.dot} ${s.dotB}`} aria-hidden="true" />
          <span className={`${s.dot} ${s.dotC}`} aria-hidden="true" />
          <p className={s.chipDark}>{kicker}</p>
          <h1 className={s.h1}>{title}</h1>
          <p className={s.pageSub}>{sub}</p>
          {children}
        </div>
      </div>
    </header>
  );
}

export function SectionHead({ kicker, title, sub, center }: { kicker?: string; title: ReactNode; sub?: ReactNode; center?: boolean }) {
  return (
    <div className={center ? s.headCenter : s.head}>
      {kicker && <p className={s.kicker}>{kicker}</p>}
      <h2 className={s.title}>{title}</h2>
      {sub && <p className={s.sub}>{sub}</p>}
    </div>
  );
}

export const ExampleTag = () => <span className={s.example}>Example</span>;

/** Shown on pages that list people while the community is still opening */
export function PreviewNote({ children }: { children: ReactNode }) {
  if (!PREVIEW) return null;
  return (
    <p className={s.note} role="note">
      <b>The community is opening.</b> {children}
    </p>
  );
}

export function Pills<T extends string>({ label, options, value, onChange }: { label: string; options: readonly T[]; value: T | 'All'; onChange: (v: T | 'All') => void }) {
  return (
    <div className={s.pills} role="group" aria-label={label}>
      {(['All', ...options] as (T | 'All')[]).map(o => (
        <button key={o} type="button" className={o === value ? `${s.pill} ${s.pillOn}` : s.pill} aria-pressed={o === value} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={s.arrowLink}>
      {children} <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
    </Link>
  );
}

/** The closing invitation at the foot of every page */
export function JoinCard() {
  return (
    <section className={s.section} aria-labelledby="cv-join">
      <div className={s.wrap}>
        <div className={s.start}>
          <span className={`${s.blob} ${s.blobA}`} aria-hidden="true" />
          <span className={`${s.blob} ${s.blobB}`} aria-hidden="true" />
          <span className={`${s.blob} ${s.blobC}`} aria-hidden="true" />
          <span className={`${s.blob} ${s.blobD}`} aria-hidden="true" />
          <h2 id="cv-join" className={s.startTitle}>Ready to join?</h2>
          <p className={s.startBody}>
            Every application is read by a person. A few questions place you in a circle at your level, with people who will
            notice when you are missing.
          </p>
          <Link href={to('/join')} className={`${s.btn} ${s.btnBlue}`}>
            Apply to join <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
