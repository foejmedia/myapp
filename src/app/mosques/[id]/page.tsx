import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Amiri, Manrope } from 'next/font/google';
import MosqueDetails from '@/components/mosques/MosqueDetails';
import { isMosqueId } from '@/lib/mosques';

const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--mq-font' });
const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--mq-font-ar' });

export const metadata: Metadata = {
  title: 'Mosque Details',
  description: 'Address, map, facilities, prayer times and directions for this mosque.',
};

export default async function MosquePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isMosqueId(id)) notFound();
  return (
    <div className={`${manrope.variable} ${amiri.variable}`}>
      <MosqueDetails id={id} />
    </div>
  );
}
