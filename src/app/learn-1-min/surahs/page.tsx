import type { Metadata } from 'next';
import SurahsPage from '@/learn1min/components/SurahsPage';

export const metadata: Metadata = { title: 'Surahs' };

export default function Page() {
  return <SurahsPage />;
}
