import Link from 'next/link'
import { CATEGORY_CODE, toolIndex, type Tool } from '@/lib/tools'

interface Props {
  tool: Tool
  delay: number
}

// A module in the rack: index code, category tag, name, blurb, status + open.
export default function ToolCard({ tool, delay }: Props) {
  const idx = toolIndex(tool.slug)
  const soon = tool.status === 'maintenance'
  return (
    <Link
      href={`/tools/${tool.slug}/`}
      className={`card reveal${soon ? ' is-soon' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="ghost" aria-hidden>
        {idx}
      </span>

      <div className="card-top">
        <span className="idx">
          {CATEGORY_CODE[tool.category]}·{idx}
        </span>
        <span className="cat">{tool.category}</span>
      </div>

      <h3>{tool.name}</h3>
      <p>{tool.blurb}</p>

      <div className="foot">
        <span className={`ready${soon ? ' soon' : ''}`}>
          <span className="d" /> {soon ? 'soon' : 'ready'}
        </span>
        <span className="open">{soon ? 'preview →' : 'open →'}</span>
      </div>
    </Link>
  )
}
