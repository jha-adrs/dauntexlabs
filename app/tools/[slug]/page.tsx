import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import CategoryNav from '@/components/CategoryNav'
import ToolAbout from '@/components/ToolAbout'
import Footer from '@/components/Footer'
import ToolMount from '@/components/ToolMount'
import ToolCard from '@/components/ToolCard'
import JsonLd from '@/components/JsonLd'
import { tools, type Category } from '@/lib/tools'
import { PAIRS } from '@/lib/conversions'

// Tools that have a companion family of /convert long-tail pages.
const CONVERT_PARENT: Record<string, 'unit' | 'base' | 'image'> = {
  'unit-converter': 'unit',
  'number-base-converter': 'base',
  'image-converter': 'image',
}

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
  Aviation: 'UtilitiesApplication',
  India: 'UtilitiesApplication',
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

  if (tool.status === 'maintenance') {
    return (
      <>
        <SiteHeader />
        <main className="shell workbench tool-page">
          <CategoryNav active={tool.category} />
          <div className="workbench-main">
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link href="/">All tools</Link>
              <span className="sep">›</span>
              <Link href={`/?cat=${encodeURIComponent(tool.category)}`}>{tool.category}</Link>
              <span className="sep">›</span>
              <span className="crumb-here">{tool.name}</span>
            </nav>
            <h1>{tool.name}</h1>
            <p className="lede">{tool.blurb}</p>

            <div className="maintenance">
              <span className="maintenance-tag">Under maintenance</span>
              <p>
                This tool is being finished and will be available shortly. Like every dauntexlabs
                tool, it is designed to run in your browser.
              </p>
              <Link href="/" className="back">
                ← Browse the other tools
              </Link>
            </div>
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

  const related = tools
    .filter((t) => t.category === tool.category && t.slug !== tool.slug && t.status !== 'maintenance')
    .slice(0, 6)
  const convFamily = CONVERT_PARENT[tool.slug]
  const popularConversions = convFamily
    ? PAIRS.filter((p) => p.family === convFamily).slice(0, 10)
    : []

  return (
    <>
      <JsonLd data={appSchema} />
      <JsonLd data={breadcrumbs} />
      <SiteHeader />
      <main className="shell workbench tool-page">
        <CategoryNav active={tool.category} />
        <div className="workbench-main">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">All tools</Link>
            <span className="sep">›</span>
            <Link href={`/?cat=${encodeURIComponent(tool.category)}`}>{tool.category}</Link>
            <span className="sep">›</span>
            <span className="crumb-here">{tool.name}</span>
          </nav>

          <h1>{tool.name}</h1>
          <p className="lede">{tool.blurb}</p>

          <div className="tool-meta">
            <span className="pill accent">Runs on your device</span>
            <span className="pill">Free</span>
            <span className="pill">No sign-up</span>
          </div>

          <div className="tool-console">
            <div className="tool-console-head">
              <span className="hint">Runs in your browser</span>
            </div>
            <div className="tool-console-body">
              <ToolMount slug={tool.slug} />
            </div>
          </div>

          <p className="tool-foot-note">
            Designed to run in your browser. See the <Link href="/privacy/">privacy policy</Link>.
          </p>

          <ToolAbout tool={tool} />

          {popularConversions.length > 0 && (
            <section className="related">
              <h2 className="related-title">Popular conversions</h2>
              <div className="conv-links">
                {popularConversions.map((p) => (
                  <Link className="conv-chip" key={p.slug} href={`/convert/${p.slug}/`}>
                    {p.fromLabel} to {p.toLabel}
                  </Link>
                ))}
                <Link className="conv-chip parent" href="/convert/">
                  All conversions →
                </Link>
              </div>
            </section>
          )}

          {related.length > 0 && (
            <section className="related">
              <h2 className="related-title">More in {tool.category}</h2>
              <div className="deck-grid">
                {related.map((t) => (
                  <ToolCard key={t.slug} tool={t} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
