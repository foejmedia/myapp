import type { Metadata } from 'next';
import MembersPage from '@/community-v2/screens/MembersPage';

export const metadata: Metadata = { title: 'Members' };

export default function Page() {
  return <MembersPage />;
}
