import type { Metadata } from 'next';
import StoriesPage from '@/community-v2/screens/StoriesPage';

export const metadata: Metadata = { title: 'Stories' };

export default function Page() {
  return <StoriesPage />;
}
