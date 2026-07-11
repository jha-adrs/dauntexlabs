import type { Metadata } from 'next'
import Link from 'next/link'
import StatusBar from '@/components/StatusBar'
import Footer from '@/components/Footer'
import JsonLd from '@/components/JsonLd'
import { PAIRS } from '@/lib/conversions'

const SITE = 'https://dauntexlabs.com'

export const metadata: Metadata = {
  title: 'Conversions — units, number bases & image formats',
  description:
    'Free, instant conversion tools for units, number bases and image formats — kg to lbs, miles to km, binary to decimal, png to jpg and more. Everything runs in your browser.',
  alternates: { canonical: '/convert/' },
}

export default function ConvertHub() {
  const cats = Array.from(new Set(PAIRS.map((p) => p.category)))
  const code = (fam: string) => (fam === 'unit' ? 'UNIT' : fam === 'base' ? 'BASE' : 'IMG')

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'dauntexlabs conversions',
    numberOfItems: PAIRS.length,
    itemListElement: PAIRS.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${p.fromLabel} to ${p.toLabel}`,
      url: `${SITE}/convert/${p.slug}/`,
    })),
  }

  return (
    <>
      <JsonLd data={itemList} />
      <StatusBar />
      <main className="shell tool-page">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">◇ dauntexlabs</Link>
          <span className="sep">›</span>
          <span className="crumb-here">Convert</span>
        </nav>

        <h1>Conversions</h1>
        <p className="lede">
          {PAIRS.length} instant, free converters — units, number bases and image formats, all
          processed on your device.
        </p>

        {cats.map((cat) => {
          const items = PAIRS.filter((p) => p.category === cat)
          return (
            <section className="block" key={cat}>
              <div className="sec-head">
                <span className="code">{code(items[0].family)}</span>
                <h2>{cat}</h2>
                <span className="rule" />
                <span className="count">{items.length}</span>
              </div>
              <div className="conv-links">
                {items.map((p) => (
                  <Link className="conv-chip" key={p.slug} href={`/convert/${p.slug}/`}>
                    {p.fromLabel} to {p.toLabel}
                  </Link>
                ))}
              </div>
            </section>
          )
        })}

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
