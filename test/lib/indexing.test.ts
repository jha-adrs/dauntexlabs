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

describe('Number scale (lakh / crore) pages', () => {
  it('converts crore and lakh to millions', async () => {
    const { convertUnit } = await import('@/lib/conversions')
    expect(convertUnit(p('crores-to-millions'), 1)).toBeCloseTo(10)
    expect(convertUnit(p('lakhs-to-millions'), 10)).toBeCloseTo(1)
    expect(convertUnit(p('billions-to-crores'), 1)).toBeCloseTo(100)
  })
  it('are indexed', () => {
    expect(isIndexedPair(p('crores-to-millions'))).toBe(true)
  })
})

describe('JFIF pages', () => {
  it('exist for JFIF → JPG / PNG / WebP', () => {
    expect(getPair('jfif-to-jpg')).toBeDefined()
    expect(getPair('jfif-to-png')).toBeDefined()
    expect(getPair('jfif-to-webp')).toBeDefined()
  })
  it('never offer JFIF as an output', () => {
    expect(PAIRS.filter((x) => x.toLabel === 'JFIF')).toEqual([])
  })
})
