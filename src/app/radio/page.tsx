import type { Metadata } from 'next';
import { manropeRadio as manrope } from '@/fonts/manrope';
import { amiriRadio as amiri } from '@/fonts/amiri';
import { frauncesRadio as fraunces } from '@/fonts/fraunces';
import LiveRadio from '@/components/live-radio/LiveRadio';


export const metadata: Metadata = {
  title: 'Live Quran Radio',
  description: 'Listen live to Quran recitation, translation and tafsir channels and Quran radio stations from around the world.',
};

export default function RadioPage() {
  return (
    <div className={`${manrope.variable} ${amiri.variable} ${fraunces.variable}`}>
      <LiveRadio />
    </div>
  );
}
