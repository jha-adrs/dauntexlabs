import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import ToolCard from '@/components/ToolCard'
import JsonLd from '@/components/JsonLd'
import { HUBS, hubHref } from '@/lib/hubs'
import { tools } from '@/lib/tools'

const SITE = 'https://dauntexlabs.com'

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return HUBS.map((h) => ({ slug: h.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const hub = HUBS.find((h) => h.slug === slug)
  if (!hub) return {}
  return {
    title: hub.title,
    description: hub.description,
    alternates: { canonical: hubHref(hub) },
    openGraph: { type: 'website', title: `${hub.title} — dauntexlabs`, description: hub.description, url: hubHref(hub) },
  }
}

// Category hub: intro + every tool in the cluster + FAQ, all server-rendered.
export default async function HubPage({ params }: Params) {
  const { slug } = await params
  const hub = HUBS.find((h) => h.slug === slug)
  if (!hub) notFound()

  const list = tools.filter((t) => t.category === hub.category && t.status !== 'maintenance')
  const url = `${SITE}${hubHref(hub)}`
  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: hub.title,
    description: hub.description,
    url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: list.length,
      itemListElement: list.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: t.name,
        url: `${SITE}/tools/${t.slug}/`,
      })),
    },
  }
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: hub.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }

  return (
    <>
      <JsonLd data={collection} />
      <JsonLd data={faqSchema} />
      <SiteHeader />
      <main className="shell workbench tool-page">
        <CategoryNav active={hub.category} />
        <div className="workbench-main">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">All tools</Link>
            <span className="sep">›</span>
            <span className="crumb-here">{hub.category}</span>
          </nav>
          <h1>{hub.title}</h1>
          <div className="tool-about hub-intro">
            {hub.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <section className="related">
            <h2 className="related-title">{list.length} tools</h2>
            <div className="deck-grid">
              {list.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          </section>

          <section className="tool-about">
            <h2>FAQ</h2>
            {hub.faq.map((f, i) => (
              <details className="faq" key={i} open={i === 0}>
                <summary>
                  {f.q}
                  <span className="plus">+</span>
                </summary>
                <div className="ans">{f.a}</div>
              </details>
            ))}
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
