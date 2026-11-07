import type { Metadata } from 'next';
import { manropeQuiz as manrope } from '@/fonts/manrope';
import QuizHub from '@/components/quiz/QuizHub';


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
