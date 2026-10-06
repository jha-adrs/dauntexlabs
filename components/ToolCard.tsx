import Link from 'next/link'
import type { Tool } from '@/lib/tools'

// One tool in the grid: category, name, two-line blurb. Whole card is the link.
export default function ToolCard({ tool }: { tool: Tool }) {
  const soon = tool.status === 'maintenance'
  return (
    <Link href={`/tools/${tool.slug}/`} className={`card${soon ? ' is-soon' : ''}`}>
      <span className="card-cat">{tool.category}</span>
      <h3>{tool.name}</h3>
      <p>{tool.blurb}</p>
      {soon && <span className="soon-pill">Coming soon</span>}
    </Link>
  )
}
