import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBar from '@/components/StatusBar'
import Footer from '@/components/Footer'
import ToolMount from '@/components/ToolMount'
import { tools, CATEGORY_CODE, toolIndex } from '@/lib/tools'

type Params = { params: Promise<{ slug: string }> }

// Pre-render one static HTML file per tool at build time (the SEO win).
export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }))
}

// Reject any slug not in the registry.
export const dynamicParams = false

// Per-tool <title>, description, canonical and OpenGraph — baked into the
// static HTML, derived entirely from the registry.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const tool = tools.find((t) => t.slug === slug)
  if (!tool) return {}
  const path = `/tools/${tool.slug}/`
  return {
    title: tool.name,
    description: tool.blurb,
    keywords: tool.keywords,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      title: `${tool.name} — dauntexlabs`,
      description: tool.blurb,
      url: path,
    },
  }
}

export default async function ToolPage({ params }: Params) {
  const { slug } = await params
  const tool = tools.find((t) => t.slug === slug)
  if (!tool) notFound()

  const idx = toolIndex(tool.slug)

  if (tool.status === 'maintenance') {
    return (
      <>
        <StatusBar />
        <main className="shell tool-page">
          <Link href="/" className="back">
            ← deck
          </Link>
          <div className="tool-head">
            <span className="idx">
              {CATEGORY_CODE[tool.category]}·{idx}
            </span>
            <span className="cat">{tool.category}</span>
          </div>
          <h1>{tool.name}</h1>
          <p className="lede">{tool.blurb}</p>

          <div className="maintenance">
            <span className="maintenance-tag">◐ under maintenance</span>
            <p>
              This module is being finished and will be available shortly. Like every dauntexlabs
              tool, it is designed to run in your browser.
            </p>
            <Link href="/" className="back">
              ← browse the other tools
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <StatusBar />
      <main className="shell tool-page">
        <Link href="/" className="back">
          ← deck
        </Link>

        <div className="tool-head">
          <span className="idx">
            {CATEGORY_CODE[tool.category]}·{idx}
          </span>
          <span className="cat">{tool.category}</span>
        </div>

        <h1>{tool.name}</h1>
        <p className="lede">{tool.blurb}</p>

        <ToolMount slug={tool.slug} />

        <p className="tool-foot-note">
          <span className="ready">
            <span className="d" /> designed to run in your browser · see the{' '}
            <Link href="/privacy/" className="foot-link">
              privacy policy
            </Link>
          </span>
        </p>
      </main>
      <Footer />
    </>
  )
}
