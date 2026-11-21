'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { APPLY_URL, SOCIALS, to } from '../config';
import { LogoMark } from './Art';
import s from '../community.module.css';

/** The community's own header and footer: a single page, so the header holds only the logo and the call to action */
export default function Shell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={s.root}>
      <header className={scrolled ? s.topScrolled : s.top}>
        <div className={`${s.wrap} ${s.topIn}`}>
          <Link href={to()} className={s.brand} aria-label="Learn Quran Community, home">
            <LogoMark />
            <span className={s.brandText}>
              <b>Learn Quran</b>
              <small>Community</small>
            </span>
          </Link>
          <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className={`${s.btn} ${s.btnDark} ${s.btnSm}`}>
            Apply to join
          </a>
        </div>
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
          {SOCIALS.length > 0 && (
            <div className={s.footNav}>
              <p className={s.footTitle}>Follow us</p>
              {SOCIALS.map(x => (
                <a key={x.label} href={x.href} target="_blank" rel="noopener noreferrer">
                  {x.label} <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </div>
        <p className={`${s.wrap} ${s.footLegal}`}>© {new Date().getFullYear()} Learn Quran. All rights reserved.</p>
      </footer>
    </div>
  );
}
