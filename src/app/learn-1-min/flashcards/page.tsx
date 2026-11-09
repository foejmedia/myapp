import type { Metadata } from 'next';
import FlashcardsPage from '@/learn1min/components/FlashcardsPage';

export const metadata: Metadata = { title: 'Flashcards' };

export default function Page() {
  return <FlashcardsPage />;
}
