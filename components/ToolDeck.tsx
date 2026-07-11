'use client'

import { useMemo } from 'react'
import {
  tools,
  CATEGORY_ORDER,
  CATEGORY_CODE,
  toolsByCategory,
  type Category,
  type Tool,
} from '@/lib/tools'
import ToolCard from './ToolCard'

type Filter = 'All' | Category

interface Props {
  query: string
  active: Filter
  setActive: (f: Filter) => void
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

export default function ToolDeck({ query, active, setActive }: Props) {
  const filtered = useMemo(
    () => tools.filter((t) => (active === 'All' || t.category === active) && matches(t, query)),
    [query, active],
  )

  const grouped = query.trim() === '' && active === 'All'

  return (
    <section className="deck shell">
      <nav className="chips" aria-label="Filter by category">
        <button
          className={`chip ${active === 'All' ? 'active' : ''}`}
          onClick={() => setActive('All')}
        >
          All <em>{tools.length}</em>
        </button>
        {CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            className={`chip ${active === c ? 'active' : ''}`}
            onClick={() => setActive(c)}
          >
            {c} <em>{toolsByCategory(c).length}</em>
          </button>
        ))}
      </nav>

      {!grouped && filtered.length > 0 && (
        <p className="deck-results">
          <b>{filtered.length}</b> {filtered.length === 1 ? 'tool' : 'tools'}
          {query.trim() ? <> matching “{query}”</> : <> in {active}</>}
        </p>
      )}

      {filtered.length === 0 && (
        <p className="empty">
          <span className="caret">›</span> no tools match “{query}”
        </p>
      )}

      {grouped ? (
        CATEGORY_ORDER.map((category) => {
          const items = toolsByCategory(category)
          return (
            <div key={category}>
              <header className="cat-head">
                <span className="code">{CATEGORY_CODE[category]}</span>
                <h2>{category}</h2>
                <span className="rule" />
                <span className="count">{String(items.length).padStart(2, '0')}</span>
              </header>
              <div className="deck-grid">
                {items.map((tool, i) => (
                  <ToolCard key={tool.slug} tool={tool} delay={i * 35} />
                ))}
              </div>
            </div>
          )
        })
      ) : (
        <div className="deck-grid solo">
          {filtered.map((tool, i) => (
            <ToolCard key={tool.slug} tool={tool} delay={i * 30} />
          ))}
        </div>
      )}
    </section>
  )
}
