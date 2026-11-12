import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight, BookMarked, DoorOpen, Ear, Flower2, GraduationCap, Home, Languages, Lightbulb, MapPin, Mic, Repeat2,
  Sparkles, Sprout, Users,
} from 'lucide-react';
import { PREVIEW, to } from '../config';
import { Squiggle } from './Art';
import s from '../community.module.css';

const ICONS = {
  sprout: Sprout, mic: Mic, bookmark: BookMarked, repeat: Repeat2, languages: Languages, lightbulb: Lightbulb,
  flower: Flower2, home: Home, cap: GraduationCap, door: DoorOpen, users: Users, ear: Ear, sparkles: Sparkles, pin: MapPin,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const C = ICONS[name];
  return <C size={size} strokeWidth={1.8} aria-hidden="true" />;
}

/** The highlighted words in a headline */
export const Mark = ({ children }: { children: ReactNode }) => <em className={s.mark}>{children}</em>;

export function PageHead({ eyebrow, title, sub, children }: { eyebrow: string; title: ReactNode; sub: ReactNode; children?: ReactNode }) {
  return (
    <header className={s.pageHead}>
      <div className={s.wrap}>
        <p className={s.eyebrow}>{eyebrow}</p>
        <h1 className={s.h1}>{title}</h1>
        <p className={s.lead}>{sub}</p>
        {children}
      </div>
    </header>
  );
}

export function SectionHead({ eyebrow, title, sub, center }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; center?: boolean }) {
  return (
    <div className={center ? s.secHeadCenter : s.secHead}>
      {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
      <h2 className={s.h2}>{title}</h2>
      {sub && <p className={s.sub}>{sub}</p>}
    </div>
  );
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

const tintOf = (name: string) => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return h % 5;
};

/** An arch-shaped tile with the member's initials: no photos are needed, and none are implied */
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const tint = [s.tint0, s.tint1, s.tint2, s.tint3, s.tint4][tintOf(name)];
  const sz = size === 'sm' ? s.avatarSm : size === 'lg' ? s.avatarLg : '';
  return (
    <span className={`${s.avatar} ${tint} ${sz}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export const ExampleTag = () => <span className={s.exampleTag}>Example</span>;

/** Shown on pages that list people while the community is still opening */
export function PreviewNote({ children }: { children: ReactNode }) {
  if (!PREVIEW) return null;
  return (
    <p className={s.previewNote} role="note">
      <b>The community is opening.</b> {children}
    </p>
  );
}

export function Chips<T extends string>({ label, options, value, onChange }: { label: string; options: readonly T[]; value: T | 'All'; onChange: (v: T | 'All') => void }) {
  return (
    <div className={s.chips} role="group" aria-label={label}>
      {(['All', ...options] as (T | 'All')[]).map(o => (
        <button key={o} type="button" className={o === value ? s.chipOn : s.chip} aria-pressed={o === value} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={s.arrowLink}>
      {children} <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

/** The closing invitation at the foot of every page: a mint card resting on the navy footer */
export function JoinBand() {
  return (
    <section className={s.joinBand} aria-labelledby="cm-join-band">
      <div className={s.wrap}>
        <div className={s.joinCard}>
          <div>
            <h2 id="cm-join-band" className={s.h2}>Ready to join?</h2>
            <p className={s.sub}>
              Every application is read by a person. We ask a few questions so that you land in a circle at your level, with
              people who will notice when you are missing.
            </p>
          </div>
          <Link href={to('/join')} className={s.btnLight}>
            Apply to join <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Squiggle />
        </div>
      </div>
    </section>
  );
}
