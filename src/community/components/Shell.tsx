'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react';
import { SOCIALS, site, to } from '../config';
import { LogoMark } from './Art';
import s from '../community.module.css';

const NAV = [
  { page: '/circles', label: 'Circles' },
  { page: '/members', label: 'Members' },
  { page: '/stories', label: 'Stories' },
  { page: '/gatherings', label: 'Gatherings' },
  { page: '/resources', label: 'Resources' },
  { page: '/guidelines', label: 'Guidelines' },
];

/** The community's own header and footer, so the whole section can be lifted onto a subdomain */
export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? '';
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isOn = (page: string) => path === to(page) || path.startsWith(to(page) + '/');

  return (
    <div className={s.root}>
      <header className={scrolled || open ? s.topScrolled : s.top}>
        <div className={`${s.wrap} ${s.topIn}`}>
          <Link href={to()} className={s.brand} aria-label="Learn Quran Community, home">
            <LogoMark />
            <span className={s.brandText}>
              <b>Learn Quran</b>
              <small>Community</small>
            </span>
          </Link>

          <nav className={s.nav} aria-label="Community">
            {NAV.map(n => (
              <Link key={n.page} href={to(n.page)} className={isOn(n.page) ? s.navOn : s.navLink} aria-current={isOn(n.page) ? 'page' : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>

          <Link href={to('/join')} className={`${s.btn} ${s.btnDark} ${s.btnSm} ${s.topCta}`}>
            Apply to join
          </Link>
          <button type="button" className={s.menuBtn} aria-expanded={open} aria-controls="cm-menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(o => !o)}>
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>

        {open && (
          <div id="cm-menu" className={s.sheet}>
            <nav className={s.wrap} aria-label="Community">
              {NAV.map(n => (
                <Link key={n.page} href={to(n.page)} className={isOn(n.page) ? s.sheetOn : s.sheetLink} aria-current={isOn(n.page) ? 'page' : undefined}>
                  {n.label}
                </Link>
              ))}
              <Link href={to('/join')} className={`${s.btn} ${s.sheetCta}`}>
                Apply to join <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href={site('/')} className={s.sheetBack}>
                Back to Learn Quran <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </nav>
          </div>
        )}
      </header>

      <div className={s.page}>{children}</div>

      <footer className={s.foot}>
        <div className={`${s.wrap} ${s.footIn}`}>
          <div className={s.footBrand}>
            <Link href={to()} className={s.brand}>
              <LogoMark size={32} />
              <span className={s.brandText}>
                <b>Learn Quran</b>
                <small>Community</small>
              </span>
            </Link>
            <p>A small, moderated community for people learning to read, memorise and understand the Quran.</p>
          </div>
          <nav className={s.footNav} aria-label="Community">
            <p className={s.footTitle}>Community</p>
            {NAV.slice(0, 4).map(n => (
              <Link key={n.page} href={to(n.page)}>{n.label}</Link>
            ))}
          </nav>
          <nav className={s.footNav} aria-label="Getting started">
            <p className={s.footTitle}>Getting started</p>
            {NAV.slice(4).map(n => (
              <Link key={n.page} href={to(n.page)}>{n.label}</Link>
            ))}
            <Link href={to('/join')}>Apply to join</Link>
          </nav>
          <div className={s.footNav}>
            <p className={s.footTitle}>Learn Quran</p>
            <Link href={site('/')}>
              The app <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            {SOCIALS.map(x => (
              <a key={x.label} href={x.href} target="_blank" rel="noopener noreferrer">
                {x.label} <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
        <p className={`${s.wrap} ${s.footLegal}`}>© {new Date().getFullYear()} Learn Quran. All rights reserved.</p>
      </footer>
    </div>
  );
}
