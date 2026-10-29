import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import QuizHub from '@/components/quiz/QuizHub';

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--qz-font' });

export const metadata: Metadata = {
  title: 'Quran Quiz',
  description: 'Learn and revise the Quran with quizzes on ayahs, surahs, translations, vocabulary and recitation.',
};

export default function QuizPage() {
  return (
    <div className={manrope.variable}>
      <QuizHub />
    </div>
  );
}
