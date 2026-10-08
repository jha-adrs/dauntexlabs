import type { Category } from '@/lib/tools'

// Category → hub page slug. Kept apart from lib/hubs.ts (intro/FAQ text) so the
// client-side category nav does not ship the hub copy in its bundle.
export const HUB_SLUGS: Partial<Record<Category, 'india' | 'aviation'>> = {
  India: 'india',
  Aviation: 'aviation',
}

/** Where a category link should go: its hub page if it has one, else the homepage filter. */
export function categoryHref(c: Category): string {
  const slug = HUB_SLUGS[c]
  return slug ? `/category/${slug}/` : `/?cat=${encodeURIComponent(c)}`
}
