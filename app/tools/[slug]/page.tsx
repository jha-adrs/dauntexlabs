import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBar from '@/components/StatusBar'
import Footer from '@/components/Footer'
import ToolMount from '@/components/ToolMount'
import JsonLd from '@/components/JsonLd'
import { tools, CATEGORY_CODE, toolIndex, type Category } from '@/lib/tools'

const SITE = 'https://dauntexlabs.com'

// Map our categories to schema.org applicationCategory values.
const SCHEMA_CATEGORY: Record<Category, string> = {
  Utilities: 'UtilitiesApplication',
  Converters: 'UtilitiesApplication',
  Formatters: 'DeveloperApplication',
  Generators: 'DeveloperApplication',
  'Data Tools': 'DeveloperApplication',
  'Image Tools': 'MultimediaApplication',
  'PDF Tools': 'BusinessApplication',
  'Text Tools': 'UtilitiesApplication',
  'Web & CSS': 'DeveloperApplication',
  'Business & Finance': 'FinanceApplication',
  Education: 'EducationalApplication',
  'Health & Fitness': 'HealthApplication',
  Everyday: 'UtilitiesApplication',
  'Marketing & SEO': 'BusinessApplication',
}

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
    // Keep unfinished tools out of the index; still crawlable/followable.
    robots: tool.status === 'maintenance' ? { index: false, follow: true } : undefined,
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

  const path = `${SITE}/tools/${tool.slug}/`
  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    url: path,
    description: tool.blurb,
    applicationCategory: SCHEMA_CATEGORY[tool.category],
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: 'dauntexlabs', url: `${SITE}/` },
  }
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: tool.name, item: path },
    ],
  }

  return (
    <>
      <JsonLd data={appSchema} />
      <JsonLd data={breadcrumbs} />
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
