'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { computeStats } from '../lib/stats';
import { useLearn } from '../store/LearnProvider';
import {
  IconCards, IconClose, IconDua, IconFlame, IconHome, IconMenu, IconMoon, IconNotebook, IconPlay, IconQuiz, IconRepeat,
  IconSearch, IconSun, IconSurah, IconUser, IconWord,
} from './Icons';
import { RocketArt } from './Illustrations';
import SearchDialog, { OPEN_SEARCH_EVENT } from './Search';
import Welcome from './Welcome';
import s from '../learn.module.css';

const NAV = [
  { href: '/learn-1-min', label: 'Home', icon: IconHome },
  { href: '/learn-1-min/vocabulary', label: 'Vocabulary', icon: IconWord, mobile: 'Words' },
  { href: '/learn-1-min/duas', label: 'Daily Duas', icon: IconDua, mobile: 'Duas' },
  { href: '/learn-1-min/surahs', label: 'Surahs', icon: IconSurah },
  { href: '/learn-1-min/flashcards', label: 'Flashcards', icon: IconCards },
  { href: '/learn-1-min/quiz', label: 'Quizzes', icon: IconQuiz },
  { href: '/learn-1-min/review', label: 'Revision', icon: IconRepeat },
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
    const onOpen = () => setSearchOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
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
                <Icon className={s.i18} />
                <span>{n.label}</span>
                {due > 0 ? (
                  <span className={s.navBadge} aria-label={`${due} due`}>
                    {due}
                  </span>
                ) : (
                  on && <span className={s.navDot} aria-hidden />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const profileCard = profile && (
    <div className={s.sideProfile}>
      <span className={s.sideAvatar} aria-hidden>
        {profile.name.slice(0, 1).toUpperCase()}
        {stats && (
          <span className={s.sideAvatarBadge}>
            <IconFlame className={s.i12} /> {stats.streak}
          </span>
        )}
      </span>
      <p className={s.sideHello}>
        Assalamu alaikum, <strong>{profile.name}</strong>
      </p>
    </div>
  );

  const todayCard = stats && (
    <div className={s.promo}>
      <RocketArt className={s.promoRocket} />
      <p className={s.promoHead}>
        <IconFlame className={s.i20} /> {stats.streak}-day streak
      </p>
      <p className={s.promoSub}>{stats.learnedToday ? 'Today’s lesson is done. Keep going!' : 'Your one-minute lesson is waiting.'}</p>
      <ul className={s.promoList}>
        <li>
          <Link href="/learn-1-min?start=lesson">
            <IconPlay className={s.i14} /> {stats.learnedToday ? 'Review today’s lesson' : 'Start today’s lesson'}
          </Link>
        </li>
        <li>
          <Link href="/learn-1-min/review">
            <IconRepeat className={s.i14} /> Revise {stats.due.length ? `${stats.due.length} due` : 'words'}
          </Link>
        </li>
        <li>
          <Link href="/learn-1-min/quiz">
            <IconQuiz className={s.i14} /> Daily challenge
          </Link>
        </li>
      </ul>
    </div>
  );

  return (
    <div className={s.root}>
      <header className={s.appHeader}>
        <button type="button" className={`${s.iconBtn} ${s.onlyMobile}`} onClick={() => setDrawer(true)} aria-label="Open menu">
          <IconMenu className={s.i20} />
        </button>
        <Link href="/learn-1-min" className={s.brand}>
          <span className={s.brandMark} aria-hidden>
            ١
          </span>
          <strong>Learn in 1 Minute</strong>
        </Link>
        <button type="button" className={s.searchTrigger} onClick={() => setSearchOpen(true)}>
          <span>Search words, duas, surahs or your notes…</span>
          <IconSearch className={`${s.i18} ${s.searchTriggerIcon}`} />
        </button>
        <div className={s.topActions}>
          <button type="button" className={s.iconBtn} onClick={toggleTheme} aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {resolvedTheme === 'dark' ? <IconSun className={s.i18} /> : <IconMoon className={s.i18} />}
          </button>
          {profile && (
            <div className={s.menuWrap} ref={menuRef}>
              <button type="button" className={s.userBtn} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
                <span className={s.avatar}>{profile.name.slice(0, 1).toUpperCase()}</span>
                <span className={s.userText}>
                  <strong>
                    {profile.name} <i className={s.onlineDot} aria-hidden />
                  </strong>
                  <small>{authKind}</small>
                </span>
              </button>
              {menuOpen && (
                <div className={s.menu} role="menu">
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

      <aside className={s.sidebar}>
        {profileCard}
        {nav}
        {todayCard}
      </aside>

      <div className={s.mainCol}>
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
              <IconUser className={s.i18} /> <span>Account & profiles</span>
            </Link>
            {todayCard}
          </div>
        </div>
      )}

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
