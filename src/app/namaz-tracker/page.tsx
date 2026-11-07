import type { Metadata } from 'next';
import { manropeNamaz as manrope } from '@/fonts/manrope';
import { amiriNamaz as amiri } from '@/fonts/amiri';
import NamazTracker from '@/components/NamazTracker';


export const metadata: Metadata = {
  title: 'Namaz Tracker',
  description: 'Track your five daily prayers, view your month, and keep count of qaza.',
};

export default function NamazTrackerPage() {
  return (
    <div className={`${manrope.variable} ${amiri.variable}`}>
      <NamazTracker />
    </div>
  );
}
