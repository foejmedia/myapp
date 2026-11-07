import type { Metadata } from 'next';
import { Amiri, Manrope } from 'next/font/google';
import { frauncesNoor as fraunces } from '@/fonts/fraunces';
import NoorTasbeeh from '@/components/tasbih-noor/NoorTasbeeh';

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--nr-font' });
const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--nr-font-ar' });

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
