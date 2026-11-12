import type { Metadata } from 'next';
import StoriesPage from '@/community/components/StoriesPage';
import { to } from '@/community/config';

export const metadata: Metadata = {
  title: 'Stories',
  description: 'Milestones shared by members of the Learn Quran community, in their own words.',
  alternates: { canonical: to('/stories') },
};

export default function Page() {
  return <StoriesPage />;
}
