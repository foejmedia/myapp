import type { MetadataRoute } from 'next';
import { absoluteUrl, SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // API responses, sign-in screens and internal demo pages aren't useful search results
      disallow: ['/api/', '/login', '/signup', '/standalone-demo', '/word-explorer-demo'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
