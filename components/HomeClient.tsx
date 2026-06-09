'use client'

import { useState } from 'react'
import Hero from './Hero'
import ToolDeck from './ToolDeck'
import type { Category } from '@/lib/tools'

// Holds the homepage's interactive state (search + category filter) so that
// app/page.tsx can stay a server component and own the page metadata.
export default function HomeClient() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<'All' | Category>('All')

  return (
    <>
      <Hero query={query} setQuery={setQuery} />
      <ToolDeck query={query} active={active} setActive={setActive} />
    </>
  )
}
