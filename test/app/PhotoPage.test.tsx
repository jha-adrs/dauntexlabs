import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/photo/PhotoFitterMount', () => ({
  default: ({ preset }: { preset: string }) => <div data-testid="fitter">{preset}</div>,
}))

import PhotoPage, { generateMetadata, generateStaticParams } from '@/app/photo/[slug]/page'
import PhotoHub, { metadata as hubMeta } from '@/app/photo/page'
import { PHOTO_PRESETS, getPreset } from '@/lib/photo-presets'

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })
const lds = (c: HTMLElement) => [...c.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!))

describe('/photo/[slug]', () => {
  it('pre-renders every preset', () => {
    expect(generateStaticParams()).toHaveLength(PHOTO_PRESETS.length)
  })
  it('bakes title and canonical', async () => {
    const m = await generateMetadata(params('ibps-photo-signature-size'))
    expect(m.title).toBe(getPreset('ibps-photo-signature-size')!.title)
    expect(m.alternates?.canonical).toBe('/photo/ibps-photo-signature-size/')
  })
  it('exam page: fitter, spec table, checked line, FAQ JSON-LD', async () => {
    const p = getPreset('ibps-photo-signature-size')!
    const { container } = render(await PhotoPage(params(p.slug)))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(p.title)
    expect(screen.getByTestId('fitter')).toHaveTextContent(p.slug)
    expect(screen.getAllByRole('row')).toHaveLength(p.uploads.length + 1)
    expect(screen.getByText('200 × 230 px')).toBeInTheDocument()
    expect(container.textContent).toMatch(/Checked against: .*09\/10\/2026\. Confirm on the official notice before you submit\./)
    // nwsapi cannot match this URL inside an attribute selector, so compare attributes directly.
    expect([...container.querySelectorAll('a')].some((a) => a.getAttribute('href') === p.source!.url)).toBe(true)
    const faq = lds(container).find((l) => l['@type'] === 'FAQPage')
    expect(faq.mainEntity).toHaveLength(p.faq.length)
    expect(lds(container).find((l) => l['@type'] === 'BreadcrumbList')).toBeTruthy()
  })
  it('size page has no spec table or checked line', async () => {
    const { container } = render(await PhotoPage(params('resize-image-to-20kb')))
    expect(container.textContent).not.toMatch(/Checked against/)
    expect(screen.queryAllByRole('row')).toHaveLength(0)
  })
})

describe('/photo/ hub', () => {
  it('links every preset with an ItemList', () => {
    expect(hubMeta.alternates?.canonical).toBe('/photo/')
    const { container } = render(<PhotoHub />)
    // next/link drops the trailing slash under Vitest (trailingSlash is a build-time option).
    for (const p of PHOTO_PRESETS) expect(container.querySelector(`a[href^="/photo/${p.slug}"]`)).not.toBeNull()
    const col = lds(container).find((l) => l['@type'] === 'CollectionPage')
    expect(col.mainEntity.itemListElement).toHaveLength(PHOTO_PRESETS.length)
  })
})
