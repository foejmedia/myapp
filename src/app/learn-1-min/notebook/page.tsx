import type { Metadata } from 'next';
import NotebookPage from '@/learn1min/components/NotebookPage';

export const metadata: Metadata = { title: 'Notebook' };

export default function Page() {
  return <NotebookPage />;
}
