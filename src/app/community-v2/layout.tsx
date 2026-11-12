import type { Metadata } from 'next';
import Shell from '@/community-v2/Shell';
import { manropeHomeV2 } from '@/fonts/manrope';
import './host.css';

export const metadata: Metadata = {
  title: { default: 'Learn Quran Community', template: '%s · Learn Quran Community' },
  description:
    'A small, moderated community for people learning to read, memorise and understand the Quran. Find a circle at your level and a partner to revise with.',
  // a design preview of /community: keep it out of search results
  robots: { index: false, follow: false },
};

export default function CommunityV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`cv-host ${manropeHomeV2.variable}`}>
      <Shell>{children}</Shell>
    </div>
  );
}
