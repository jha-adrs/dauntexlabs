import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBar from '@/components/StatusBar'
import Footer from '@/components/Footer'
import JsonLd from '@/components/JsonLd'
import ConvertWidget from '@/components/convert/ConvertWidget'
import ConvertImage from '@/components/convert/ConvertImage'
import {
  PAIRS,
  getPair,
  reverseSlug,
  formula,
  exampleText,
  tableRows,
  unitSymbols,
  imageMime,
  type Pair,
} from '@/lib/conversions'

const SITE = 'https://dauntexlabs.com'
type Params = { params: Promise<{ slug: string }> }

const PARENT: Record<Pair['family'], { slug: string; name: string }> = {
  unit: { slug: 'unit-converter', name: 'Unit Converter' },
  base: { slug: 'number-base-converter', name: 'Number Base Converter' },
  image: { slug: 'image-converter', name: 'Image Converter' },
}

const IMAGE_NOTE: Record<string, string> = {
  PNG: 'lossless quality and full transparency — best for logos, icons and screenshots',
  JPG: 'small lossy files with no transparency — best for photographs',
  WebP: 'modern format with small size, transparency and both lossy/lossless modes',
}

export function generateStaticParams() {
  return PAIRS.map((p) => ({ slug: p.slug }))
}
export const dynamicParams = false

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const pair = getPair(slug)
  if (!pair) return {}
  const path = `/convert/${pair.slug}/`
  const title = `${pair.fromLabel} to ${pair.toLabel}`
  const desc =
    pair.family === 'image'
      ? `Convert ${pair.fromLabel} images to ${pair.toLabel} free, right in your browser — no upload, no sign-up.`
      : `Convert ${pair.fromLabel.toLowerCase()} to ${pair.toLabel.toLowerCase()} instantly and free. ${exampleText(pair)} Works on your device — nothing uploaded.`
  return {
    title,
    description: desc,
    keywords: [
      `${pair.fromLabel.toLowerCase()} to ${pair.toLabel.toLowerCase()}`,
      `convert ${pair.fromLabel.toLowerCase()} to ${pair.toLabel.toLowerCase()}`,
      pair.category.toLowerCase(),
    ],
    alternates: { canonical: path },
    openGraph: { type: 'website', title: `${title} — dauntexlabs`, description: desc, url: path },
  }
}

export default async function ConvertPage({ params }: Params) {
  const { slug } = await params
  const pair = getPair(slug)
  if (!pair) notFound()

  const path = `${SITE}/convert/${pair.slug}/`
  const rev = reverseSlug(pair)
  const parent = PARENT[pair.family]
  const rows = tableRows(pair)
  const siblings = PAIRS.filter(
    (p) => p.family === pair.family && p.category === pair.category && p.slug !== pair.slug && p.slug !== rev,
  ).slice(0, 6)
  const sym = pair.family === 'unit' ? unitSymbols(pair) : { from: '', to: '' }

  const faq = [
    {
      q: `How do you convert ${pair.fromLabel.toLowerCase()} to ${pair.toLabel.toLowerCase()}?`,
      a:
        pair.family === 'image'
          ? `Upload your ${pair.fromLabel} image above and download it as ${pair.toLabel}. The image is decoded and re-encoded in your browser with the Canvas API — it is never sent to a server.`
          : `${formula(pair)}. Or just type a value above and the answer updates instantly. For example, ${exampleText(pair)}`,
    },
    {
      q: 'Is anything uploaded to a server?',
      a: 'No. The conversion runs entirely in your browser, so nothing you type or upload ever leaves your device.',
    },
  ]

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Convert', item: `${SITE}/convert/` },
      { '@type': 'ListItem', position: 3, name: `${pair.fromLabel} to ${pair.toLabel}`, item: path },
    ],
  }
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <JsonLd data={faqSchema} />
      <StatusBar />
      <main className="shell tool-page">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">◇ dauntexlabs</Link>
          <span className="sep">›</span>
          <Link href="/convert/">Convert</Link>
          <span className="sep">›</span>
          <span className="crumb-here">
            {pair.fromLabel} to {pair.toLabel}
          </span>
        </nav>

        <div className="tool-head">
          <span className="idx">CONVERT</span>
          <span className="cat">{pair.category}</span>
        </div>
        <h1>
          Convert {pair.fromLabel} to {pair.toLabel}
        </h1>
        <p className="lede">
          {pair.family === 'image'
            ? `Convert ${pair.fromLabel} images to ${pair.toLabel} in your browser — free, instant, and nothing is uploaded.`
            : `${exampleText(pair)} — convert any value instantly, on your device.`}
        </p>
        <div className="tool-meta">
          <span className="pill acid">◇ on-device</span>
          <span className="pill">free</span>
          <span className="pill">no sign-up</span>
        </div>

        <div className="tool-console">
          <div className="tool-console-head">
            <span className="lbl">
              {pair.fromLabel} → {pair.toLabel}
            </span>
            <span className="hint">◇ runs in your browser</span>
          </div>
          <div className="tool-console-body">
            {pair.family === 'image' ? (
              <ConvertImage mime={imageMime(pair.toKey)} />
            ) : (
              <ConvertWidget pair={pair} />
            )}
          </div>
        </div>

        {pair.family !== 'image' && (
          <>
            <section className="block">
              <div className="sec-head">
                <span className="code">01</span>
                <h2>How it works</h2>
                <span className="rule" />
              </div>
              <p className="conv-formula">{formula(pair)}</p>
            </section>

            <section className="block">
              <div className="sec-head">
                <span className="code">02</span>
                <h2>
                  {pair.fromLabel} to {pair.toLabel} table
                </h2>
                <span className="rule" />
              </div>
              <div className="conv-table" role="table">
                <div className="conv-table-h" role="row">
                  <span role="columnheader">
                    {pair.fromLabel}
                    {sym.from ? ` (${sym.from})` : ''}
                  </span>
                  <span role="columnheader">
                    {pair.toLabel}
                    {sym.to ? ` (${sym.to})` : ''}
                  </span>
                </div>
                {rows.map((r) => (
                  <div className="conv-table-r" role="row" key={r.in}>
                    <span role="cell">{r.in}</span>
                    <span role="cell">{r.out}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {pair.family === 'image' && (
          <section className="block">
            <div className="sec-head">
              <span className="code">01</span>
              <h2>
                {pair.fromLabel} vs {pair.toLabel}
              </h2>
              <span className="rule" />
            </div>
            <div className="prose">
              <p>
                <b>{pair.fromLabel}</b> is {IMAGE_NOTE[pair.fromLabel]}. <b>{pair.toLabel}</b> is{' '}
                {IMAGE_NOTE[pair.toLabel]}. Converting {pair.fromLabel} → {pair.toLabel} is a good
                choice when you want {pair.toLabel === 'JPG' ? 'smaller photo files' : pair.toLabel === 'WebP' ? 'the smallest modern format for the web' : 'lossless quality or transparency'}.
              </p>
            </div>
          </section>
        )}

        <section className="block">
          <div className="sec-head">
            <span className="code">{pair.family === 'image' ? '02' : '03'}</span>
            <h2>FAQ</h2>
            <span className="rule" />
          </div>
          {faq.map((f, i) => (
            <details className="faq" key={i} open={i === 0}>
              <summary>
                {f.q}
                <span className="plus">+</span>
              </summary>
              <div className="ans">{f.a}</div>
            </details>
          ))}
        </section>

        <section className="block">
          <div className="sec-head">
            <span className="code">{pair.family === 'image' ? '03' : '04'}</span>
            <h2>Related conversions</h2>
            <span className="rule" />
          </div>
          <div className="conv-links">
            <Link className="conv-chip rev" href={`/convert/${rev}/`}>
              ⇄ {pair.toLabel} to {pair.fromLabel}
            </Link>
            {siblings.map((s) => (
              <Link className="conv-chip" key={s.slug} href={`/convert/${s.slug}/`}>
                {s.fromLabel} to {s.toLabel}
              </Link>
            ))}
            <Link className="conv-chip parent" href={`/tools/${parent.slug}/`}>
              → {parent.name}
            </Link>
          </div>
        </section>

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
