import type { Metadata } from 'next';
import GatheringsPage from '@/community/components/GatheringsPage';
import { to } from '@/community/config';

export const metadata: Metadata = {
  title: 'Gatherings',
  description: 'Weekly circle sessions, recitation clinics, partner check-ins and city meetups.',
  alternates: { canonical: to('/gatherings') },
};

export default function Page() {
  return <GatheringsPage />;
}
