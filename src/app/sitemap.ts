import { POPULAR_PAIRS, SITE_URL, pairSlug } from '@/lib/pairs';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    ...POPULAR_PAIRS.map(([base, target]) => ({
      url: `${SITE_URL}/convert/${pairSlug(base, target)}`,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ];
}
