'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { computeStats } from '../lib/stats';
import { useLearn } from '../store/LearnProvider';
import {
  IconCards, IconDua, IconFlame, IconHome, IconMenu, IconMoon, IconNotebook, IconQuiz, IconRepeat, IconSearch, IconSun,
  IconSurah, IconUser, IconWord, IconClose,
} from './Icons';
import SearchDialog from './Search';
import Welcome from './Welcome';
import s from '../learn.module.css';

const NAV = [
  { href: '/learn-1-min', label: 'Dashboard', icon: IconHome, mobile: 'Home' },
  { href: '/learn-1-min/vocabulary', label: 'Vocabulary', icon: IconWord, mobile: 'Words' },
  { href: '/learn-1-min/duas', label: 'Daily Duas', icon: IconDua },
  { href: '/learn-1-min/surahs', label: 'Surahs', icon: IconSurah },
  { href: '/learn-1-min/flashcards', label: 'Flashcards', icon: IconCards, mobile: 'Cards' },
  { href: '/learn-1-min/quiz', label: 'Quizzes', icon: IconQuiz, mobile: 'Quiz' },
  { href: '/learn-1-min/review', label: 'Revision', icon: IconRepeat, mobile: 'Revise' },
  { href: '/learn-1-min/notebook', label: 'Notebook', icon: IconNotebook },
];

const isActive = (path: string, href: string) => (href === '/learn-1-min' ? path === href : path.startsWith(href));

export default function Shell({ children }: { children: React.ReactNode }) {
  const { status, profile, data, clock, saveError, authKind, signOut } = useLearn();
  const { resolvedTheme, toggleTheme } = useTheme();
  const path = usePathname() ?? '';
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const stats = status === 'ready' && clock ? computeStats(data, clock.today) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setDrawer(false);
    setMenuOpen(false);
  }, [path]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const nav = (
    <nav aria-label="Learn in 1 Minute">
      <ul className={s.navList}>
        {NAV.map(n => {
          const Icon = n.icon;
          const on = isActive(path, n.href);
          const due = n.href.endsWith('/review') && stats?.due.length ? stats.due.length : 0;
          return (
            <li key={n.href}>
              <Link href={n.href} className={on ? s.navOn : s.navLink} aria-current={on ? 'page' : undefined}>
                <Icon className={s.i20} />
                <span>{n.label}</span>
                {due > 0 && (
                  <span className={s.navBadge} aria-label={`${due} due`}>
                    {due}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <div className={s.root}>
      <aside className={s.sidebar}>
        <Link href="/learn-1-min" className={s.brand}>
          <span className={s.brandMark} aria-hidden>
            ١
          </span>
          <span>
            <strong>Learn in 1 Minute</strong>
            <small>Daily Qur’an learning</small>
          </span>
        </Link>
        {nav}
        {stats && (
          <div className={s.sideStreak}>
            <IconFlame className={stats.streak ? s.flameOn : s.flameOff} />
            <span>
              <strong>{stats.streak}-day streak</strong>
              <small>{stats.activeToday ? 'You learned today' : 'Learn today to keep it'}</small>
            </span>
          </div>
        )}
      </aside>

      <div className={s.mainCol}>
        <header className={s.topbar}>
          <button type="button" className={`${s.iconBtn} ${s.onlyMobile}`} onClick={() => setDrawer(true)} aria-label="Open menu">
            <IconMenu className={s.i20} />
          </button>
          <button type="button" className={s.searchTrigger} onClick={() => setSearchOpen(true)}>
            <IconSearch className={s.i18} />
            <span>Search words, duas, surahs…</span>
            <kbd className={s.kbd}>Ctrl K</kbd>
          </button>
          <div className={s.topActions}>
            <button
              type="button"
              className={s.iconBtn}
              onClick={toggleTheme}
              aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolvedTheme === 'dark' ? <IconSun className={s.i20} /> : <IconMoon className={s.i20} />}
            </button>
            {profile && (
              <div className={s.menuWrap} ref={menuRef}>
                <button
                  type="button"
                  className={s.avatarBtn}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen(o => !o)}
                  aria-label={`Account: ${profile.name}`}
                >
                  {profile.name.slice(0, 1).toUpperCase()}
                </button>
                {menuOpen && (
                  <div className={s.menu} role="menu">
                    <p className={s.menuHead}>
                      <strong>{profile.name}</strong>
                      <small>{authKind}</small>
                    </p>
                    <Link href="/learn-1-min/account" role="menuitem" className={s.menuItem}>
                      <IconUser className={s.i18} /> Account & profiles
                    </Link>
                    <button type="button" role="menuitem" className={s.menuItem} onClick={() => signOut()}>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* mobile: sticky, scrollable module tabs (the site already has its own bottom bar) */}
        <nav className={s.tabbar} aria-label="Modules">
          {NAV.map(n => {
            const Icon = n.icon;
            const on = isActive(path, n.href);
            return (
              <Link key={n.href} href={n.href} className={on ? s.tabOn : s.tab} aria-current={on ? 'page' : undefined}>
                <Icon className={s.i16} />
                <span>{n.mobile ?? n.label}</span>
              </Link>
            );
          })}
        </nav>

        {saveError && (
          <p className={s.alert} role="alert">
            {saveError}
          </p>
        )}

        <main className={s.content} id="l1m-main">
          {status === 'signedOut' ? <Welcome /> : children}
        </main>
      </div>

      {drawer && (
        <div className={s.drawerBack} onClick={() => setDrawer(false)}>
          <div className={s.drawer} role="dialog" aria-modal="true" aria-label="Menu" onClick={e => e.stopPropagation()}>
            <div className={s.rowBetween}>
              <strong className={s.drawerTitle}>Learn in 1 Minute</strong>
              <button type="button" className={s.iconBtn} onClick={() => setDrawer(false)} aria-label="Close menu" autoFocus>
                <IconClose className={s.i20} />
              </button>
            </div>
            {nav}
            <Link href="/learn-1-min/account" className={s.navLink}>
              <IconUser className={s.i20} /> <span>Account & profiles</span>
            </Link>
          </div>
        </div>
      )}

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
