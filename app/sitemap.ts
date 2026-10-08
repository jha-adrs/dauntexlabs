import type { MetadataRoute } from 'next'
import { tools } from '@/lib/tools'
import { PAIRS, isIndexedPair } from '@/lib/conversions'
import { HUBS, hubHref } from '@/lib/hubs'

const SITE = 'https://dauntexlabs.com'

// Required for `output: export` — emit this route as a static file.
export const dynamic = 'force-static'

// Generated from the registry → emits static sitemap.xml at build time.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/privacy/`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE}/convert/`, changeFrequency: 'weekly', priority: 0.7 },
    ...HUBS.map((h) => ({ url: `${SITE}${hubHref(h)}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
    // Only index live tools — the under-maintenance page is noindex + excluded.
    ...tools
      .filter((t) => t.status !== 'maintenance')
      .map((t) => ({
        url: `${SITE}/tools/${t.slug}/`,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      })),
    // Programmatic conversion pages — commodity unit pairs are noindexed (see isIndexedPair).
    ...PAIRS.filter(isIndexedPair).map((p) => ({
      url: `${SITE}/convert/${p.slug}/`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
