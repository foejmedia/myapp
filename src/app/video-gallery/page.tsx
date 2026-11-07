import { Suspense } from 'react';
import { manropeVideo as manrope } from '@/fonts/manrope';
import Watch from '@/components/watch/Watch';


export default function VideoGalleryPage() {
  return (
    <div className={manrope.variable}>
      <Suspense fallback={null}>
        <Watch />
      </Suspense>
    </div>
  );
}
