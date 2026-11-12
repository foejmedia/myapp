import type { Metadata } from 'next';
import { manropeHomeV2 } from '@/fonts/manrope';
import './host.css';

/* A trial of a second homepage design. It is not linked from the site and not indexed until it is chosen. */
export const metadata: Metadata = {
  title: 'Learn Quran: a little every day',
  description:
    'Read, listen, memorise and understand the Quran. Everything in one place: free, in your browser, at your own pace.',
  robots: { index: false, follow: false },
};

export default function HomeV2Layout({ children }: { children: React.ReactNode }) {
  return <div className={`hv-host ${manropeHomeV2.variable}`}>{children}</div>;
}
