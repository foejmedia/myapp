import type { Metadata } from 'next';
import { Amiri, Manrope } from 'next/font/google';
import TasbeehGarden from '@/components/tasbih-garden/TasbeehGarden';

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--tg-font' });
const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--tg-font-ar' });

export const metadata: Metadata = {
  title: 'Tasbeeh Counter — Dhikr Garden',
  description: 'A digital tasbeeh: set a goal, count your dhikr, and watch a flower bloom in your garden with every count.',
};

export default function TasbihPage() {
  return (
    <div className={`${manrope.variable} ${amiri.variable}`}>
      <TasbeehGarden />
    </div>
  );
}
