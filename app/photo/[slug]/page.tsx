import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import Footer from '@/components/Footer'
import JsonLd from '@/components/JsonLd'
import PhotoFitterMount from '@/components/photo/PhotoFitterMount'
import { PHOTO_PRESETS, getPreset, specRow } from '@/lib/photo-presets'
import { formatDateIN } from '@/lib/stamp'

const SITE = 'https://dauntexlabs.com'
type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return PHOTO_PRESETS.map((p) => ({ slug: p.slug }))
}
export const dynamicParams = false

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const p = getPreset(slug)
  if (!p) return {}
  const path = `/photo/${p.slug}/`
  return {
    title: p.title,
    description: p.description,
    keywords: p.keywords,
    alternates: { canonical: path },
    openGraph: { type: 'website', title: `${p.title} — dauntexlabs`, description: p.description, url: path },
  }
}

export default async function PhotoPage({ params }: Params) {
  const { slug } = await params
  const p = getPreset(slug)
  if (!p) notFound()

  const path = `${SITE}/photo/${p.slug}/`
  const siblings = PHOTO_PRESETS.filter((x) => x.kind === p.kind && x.slug !== p.slug).slice(0, 6)

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Photo', item: `${SITE}/photo/` },
      { '@type': 'ListItem', position: 3, name: p.title, item: path },
    ],
  }
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: p.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <JsonLd data={faqSchema} />
      <SiteHeader />
      <main className="shell tool-page">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">All tools</Link>
          <span className="sep">›</span>
          <Link href="/photo/">Photo</Link>
          <span className="sep">›</span>
          <span className="crumb-here">{p.title}</span>
        </nav>

        <div className="tool-head">
          <span className="cat">India</span>
        </div>
        <h1>{p.title}</h1>
        <p className="lede">{p.description}</p>
        <div className="tool-meta">
          <span className="pill accent">Runs on your device</span>
          <span className="pill">Free</span>
          <span className="pill">No sign-up</span>
        </div>

        <div className="tool-console">
          <div className="tool-console-head">
            <span className="lbl">Photo and signature resizer</span>
            <span className="hint">Runs in your browser</span>
          </div>
          <div className="tool-console-body">
            <PhotoFitterMount preset={p.slug} />
          </div>
        </div>

        {p.kind === 'exam' && p.source && (
          <section className="block">
            <div className="sec-head">
              <h2>Upload specs</h2>
            </div>
            <div className="conv-table" role="table">
              <div className="conv-table-h" role="row">
                <span role="columnheader">Upload</span>
                <span role="columnheader">Pixels</span>
                <span role="columnheader">File size</span>
                <span role="columnheader">DPI</span>
              </div>
              {p.uploads.map((u, i) => {
                const r = specRow(u)
                return (
                  <div className="conv-table-r" role="row" key={i}>
                    <span role="cell">{r.upload}</span>
                    <span role="cell">{r.pixels}</span>
                    <span role="cell">{r.size}</span>
                    <span role="cell">{r.dpi}</span>
                  </div>
                )
              })}
            </div>
            <p style={{ color: 'var(--mute)', marginTop: 10 }}>
              Checked against:{' '}
              <a href={p.source.url} rel="nofollow noopener noreferrer" target="_blank">
                {p.source.notice}
              </a>
              , {formatDateIN(p.source.checked)}. Confirm on the official notice before you submit.
            </p>
          </section>
        )}

        <section className="block">
          <div className="sec-head">
            <h2>About</h2>
          </div>
          <div className="prose">
            {p.intro.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </div>
        </section>

        <section className="block">
          <div className="sec-head">
            <h2>FAQ</h2>
          </div>
          {p.faq.map((f, i) => (
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
            <h2>Related sizes</h2>
          </div>
          <div className="conv-links">
            {siblings.map((s) => (
              <Link className="conv-chip" key={s.slug} href={`/photo/${s.slug}/`}>
                {s.title}
              </Link>
            ))}
            <Link className="conv-chip parent" href="/photo/">
              All photo sizes →
            </Link>
            <Link className="conv-chip parent" href="/tools/exam-photo-resizer/">
              Exam Photo &amp; Signature Resizer →
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
