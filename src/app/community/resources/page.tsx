import type { Metadata } from 'next';
import ResourcesPage from '@/community/components/ResourcesPage';
import { to } from '@/community/config';

export const metadata: Metadata = {
  title: 'Resources',
  description: 'The Learn Quran tools our circles practise with, free for everyone.',
  alternates: { canonical: to('/resources') },
};

export default function Page() {
  return <ResourcesPage />;
}
