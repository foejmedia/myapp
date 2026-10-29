import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import QuizPlay from '@/components/quiz/QuizPlay';

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--qz-font' });

export const metadata: Metadata = {
  title: 'Quran Quiz',
  robots: { index: false },
};

export default function QuizPlayPage() {
  return (
    <div className={manrope.variable}>
      <Suspense fallback={null}>
        <QuizPlay />
      </Suspense>
    </div>
  );
}
