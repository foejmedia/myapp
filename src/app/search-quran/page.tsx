import type { Metadata } from 'next';
import { Suspense } from 'react';
import SearchQuran from '@/components/search-quran/SearchQuran';

export const metadata: Metadata = {
  title: 'Search the Quran',
  description: 'Search every ayah of the Quran by word or topic in the Saheeh International English translation.',
};

export default function SearchQuranPage() {
  return (
    <Suspense fallback={null}>
      <SearchQuran />
    </Suspense>
  );
}
