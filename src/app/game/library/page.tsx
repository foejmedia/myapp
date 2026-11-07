import type { Metadata } from 'next';
import Library from '@/game/components/Library';

export const metadata: Metadata = { title: 'Seed Library — The Garden of Dhikr' };

export default function LibraryPage() {
  return <Library />;
}
