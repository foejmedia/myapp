import type { Metadata } from 'next';
import GameShell from '@/game/components/GameShell';
import { amiri, fraunces, manrope } from '@/game/fonts';
import { GardenProvider } from '@/game/state/GardenProvider';

export const metadata: Metadata = {
  title: 'The Garden of Dhikr — Plant with your tongue. Grow with your heart.',
  description:
    'A calm dhikr game: every authentic remembrance plants something in a chahar bagh that follows your real prayer times and Hijri calendar. Private, on your device.',
};

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${amiri.variable} ${manrope.variable} ${fraunces.variable}`}>
      <GardenProvider>
        <GameShell>{children}</GameShell>
      </GardenProvider>
    </div>
  );
}
