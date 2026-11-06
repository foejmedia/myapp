import { Suspense } from 'react';
import { Manrope } from 'next/font/google';
import Watch from '@/components/watch/Watch';

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--wt-font' });

export default function VideoGalleryPage() {
  return (
    <div className={manrope.variable}>
      <Suspense fallback={null}>
        <Watch />
      </Suspense>
    </div>
  );
}
