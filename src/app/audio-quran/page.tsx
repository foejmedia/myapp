import type { Metadata } from 'next';
import AudioQuranApp from './AudioQuranApp';

export const metadata: Metadata = {
  title: 'Audio Quran — Listen Ayah by Ayah',
  description: 'Stream all 114 surahs from 30+ reciters, follow the Arabic and its translation as each ayah is recited, and carry on from surah to surah.',
};

export default function AudioQuranPage() {
  return <AudioQuranApp />;
}
