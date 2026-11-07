import type { Metadata } from 'next';
import { manropeBooks as sans } from '@/fonts/manrope';
import { frauncesBooks as serif } from '@/fonts/fraunces';


export const metadata: Metadata = {
  title: 'Library — free Islamic books | LearnQuran',
  description: 'Read and download free Islamic books in English, Urdu, Arabic, Hindi, Bengali and more — on belief, the Quran, the Prophet ﷺ, prayer, Ramadan, Hajj and family.',
  openGraph: { title: 'LearnQuran Library', description: 'Free Islamic books to read online and download.' },
};

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${sans.variable} ${serif.variable}`}>{children}</div>;
}
