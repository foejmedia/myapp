import type { Metadata } from 'next';
import QuizPage from '@/learn1min/components/QuizPage';

export const metadata: Metadata = { title: 'Quizzes' };

export default function Page() {
  return <QuizPage />;
}
