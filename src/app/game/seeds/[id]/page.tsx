import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SeedCard from '@/game/components/SeedCard';
import { DHIKR, DHIKR_BY_ID } from '@/game/content/dhikr';

export const dynamicParams = false;

export function generateStaticParams() {
  return DHIKR.map(d => ({ id: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const d = DHIKR_BY_ID[id];
  return d ? { title: `${d.transliteration} — The Garden of Dhikr`, description: `${d.translation} Grows: ${d.plant}.` } : {};
}

export default async function SeedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = DHIKR_BY_ID[id];
  if (!d) notFound();
  return <SeedCard dhikr={d} />;
}
