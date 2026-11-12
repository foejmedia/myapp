'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './GlobalSidebar.css';

// The desktop side panel has been removed site-wide; navigation lives in the top Navbar.
// This component now only renders the mobile bottom tab bar and applies the saved colour theme.

// Primary tabs shown in the mobile bottom nav (max 5 for comfortably tappable targets)
const MOBILE_TABS = [
    { icon: 'home', label: 'Home', href: '/' },
    { icon: 'menu_book', label: 'Quran', href: '/read-quran' },
    { icon: 'psychology', label: 'Memorize', href: '/memorize-quran' },
    { icon: 'headphones', label: 'Player', href: '/quran-player' },
    { icon: 'history_edu', label: 'Hadith', href: '/hadees' },
];

/** Pages where the mobile nav should not appear (full-screen readers) */
function isExcluded(p: string): boolean {
    return (
        p.startsWith('/radio/') ||
        p.startsWith('/hizb/') ||
        p.startsWith('/manzil/') ||
        p.startsWith('/juz/') ||
        p.startsWith('/surah/') ||
        p.startsWith('/ruku/') ||
        // Watch is a full-screen streaming app with its own navigation
        p.startsWith('/video-gallery') ||
        // The community has its own header and footer
        p.startsWith('/community') ||
        // The homepage preview has its own header and footer
        p.startsWith('/home-v2')
    );
}

export default function GlobalSidebar() {
    const pathname = usePathname() ?? '';

    // Apply the saved colour theme (green / amber) on first load
    useEffect(() => {
        const storedTheme = localStorage.getItem('color-theme');
        document.documentElement.setAttribute('data-color-theme', storedTheme === 'amber' ? 'amber' : 'green');
    }, []);

    // pages without the tab bar don't need the space reserved for it (see GlobalSidebar.css)
    const excluded = isExcluded(pathname);
    useEffect(() => {
        document.body.classList.toggle('no-mobile-nav', excluded);
        return () => document.body.classList.remove('no-mobile-nav');
    }, [excluded]);

    if (excluded) return null;

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href.split('?')[0]);
    };

    return (
        <nav className="gsb-mobile-nav" aria-label="Mobile bottom navigation">
            {MOBILE_TABS.map(tab => (
                <Link
                    key={tab.href}
                    href={tab.href}
                    className={`gsb-mob-item${isActive(tab.href) ? ' active' : ''}`}
                    aria-current={isActive(tab.href) ? 'page' : undefined}
                    aria-label={tab.label}
                >
                    <span className="gsb-mob-icon">
                        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                            {tab.icon}
                        </span>
                    </span>
                    <span>{tab.label}</span>
                </Link>
            ))}
        </nav>
    );
}
