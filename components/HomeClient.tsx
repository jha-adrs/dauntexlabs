'use client'

import { useEffect, useState } from 'react'
import SiteHeader from './SiteHeader'
import Hero from './Hero'
import ToolDeck from './ToolDeck'
import CategoryNav, { type CategoryFilter } from './CategoryNav'
import { CATEGORY_ORDER } from '@/lib/tools'

/**
 * Initial search/category from the URL. The search term comes from the #q= fragment
 * (fragments are not part of HTTP requests); a legacy ?q= is still read. Unknown categories fall back to All.
 */
export function readInitialFilters(
  search: string,
  hash = '',
): { query: string; active: CategoryFilter } {
  const params = new URLSearchParams(search)
  const fragment = new URLSearchParams(hash.replace(/^#/, ''))
  const cat = params.get('cat')
  const active =
    cat && (CATEGORY_ORDER as string[]).includes(cat) ? (cat as CategoryFilter) : 'All'
  return { query: fragment.get('q') ?? params.get('q') ?? '', active }
}

// Holds the homepage's interactive state (search + category filter) so that
// app/page.tsx can stay a server component and own the page metadata.
export default function HomeClient() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<CategoryFilter>('All')

  // Read once on mount (not useSearchParams) so the static export needs no Suspense boundary.
  useEffect(() => {
    const { pathname, search, hash } = window.location
    const initial = readInitialFilters(search, hash)
    if (initial.query) setQuery(initial.query)
    if (initial.active !== 'All') setActive(initial.active)
    // Drop a legacy ?q= from the address bar so the term isn't re-sent on reload.
    const params = new URLSearchParams(search)
    if (params.has('q')) {
      const cat = params.get('cat')
      const kept = cat ? `?cat=${encodeURIComponent(cat)}` : ''
      window.history.replaceState(null, '', pathname + kept + hash)
    }
  }, [])

  return (
    <>
      <SiteHeader query={query} setQuery={setQuery} />
      <main className="shell workbench">
        <CategoryNav active={active} onSelect={setActive} />
        <div className="workbench-main">
          <Hero />
          <ToolDeck query={query} setQuery={setQuery} active={active} />
        </div>
      </main>
    </>
  )
}
