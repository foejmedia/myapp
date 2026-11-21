import type { Metadata } from 'next';
import TafsirAudio from '@/components/tafsir-audio/TafsirAudio';

export const metadata: Metadata = {
  title: 'Tafsir Audio — Listen to the Tafsir of Every Surah',
  description:
    'Listen to recorded tafsir of all 114 surahs in Arabic and Urdu (Bayan ul Quran by Dr. Israr Ahmed), and read the detailed tafsir of each ayah in English, Urdu, Arabic, Bengali, Russian and Kurdish.',
  alternates: { canonical: '/tafsir-audio' },
};

export default function TafsirAudioPage() {
  return <TafsirAudio />;
}
