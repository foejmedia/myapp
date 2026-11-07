import type { Metadata } from 'next';
import { manropeQibla as manrope } from '@/fonts/manrope';
import { amiriQibla as amiri } from '@/fonts/amiri';
import QiblaCompass from '@/components/QiblaCompass';


export const metadata: Metadata = {
  title: 'Qibla Compass',
  description: 'Find the Qibla direction to the Kaaba from your location with a live compass.',
};

export default function QiblaPage() {
  return (
    <div className={`${manrope.variable} ${amiri.variable}`}>
      <QiblaCompass />
    </div>
  );
}
