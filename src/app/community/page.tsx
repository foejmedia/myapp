import type { Metadata } from 'next';
import HomePage from '@/community/components/HomePage';
import { to } from '@/community/config';

export const metadata: Metadata = { alternates: { canonical: to() } };

export default function Page() {
  return <HomePage />;
}
