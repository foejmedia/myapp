import type { Metadata } from 'next';
import { manropeNamaz as manrope } from '@/fonts/manrope';
import { amiriNamaz as amiri } from '@/fonts/amiri';
import NamazDashboard from '@/components/namaz/NamazDashboard';


export const metadata: Metadata = {
  title: 'Namaz Tracker',
  description: 'Track your five daily prayers on a weekly calendar of real prayer times, keep count of qaza, and see your progress.',
};

export default function NamazTrackerPage() {
  return (
    <div className={`${manrope.variable} ${amiri.variable}`}>
      <NamazDashboard />
    </div>
  );
}
