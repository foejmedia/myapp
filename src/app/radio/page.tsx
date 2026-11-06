import type { Metadata } from 'next';
import { Amiri, Manrope } from 'next/font/google';
import LiveRadio from '@/components/live-radio/LiveRadio';

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--lr-font' });
const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--lr-font-ar' });

export const metadata: Metadata = {
  title: 'Live Quran Radio',
  description: 'Listen live to Quran recitation, translation and tafsir channels and Quran radio stations from around the world.',
};

export default function RadioPage() {
  return (
    <div className={`${manrope.variable} ${amiri.variable}`}>
      <LiveRadio />
    </div>
  );
}
