import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SurahDetail from '@/learn1min/components/SurahDetail';
import { CHAPTERS, chapter } from '@/learn1min/content/chapters';

export const dynamicParams = false;

export function generateStaticParams() {
  return CHAPTERS.map(c => ({ id: String(c.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = chapter(Number((await params).id));
  return c ? { title: `Surah ${c.nameSimple}`, description: `Learn Surah ${c.nameSimple} (${c.meaning}) ayah by ayah.` } : {};
}

export default async function SurahPage({ params }: { params: Promise<{ id: string }> }) {
  const n = Number((await params).id);
  if (!chapter(n)) notFound();
  return <SurahDetail n={n} />;
}
