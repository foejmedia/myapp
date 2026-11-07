import type { Metadata } from 'next';
import DuaGarden from '@/game/components/DuaGarden';

export const metadata: Metadata = { title: 'Dua Garden — The Garden of Dhikr' };

export default function DuaPage() {
  return <DuaGarden />;
}
