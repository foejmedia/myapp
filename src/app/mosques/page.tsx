import type { Metadata } from 'next';
import { Amiri, Manrope } from 'next/font/google';
import NearbyMosques from '@/components/mosques/NearbyMosques';

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--mq-font' });
const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--mq-font-ar' });

export const metadata: Metadata = {
  title: 'Mosques Near You',
  description: 'Find mosques near you on a map, see their address and facilities, and get directions.',
};

export default function MosquesPage() {
  return (
    <div className={`${manrope.variable} ${amiri.variable}`}>
      <NearbyMosques />
    </div>
  );
}
