import type { Metadata } from 'next';
import Shell from '@/community/components/Shell';
import { manropeCommunity } from '@/fonts/manrope';
import './host.css';

export const metadata: Metadata = {
  title: { default: 'Learn Quran Community', template: '%s · Learn Quran Community' },
  description:
    'A small, moderated community for people learning to read, memorise and understand the Quran. Find a circle at your level and a partner to revise with.',
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`cm-host ${manropeCommunity.variable}`}>
      <Shell>{children}</Shell>
    </div>
  );
}
