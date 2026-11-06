import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch | LearnQuran',
  description: 'Quran recitation, lectures in English and Urdu, kids’ videos and Islamic TV — the latest uploads from trusted channels.',
  keywords: ['Quran videos', 'Quran recitation', 'Islamic lectures', 'Urdu bayan', 'Islamic kids videos'],
  openGraph: {
    title: 'LearnQuran Watch',
    description: 'Quran recitation, lectures and more from trusted channels.',
  },
};

export default function VideoGalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
