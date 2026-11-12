import type { Metadata } from 'next';
import GatheringsPage from '@/community-v2/screens/GatheringsPage';

export const metadata: Metadata = { title: 'Gatherings' };

export default function Page() {
  return <GatheringsPage />;
}
