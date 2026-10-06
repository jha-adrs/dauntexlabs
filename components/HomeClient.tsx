'use client'

import { useEffect, useState } from 'react'
import SiteHeader from './SiteHeader'
import Hero from './Hero'
import ToolDeck from './ToolDeck'
import CategoryNav, { type CategoryFilter } from './CategoryNav'
import { CATEGORY_ORDER } from '@/lib/tools'

/** Initial search/category from the URL (?q=, ?cat=). Unknown categories fall back to All. */
export function readInitialFilters(search: string): { query: string; active: CategoryFilter } {
  const params = new URLSearchParams(search)
  const cat = params.get('cat')
  const active =
    cat && (CATEGORY_ORDER as string[]).includes(cat) ? (cat as CategoryFilter) : 'All'
  return { query: params.get('q') ?? '', active }
}

// Holds the homepage's interactive state (search + category filter) so that
// app/page.tsx can stay a server component and own the page metadata.
export default function HomeClient() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<CategoryFilter>('All')

  // Read once on mount (not useSearchParams) so the static export needs no Suspense boundary.
  useEffect(() => {
    const initial = readInitialFilters(window.location.search)
    if (initial.query) setQuery(initial.query)
    if (initial.active !== 'All') setActive(initial.active)
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
