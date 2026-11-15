import type { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import HomeAbout from '@/components/home/HomeAbout';
import { HOME_FAQ } from '@/components/home/homeFaq';
import { getOrganizationSchema, getWebsiteSchema } from '@/lib/seoSchemas';
import { SITE_URL } from '@/lib/site';

const TITLE = 'Learn Quran Online Free – Read, Listen & Memorize the Holy Quran';
const DESCRIPTION =
  'Learn Quran online for free: read all 114 surahs with translation and tafseer, listen ayah by ayah, learn Noorani Qaida and tajweed, and memorize at your own pace.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    title: 'Learn Quran Online, for Free',
    description: DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Learn Quran online, for free' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learn Quran Online, for Free',
    description: DESCRIPTION,
    images: ['/og-image.png'],
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/#faq`,
  mainEntity: HOME_FAQ.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

/** JSON-LD must not be able to close its <script> tag */
const ld = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(getOrganizationSchema())} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(getWebsiteSchema())} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(faqSchema)} />
      <HomeClient>
        <HomeAbout />
      </HomeClient>
    </>
  );
}
