import type { Metadata } from 'next';
import { Suspense } from 'react';
import DuasPage from '@/learn1min/components/DuasPage';

export const metadata: Metadata = { title: 'Daily duas' };

export default function Page() {
  return (
    <Suspense>
      <DuasPage />
    </Suspense>
  );
}
