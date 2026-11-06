import { describe, it, expect } from 'vitest'
import { PAIRS, getPair, workedExamples, isIndexedPair, convertUnit, formatNum } from '@/lib/conversions'

const p = (slug: string) => {
  const pair = getPair(slug)
  if (!pair) throw new Error(`missing pair ${slug}`)
  return pair
}
const sentences = (slug: string) => workedExamples(p(slug)).map((e) => e.text)

describe('workedExamples', () => {
  it('answers "1.49 billion in million" in query wording', () => {
    expect(sentences('billions-to-millions')).toContain('1.49 billion in million = 1490 million')
  })

  it('covers lakh/crore round values both ways', () => {
    expect(sentences('crores-to-lakhs')).toContain('1.5 crore in lakh = 150 lakh')
    expect(sentences('lakhs-to-crores')).toContain('50 lakh in crore = 0.5 crore')
    expect(sentences('millions-to-crores')).toContain('1 million in crore = 0.1 crore')
  })

  it('answers "100 nautical miles in km" with the unit symbol on the result', () => {
    expect(sentences('nautical-miles-to-kilometers')).toContain(
      '100 nautical miles in kilometers = 185.2 km',
    )
  })

  it('covers knots and yards-to-nautical-miles queries', () => {
    expect(sentences('knots-to-kilometers-per-hour')).toContain(
      '30 knots in kilometers per hour = 55.56 km/h',
    )
    expect(sentences('yards-to-nautical-miles')).toContain('2000 yards in nautical miles = 0.987473 nmi')
  })

  it('answers "128 oz in gallons"', () => {
    expect(sentences('fluid-ounces-to-gallons')).toContain('128 fluid ounces in gallons = 1 gal')
  })

  it('values are computed with convertUnit, not hand-written', () => {
    const pair = p('billions-to-crores')
    for (const e of workedExamples(pair)) expect(e.out).toBe(formatNum(convertUnit(pair, Number(e.in))))
  })

  it('never prints scientific notation', () => {
    for (const pair of PAIRS)
      for (const e of workedExamples(pair)) expect(e.text, pair.slug).not.toMatch(/e[+-]\d/)
    expect(sentences('nautical-miles-to-millimeters')).toContain(
      '10 nautical miles in millimeters = 18,520,000 mm',
    )
    expect(sentences('billions-to-thousands')).toContain('10 billion in thousand = 10,000,000 thousand')
  })

  it('pluralises unit symbols that are plain words', () => {
    expect(sentences('gallons-to-cups')).toContain('10 gallons in cups = 160 cups')
    expect(sentences('fluid-ounces-to-cups')).toContain('8 fluid ounces in cups = 1 cup')
    for (const pair of PAIRS)
      for (const e of workedExamples(pair))
        if (e.out !== '1') expect(e.text, pair.slug).not.toMatch(/ cup$/)
  })

  it('stays modest: at most 6 examples per page', () => {
    for (const pair of PAIRS) expect(workedExamples(pair).length).toBeLessThanOrEqual(6)
  })

  it('is empty for base, image and commodity pairs', () => {
    expect(workedExamples(p('decimal-to-binary'))).toEqual([])
    expect(workedExamples(p('png-to-jpg'))).toEqual([])
    expect(workedExamples(p('kilograms-to-pounds'))).toEqual([])
    expect(workedExamples(p('kilometers-to-miles'))).toEqual([])
  })

  it('every indexed pair from a number-scale, nautical or knot unit has examples', () => {
    const niche = /^(Number scale:|Length:nmi$|Speed:knot$|Length:(km|mi|yd)$)/
    const want = PAIRS.filter((x) => x.family === 'unit' && isIndexedPair(x) && niche.test(x.fromKey))
    expect(want.length).toBeGreaterThan(20)
    for (const pair of want) expect(workedExamples(pair).length, pair.slug).toBeGreaterThan(0)
  })
})
