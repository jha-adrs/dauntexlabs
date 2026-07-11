import type { MetadataRoute } from 'next'
import { tools } from '@/lib/tools'

const SITE = 'https://dauntexlabs.com'

// Required for `output: export` — emit this route as a static file.
export const dynamic = 'force-static'

// Generated from the registry → emits static sitemap.xml at build time.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/privacy/`, changeFrequency: 'yearly', priority: 0.3 },
    // Only index live tools — the under-maintenance page is noindex + excluded.
    ...tools
      .filter((t) => t.status !== 'maintenance')
      .map((t) => ({
        url: `${SITE}/tools/${t.slug}/`,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      })),
  ]
}
