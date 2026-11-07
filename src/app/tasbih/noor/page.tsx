import type { Metadata } from 'next';
import { manropeNoor as manrope } from '@/fonts/manrope';
import { amiriNoor as amiri } from '@/fonts/amiri';
import { frauncesNoor as fraunces } from '@/fonts/fraunces';
import NoorTasbeeh from '@/components/tasbih-noor/NoorTasbeeh';


export const metadata: Metadata = {
  title: 'Noor Tasbeeh — Light a Star with Every Dhikr',
  description: 'A night-sky tasbeeh: swipe the prayer beads, and every count lights a star. The moon waxes to full as you reach your goal.',
};

export default function NoorTasbeehPage() {
  return (
    <div className={`${manrope.variable} ${fraunces.variable} ${amiri.variable}`}>
      <NoorTasbeeh />
    </div>
  );
}
