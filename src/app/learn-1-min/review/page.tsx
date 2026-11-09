import type { Metadata } from 'next';
import ReviewPage from '@/learn1min/components/ReviewPage';

export const metadata: Metadata = { title: 'Revision' };

export default function Page() {
  return <ReviewPage />;
}
