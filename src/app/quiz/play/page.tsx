import { Suspense } from 'react';
import type { Metadata } from 'next';
import { manropeQuiz as manrope } from '@/fonts/manrope';
import QuizPlay from '@/components/quiz/QuizPlay';


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
