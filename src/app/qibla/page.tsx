import type { Metadata } from 'next';
import { Amiri, Manrope } from 'next/font/google';
import QiblaCompass from '@/components/QiblaCompass';

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--qb-font' });
const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--qb-font-ar' });

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
