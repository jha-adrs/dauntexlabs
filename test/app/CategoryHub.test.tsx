import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HubPage, { generateMetadata, generateStaticParams } from '@/app/category/[slug]/page'
import { tools } from '@/lib/tools'

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

describe('category hub page', () => {
  it('pre-renders india and aviation', () => {
    expect(generateStaticParams()).toEqual([{ slug: 'india' }, { slug: 'aviation' }])
  })

  it('has a canonical and title', async () => {
    const m = await generateMetadata(params('india'))
    expect(m.alternates?.canonical).toBe('/category/india/')
    expect(String(m.title)).toMatch(/India/)
  })

  it('lists every live tool in the category with ItemList and FAQPage JSON-LD', async () => {
    const { container } = render(await HubPage(params('aviation')))
    const live = tools.filter((t) => t.category === 'Aviation' && t.status !== 'maintenance')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/aviation/i)
    for (const t of live) {
      expect(container.querySelector(`a[href^="/tools/${t.slug}"]`)).not.toBeNull()
    }
    const lds = [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) =>
      JSON.parse(s.textContent!),
    )
    const list = lds.find((l) => l['@type'] === 'CollectionPage')
    expect(list.mainEntity['@type']).toBe('ItemList')
    expect(list.mainEntity.itemListElement).toHaveLength(live.length)
    expect(lds.find((l) => l['@type'] === 'FAQPage')).toBeTruthy()
    expect(container.querySelectorAll('details.faq').length).toBeGreaterThanOrEqual(3)
  })
})
