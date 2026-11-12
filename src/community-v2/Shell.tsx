'use client';
/**
 * Community preview (/community-v2): the community pages redrawn in the homepage-preview style.
 * Same content and data as /community (src/community/data), its own header and footer.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronRight, Menu, X } from 'lucide-react';
import { SOCIALS, site } from '@/community/config';
import { LogoMark } from '@/home-v2/icons';
import { to } from './ui';
import s from './cv.module.css';

const NAV = [
  { page: '/circles', label: 'Circles' },
  { page: '/members', label: 'Members' },
  { page: '/stories', label: 'Stories' },
  { page: '/gatherings', label: 'Gatherings' },
  { page: '/resources', label: 'Resources' },
  { page: '/guidelines', label: 'Guidelines' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? '';
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const isOn = (page: string) => path === to(page) || path.startsWith(to(page) + '/');

  return (
    <div className={s.root}>
      <header className={`${s.top}${scrolled ? ` ${s.topUp}` : ''}`}>
        <Link href={to('/join')} className={s.strip}>
          <b>Open</b>
          <span>
            Applications are open<span className={s.stripMore}>. Free to join, every level welcome</span>
          </span>
          <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
        </Link>

        <div className={s.bar}>
          <div className={`${s.wrap} ${s.barIn}`}>
            <Link href={to()} className={s.brand} aria-label="Learn Quran Community, home">
              <LogoMark />
              <span>Learn Quran</span>
              <span className={s.brandTag}>Community</span>
            </Link>

            <nav className={s.nav} aria-label="Community">
              {NAV.map(n => (
                <Link
                  key={n.page}
                  href={to(n.page)}
                  className={isOn(n.page) ? `${s.navLink} ${s.navOn}` : s.navLink}
                  aria-current={isOn(n.page) ? 'page' : undefined}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className={s.barEnd}>
              <Link href={to('/join')} className={`${s.btn} ${s.btnDark} ${s.btnSm}`}>
                Apply to join
              </Link>
              <button
                type="button"
                className={s.burger}
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                aria-controls="cv-menu"
                onClick={() => setOpen(o => !o)}
              >
                {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {open && (
            <nav id="cv-menu" className={s.menu} aria-label="Community, mobile">
              {NAV.map(n => (
                <Link key={n.page} href={to(n.page)} className={s.menuLink} aria-current={isOn(n.page) ? 'page' : undefined}>
                  {n.label}
                  <ChevronRight size={18} aria-hidden="true" />
                </Link>
              ))}
              <Link href={site('/')} className={s.menuLink}>
                Back to Learn Quran
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* the site already wraps every page in <main>, so this is a plain container */}
      <div className={s.page}>{children}</div>

      <footer className={s.foot}>
        <div className={`${s.wrap} ${s.footGrid}`}>
          <div className={s.footBrand}>
            <Link href={to()} className={s.brand}>
              <LogoMark />
              <span>Learn Quran</span>
              <span className={s.brandTag}>Community</span>
            </Link>
            <p>A small, moderated community for people learning to read, memorise and understand the Quran.</p>
            <div className={s.socials}>
              {SOCIALS.map(x => (
                <a key={x.label} href={x.href} target="_blank" rel="noopener noreferrer" className={s.social}>
                  {x.label} <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className={s.footHead}>Community</p>
            <nav className={s.footLinks} aria-label="Community">
              {NAV.slice(0, 4).map(n => (
                <Link key={n.page} href={to(n.page)}>{n.label}</Link>
              ))}
            </nav>
          </div>
          <div>
            <p className={s.footHead}>Getting started</p>
            <nav className={s.footLinks} aria-label="Getting started">
              {NAV.slice(4).map(n => (
                <Link key={n.page} href={to(n.page)}>{n.label}</Link>
              ))}
              <Link href={to('/join')}>Apply to join</Link>
            </nav>
          </div>
          <div>
            <p className={s.footHead}>Learn Quran</p>
            <nav className={s.footLinks} aria-label="Learn Quran">
              <Link href={site('/')}>The app</Link>
              <Link href={site('/read-quran/1')}>Read Quran</Link>
              <Link href={site('/memorize-quran')}>Hifz Program</Link>
              <Link href={site('/learn-1-min')}>Learn in 1 Minute</Link>
            </nav>
          </div>
        </div>
        <div className={s.wrap}>
          <div className={s.footEnd}>
            <span>© {new Date().getFullYear()} Learn Quran</span>
            <span>Free to join. Every level is welcome.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
