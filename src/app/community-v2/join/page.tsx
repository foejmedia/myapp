import type { Metadata } from 'next';
import JoinPage from '@/community-v2/screens/JoinPage';

export const metadata: Metadata = { title: 'Apply to join' };

export default function Page() {
  return <JoinPage />;
}
