import type { Metadata } from 'next';
import { amiriLearn } from '@/fonts/amiri';
import { frauncesLearn } from '@/fonts/fraunces';
import { manropeLearn } from '@/fonts/manrope';
import LearnApp from '@/learn1min/components/LearnApp';
import { buildAllLessons } from '@/learn1min/content/sources';

export const metadata: Metadata = {
  title: 'Learn in 1 Minute — a new Islamic lesson every day',
  description:
    'One short lesson a day: a word of the Quran, a dua or a surah. Learn it in a minute, check yourself, and track your days.',
};

// Built once at build time; only the compact lessons are sent to the browser.
const LESSONS = buildAllLessons();

export default function LearnInOneMinutePage() {
  return (
    <div className={`${manropeLearn.variable} ${frauncesLearn.variable} ${amiriLearn.variable}`}>
      <LearnApp lessons={LESSONS} />
    </div>
  );
}
