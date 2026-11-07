import type { Metadata } from 'next';
import SettingsPanel from '@/game/components/SettingsPanel';

export const metadata: Metadata = { title: 'Settings — The Garden of Dhikr' };

export default function SettingsPage() {
  return <SettingsPanel />;
}
