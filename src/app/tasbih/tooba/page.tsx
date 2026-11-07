import type { Metadata } from 'next';
import { manropeTooba as manrope } from '@/fonts/manrope';
import { amiriTooba as amiri } from '@/fonts/amiri';
import { frauncesTooba as fraunces } from '@/fonts/fraunces';
import ToobaTasbeeh from '@/components/tasbih-tooba/ToobaTasbeeh';


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
