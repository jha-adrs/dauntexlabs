import { describe, it, expect } from 'vitest'
import { PAIRS, getPair, isIndexedPair } from '@/lib/conversions'
import sitemap from '@/app/sitemap'

const p = (slug: string) => {
  const pair = getPair(slug)
  if (!pair) throw new Error(`missing pair ${slug}`)
  return pair
}

describe('isIndexedPair', () => {
  it('noindexes commodity unit pairs', () => {
    expect(isIndexedPair(p('kilometers-to-miles'))).toBe(false)
    expect(isIndexedPair(p('grams-to-pounds'))).toBe(false)
  })
  it('keeps nautical-mile and knot pairs indexed', () => {
    expect(isIndexedPair(p('knots-to-kilometers-per-hour'))).toBe(true)
    expect(isIndexedPair(p('meters-to-nautical-miles'))).toBe(true)
  })
  it('keeps number-base and image pairs indexed', () => {
    expect(isIndexedPair(p('png-to-jpg'))).toBe(true)
    const base = PAIRS.find((x) => x.family === 'base')!
    expect(isIndexedPair(base)).toBe(true)
  })
  it('noindexes exactly the 220 plain unit pairs', () => {
    const plain = PAIRS.filter((x) => x.family === 'unit' && x.category !== 'Number scale')
    expect(plain.filter((x) => !isIndexedPair(x))).toHaveLength(220)
  })
})

describe('sitemap', () => {
  const urls = sitemap().map((e) => e.url)
  it('omits noindexed convert pages', () => {
    expect(urls).not.toContain('https://dauntexlabs.com/convert/kilometers-to-miles/')
  })
  it('keeps indexed convert pages', () => {
    expect(urls).toContain('https://dauntexlabs.com/convert/knots-to-kilometers-per-hour/')
  })
  it('lists exactly the indexed pairs', () => {
    const convert = urls.filter((u) => /\/convert\/[^/]+\/$/.test(u))
    expect(convert).toHaveLength(PAIRS.filter(isIndexedPair).length)
  })
})
