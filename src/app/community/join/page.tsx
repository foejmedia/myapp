import type { Metadata } from 'next';
import JoinPage from '@/community/components/JoinPage';
import { to } from '@/community/config';

export const metadata: Metadata = {
  title: 'Apply to join',
  description: 'Apply to join the Learn Quran community. It takes about three minutes.',
  alternates: { canonical: to('/join') },
};

export default function Page() {
  return <JoinPage />;
}
