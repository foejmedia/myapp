import type { Metadata } from 'next';
import GuidelinesPage from '@/community-v2/screens/GuidelinesPage';

export const metadata: Metadata = { title: 'Guidelines' };

export default function Page() {
  return <GuidelinesPage />;
}
