import type { Metadata } from 'next';
import { manropeTasbih as manrope } from '@/fonts/manrope';
import { amiriTasbih as amiri } from '@/fonts/amiri';
import TasbeehGarden from '@/components/tasbih-garden/TasbeehGarden';


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
