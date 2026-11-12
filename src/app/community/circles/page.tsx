import type { Metadata } from 'next';
import CirclesPage from '@/community/components/CirclesPage';
import { to } from '@/community/config';

export const metadata: Metadata = {
  title: 'Circles',
  description: 'Small, moderated circles with one subject each: first steps, tajweed, hifz, revision, word by word, tafseer and more.',
  alternates: { canonical: to('/circles') },
};

export default function Page() {
  return <CirclesPage />;
}
