'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';
import { formatHijri } from '../lib/hijri';
import { SKY } from '../lib/sky';
import { useGarden } from '../state/GardenProvider';
import { useLivingTime } from '../state/useLivingTime';
import s from '../game.module.css';

const NAV = [
  { href: '/game', label: 'Garden' },
  { href: '/game/library', label: 'Seed Library' },
  { href: '/game/dua', label: 'Dua Garden' },
  { href: '/game/settings', label: 'Settings' },
];

export default function GameShell({ children }: { children: React.ReactNode }) {
  const { ready, storageOk } = useGarden();
  const lt = useLivingTime();
  const pathname = usePathname();
  const sky = lt?.sky ?? SKY.morning;
  const style = { '--sky-top': sky.top, '--sky-bottom': sky.bottom } as CSSProperties;

  return (
    <div className={s.root} data-theme={sky.theme} style={style}>
      {sky.theme === 'night' && <div className={s.stars} aria-hidden />}
      <header className={s.header}>
        <div className={s.headRow}>
          <Link href="/game" className={s.brand}>
            The Garden of Dhikr
          </Link>
          <p className={s.hijri} aria-live="off">
            {lt?.hijri ? formatHijri(lt.hijri) : ' '}
          </p>
        </div>
        <nav className={s.nav} aria-label="Garden of Dhikr">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className={s.navLink} aria-current={pathname === n.href ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      {ready && !storageOk && (
        <p role="status" className={s.banner}>
          This browser is not letting the garden save. Everything still works, but it will be lost when the tab closes.
          Export a backup from Settings to keep it.
        </p>
      )}
      <div className={s.main}>{children}</div>
    </div>
  );
}
