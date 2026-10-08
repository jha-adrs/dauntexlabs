import { describe, it, expect } from 'vitest'
import { HUBS, hubForCategory, hubHref, categoryHref } from '@/lib/hubs'
import sitemap from '@/app/sitemap'

const ABSOLUTE = /never (upload|leave|sent)|nothing (is |ever )?(uploaded|leaves)|no uploads?\b|no telemetry|ever leaves|runs entirely/i
const words = (s: string) => s.split(/\s+/).filter(Boolean).length

describe('HUBS', () => {
  it('has exactly the India and Aviation hubs', () => {
    expect(HUBS.map((h) => h.slug)).toEqual(['india', 'aviation'])
  })
  it.each(HUBS)('$slug has a 150–300 word intro, 3–5 FAQs and hedged wording', (h) => {
    const n = words(h.intro.join(' '))
    expect(n).toBeGreaterThanOrEqual(150)
    expect(n).toBeLessThanOrEqual(300)
    expect(h.faq.length).toBeGreaterThanOrEqual(3)
    expect(h.faq.length).toBeLessThanOrEqual(5)
    const all = [h.title, h.description, ...h.intro, ...h.faq.flatMap((f) => [f.q, f.a])].join(' ')
    expect(all).not.toMatch(ABSOLUTE)
  })
  it('maps categories to hub links, others to the homepage filter', () => {
    expect(hubForCategory('India')?.slug).toBe('india')
    expect(hubForCategory('Utilities')).toBeUndefined()
    expect(hubHref(HUBS[1])).toBe('/category/aviation/')
    expect(categoryHref('India')).toBe('/category/india/')
    expect(categoryHref('Aviation')).toBe('/category/aviation/')
    expect(categoryHref('Web & CSS')).toBe('/?cat=Web%20%26%20CSS')
  })
  it('hub pages are in the sitemap', () => {
    const urls = sitemap().map((e) => e.url)
    expect(urls).toContain('https://dauntexlabs.com/category/india/')
    expect(urls).toContain('https://dauntexlabs.com/category/aviation/')
  })
})
