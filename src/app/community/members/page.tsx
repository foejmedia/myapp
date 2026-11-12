import type { Metadata } from 'next';
import MembersPage from '@/community/components/MembersPage';
import { to } from '@/community/config';

export const metadata: Metadata = {
  title: 'Members',
  description: 'Readers, memorisers, parents and teachers learning the Quran together.',
  alternates: { canonical: to('/members') },
};

export default function Page() {
  return <MembersPage />;
}
