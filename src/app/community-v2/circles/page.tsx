import type { Metadata } from 'next';
import CirclesPage from '@/community-v2/screens/CirclesPage';

export const metadata: Metadata = { title: 'Circles' };

export default function Page() {
  return <CirclesPage />;
}
