import type { Metadata } from 'next';
import GuidelinesPage from '@/community/components/GuidelinesPage';
import { to } from '@/community/config';

export const metadata: Metadata = {
  title: 'Guidelines',
  description: 'How members of the Learn Quran community treat each other.',
  alternates: { canonical: to('/guidelines') },
};

export default function Page() {
  return <GuidelinesPage />;
}
