import JsonLd from '@/components/JsonLd'
import { TOOL_CONTENT } from '@/lib/tool-content'
import type { Tool } from '@/lib/tools'

// Server-rendered about / how-to / FAQ under a tool: indexable text, no client JS.
export default function ToolAbout({ tool }: { tool: Tool }) {
  const c = TOOL_CONTENT[tool.slug]
  if (!c) return null

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <section className="tool-about">
      <JsonLd data={faqSchema} />
      <h2>About {tool.name}</h2>
      {c.intro.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <h2>How to use</h2>
      <ol>
        {c.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <h2>FAQ</h2>
      {c.faq.map((f, i) => (
        <details className="faq" key={i} open={i === 0}>
          <summary>
            {f.q}
            <span className="plus">+</span>
          </summary>
          <div className="ans">{f.a}</div>
        </details>
      ))}
    </section>
  )
}
