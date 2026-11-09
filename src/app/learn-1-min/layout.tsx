import type { Metadata } from 'next';
import { amiriLearn } from '@/fonts/amiri';
import { frauncesLearn } from '@/fonts/fraunces';
import { manropeLearn } from '@/fonts/manrope';
import Shell from '@/learn1min/components/Shell';
import { LearnProvider } from '@/learn1min/store/LearnProvider';

export const metadata: Metadata = {
  title: { default: 'Learn in 1 Minute — daily Qur’an learning', template: '%s · Learn in 1 Minute' },
  description:
    'Learn the words of the Qur’an, daily duas and surahs in one minute a day, with flashcards, quizzes and spaced-repetition revision.',
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${manropeLearn.variable} ${frauncesLearn.variable} ${amiriLearn.variable}`}>
      <LearnProvider>
        <Shell>{children}</Shell>
      </LearnProvider>
    </div>
  );
}
