import type { Metadata } from 'next';
import { manropeSchedule as manrope } from '@/fonts/manrope';
import { amiriSchedule as amiri } from '@/fonts/amiri';
import ScheduleApp from '@/components/schedule/ScheduleApp';

export const metadata: Metadata = {
  title: 'My Schedule',
  description:
    'Plan your day around the five prayers: a weekly planner with real prayer times, iftar and sehri in Ramadan, and activities pinned to Fajr, Maghrib and more.',
};

export default function MySchedulePage() {
  return (
    <div className={`${manrope.variable} ${amiri.variable}`}>
      <ScheduleApp />
    </div>
  );
}
