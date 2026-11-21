import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

/** Main sections, most important first. Only routes that exist — a 404 in a sitemap wastes Google's crawl. */
const SECTIONS: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/read-quran', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/learn-quran', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/quran-player', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/memorize-quran', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/hifz', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/tajweed', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/tafseer', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/learn-1-min', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/quran-pages', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/audio-quran', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/tafsir-audio', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/radio', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/duas', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/hadees', priority: 0.7, changeFrequency: 'daily' },
  { path: '/namaz-tracker', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/qibla', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/mosques', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/tasbih', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/quiz', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/books', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/video-gallery', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/seerah-audio', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/community', priority: 0.6, changeFrequency: 'daily' },
  ...['circles', 'members', 'stories', 'gatherings', 'resources', 'guidelines', 'join'].map(p => ({
    path: `/community/${p}`,
    priority: 0.4,
    changeFrequency: 'weekly' as const,
  })),
  { path: '/privacy', priority: 0.2, changeFrequency: 'monthly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'monthly' },
];

const SURAH_COUNT = 114;
const QAIDA_LESSONS = 18;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...SECTIONS.map(s => ({ url: absoluteUrl(s.path), changeFrequency: s.changeFrequency, priority: s.priority })),
    // one page per surah — these are what people search for ("surah yasin", "surah mulk"...)
    ...Array.from({ length: SURAH_COUNT }, (_, i) => ({
      url: absoluteUrl(`/read-quran/${i + 1}`),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...Array.from({ length: QAIDA_LESSONS }, (_, i) => ({
      url: absoluteUrl(`/learn-quran/lesson/${i + 1}`),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
}
