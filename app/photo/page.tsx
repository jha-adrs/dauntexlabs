import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import Footer from '@/components/Footer'
import JsonLd from '@/components/JsonLd'
import { PHOTO_PRESETS } from '@/lib/photo-presets'

const SITE = 'https://dauntexlabs.com'
const TITLE = 'Photo and signature resizer for exam forms'
const DESCRIPTION =
  'Resize a photo or signature to the exact pixels and KB range an Indian exam or government form asks for — IBPS, SBI, SSC, RRB, UPSC, NEET, JEE, CUET, CTET, TNPSC, PAN, passport and visa — or to a plain file size.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/photo/' },
  openGraph: { type: 'website', title: `${TITLE} — dauntexlabs`, description: DESCRIPTION, url: '/photo/' },
}

export default function PhotoHub() {
  const groups = [
    { title: 'Resize to a file size', items: PHOTO_PRESETS.filter((p) => p.kind === 'size') },
    { title: 'Exam and form sizes', items: PHOTO_PRESETS.filter((p) => p.kind === 'exam') },
  ]
  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE}/photo/`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: PHOTO_PRESETS.length,
      itemListElement: PHOTO_PRESETS.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.title,
        url: `${SITE}/photo/${p.slug}/`,
      })),
    },
  }

  return (
    <>
      <JsonLd data={collection} />
      <SiteHeader />
      <main className="shell tool-page">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">All tools</Link>
          <span className="sep">›</span>
          <span className="crumb-here">Photo</span>
        </nav>

        <h1>{TITLE}</h1>
        <p className="lede">
          Pick your exam or the file size you need. Each page crops the photo to the exact pixels, finds a JPEG
          quality that lands inside the KB range and writes the DPI — designed to run in your browser, so the
          photo is processed on your device. Always confirm the sizes on the current official notice.
        </p>

        {groups.map((g) => (
          <section className="block" key={g.title}>
            <div className="sec-head">
              <h2>{g.title}</h2>
              <span className="count">{g.items.length}</span>
            </div>
            <div className="conv-links">
              {g.items.map((p) => (
                <Link className="conv-chip" key={p.slug} href={`/photo/${p.slug}/`}>
                  {p.title}
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="block">
          <div className="conv-links">
            <Link className="conv-chip parent" href="/tools/exam-photo-resizer/">
              Exam Photo &amp; Signature Resizer →
            </Link>
            <Link className="conv-chip parent" href="/category/india/">
              India tools →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
