import type { Metadata } from 'next';
import { Amiri, Fraunces, Manrope } from 'next/font/google';
import ToobaTasbeeh from '@/components/tasbih-tooba/ToobaTasbeeh';

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--tb-font' });
const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '500'], style: ['normal', 'italic'], variable: '--tb-serif' });
const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--tb-font-ar' });

export const metadata: Metadata = {
  title: 'Tooba Tasbeeh — Grow a Tree of Dhikr',
  description: 'A calm, white tasbeeh: every count grows a leaf, your tree blossoms at your goal, and each round plants a tree in your grove.',
};

export default function ToobaTasbeehPage() {
  return (
    <div className={`${manrope.variable} ${fraunces.variable} ${amiri.variable}`}>
      <ToobaTasbeeh />
    </div>
  );
}
