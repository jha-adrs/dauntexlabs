'use client'

import { useMemo } from 'react'
import { tools, CATEGORY_ORDER, toolsByCategory, type Tool } from '@/lib/tools'
import ToolCard from './ToolCard'
import type { CategoryFilter } from './CategoryNav'

interface Props {
  query: string
  setQuery: (q: string) => void
  active: CategoryFilter
}

function matches(tool: Tool, q: string): boolean {
  if (!q) return true
  const hay = `${tool.name} ${tool.blurb} ${tool.keywords.join(' ')} ${tool.category}`.toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term))
}

export default function ToolDeck({ query, setQuery, active }: Props) {
  const filtered = useMemo(
    () => tools.filter((t) => (active === 'All' || t.category === active) && matches(t, query)),
    [query, active],
  )

  const grouped = query.trim() === '' && active === 'All'

  return (
    <section className="deck">
      {!grouped && filtered.length > 0 && (
        <p className="deck-results">
          <b>{filtered.length}</b> {filtered.length === 1 ? 'tool' : 'tools'}
          {query.trim() ? <> matching “{query}”</> : <> in {active}</>}
        </p>
      )}

      {filtered.length === 0 && (
        <div className="empty">
          <p>No tools match “{query}”.</p>
          <button type="button" className="btn" onClick={() => setQuery('')}>
            Clear search
          </button>
        </div>
      )}

      {grouped ? (
        CATEGORY_ORDER.map((category) => {
          const items = toolsByCategory(category)
          return (
            <section className="cat-group" key={category}>
              <header className="cat-head">
                <h2>{category}</h2>
                <span className="count">{items.length}</span>
              </header>
              <div className="deck-grid">
                {items.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          )
        })
      ) : (
        <div className="deck-grid">
          {filtered.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </section>
  )
}
