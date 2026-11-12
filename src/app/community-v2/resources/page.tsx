import type { Metadata } from 'next';
import ResourcesPage from '@/community-v2/screens/ResourcesPage';

export const metadata: Metadata = { title: 'Resources' };

export default function Page() {
  return <ResourcesPage />;
}
