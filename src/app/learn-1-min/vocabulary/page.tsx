import type { Metadata } from 'next';
import { Suspense } from 'react';
import VocabularyPage from '@/learn1min/components/VocabularyPage';

export const metadata: Metadata = { title: 'Qur’an vocabulary' };

export default function Page() {
  return (
    <Suspense>
      <VocabularyPage />
    </Suspense>
  );
}
