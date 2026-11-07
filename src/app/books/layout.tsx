import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { frauncesBooks as serif } from '@/fonts/fraunces';

const sans = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--bk-font' });

export const metadata: Metadata = {
  title: 'Library — free Islamic books | LearnQuran',
  description: 'Read and download free Islamic books in English, Urdu, Arabic, Hindi, Bengali and more — on belief, the Quran, the Prophet ﷺ, prayer, Ramadan, Hajj and family.',
  openGraph: { title: 'LearnQuran Library', description: 'Free Islamic books to read online and download.' },
};

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${sans.variable} ${serif.variable}`}>{children}</div>;
}
