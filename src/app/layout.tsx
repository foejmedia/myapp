// app/layout.tsx
import type { Metadata, Viewport } from 'next';

import Footer from '@/components/Footer';
import GlobalSidebar from '@/components/GlobalSidebar';
import Navbar from '@/components/Navbar/Navbar';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';
import { manropeSite } from '@/fonts/manrope';
import ClientWrapper from '@/components/ClientWrapper';
import QuickAccessWidget from '@/components/QuickAccessWidget';
import PrayerReminders from '@/components/PrayerReminders';

/*
 * Site-wide defaults. Pages override title/description; canonical URLs are set per page
 * (never here — a canonical in the root layout would point every page at the homepage).
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Learn Quran – Read, Listen & Understand the Holy Quran',
  description:
    'Learn Quran online for free: read all 114 surahs with translation and tafsir, listen to recitations, learn Noorani Qaida and tajweed, and memorize step by step.',
  applicationName: SITE_NAME,
  authors: [{ name: 'Learn Quran Team' }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    siteName: SITE_NAME,
    title: 'Learn Quran – Read, Listen & Understand the Holy Quran',
    description: 'Read, listen to and understand the Holy Quran online — free, a little every day.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Learn Quran online, for free' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learn Quran – Read, Listen & Understand the Holy Quran',
    description: 'Read, listen to and understand the Holy Quran online — free, a little every day.',
    images: ['/og-image.png'],
  },
  // Google Search Console: set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the token it gives you
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f7a5a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${manropeSite.variable}`} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://googleads.g.doubleclick.net" />
        <link rel="preconnect" href="https://static.doubleclick.net" />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        <link
          rel="preload"
          href="/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Favicon & Apple icon come from app/icon.png and app/apple-icon.png */}

        {/* PWA Support */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Learn Quran" />

        {/* ✅ Theme init – runs before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='quran-learn-theme';var s=localStorage.getItem(k);var sys=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var t=(s&&s!=='system')?s:sys;var r=document.documentElement;r.setAttribute('data-theme',t);if(t==='dark'){r.classList.add('dark');}else{r.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
        {/* Organization / WebSite structured data lives on the homepage (app/page.tsx) */}
      </head>
      <body>
        <ThemeProvider>
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <Navbar />
          <div className="app-shell no-sidebar">
            <GlobalSidebar />
            <ClientWrapper>
              <main id="main-content" style={{ flex: 1, minWidth: 0 }}>
                {children}
              </main>
            </ClientWrapper>
          </div>
          <Footer />
          <QuickAccessWidget />
          <PrayerReminders />
        </ThemeProvider>
      </body>
    </html>
  );
}