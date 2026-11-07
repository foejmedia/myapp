import type { Metadata } from 'next';
import { manropeMosques as manrope } from '@/fonts/manrope';
import { amiriMosques as amiri } from '@/fonts/amiri';
import NearbyMosques from '@/components/mosques/NearbyMosques';


export const metadata: Metadata = {
  title: 'Mosques Near You',
  description: 'Find mosques near you on Google Maps and get directions.',
};

export default function MosquesPage() {
  return (
    <div className={`${manrope.variable} ${amiri.variable}`}>
      <NearbyMosques />
    </div>
  );
}
