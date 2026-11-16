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
    expect(sentences('crores-to-lakhs')).toContain('2.5 crore in lakh = 250 lakh')
    expect(sentences('lakhs-to-crores')).toContain('40 lakh in crore = 0.4 crore')
    expect(sentences('millions-to-crores')).toContain('1.5 million in crore = 0.15 crore')
  })

  it('uses the GSC-observed values (quick win #4)', () => {
    expect(workedExamples(p('crores-to-billions')).map((e) => e.in)).toEqual(['1', '2.5', '100', '250', '1000', '4000'])
    expect(workedExamples(p('lakhs-to-crores')).map((e) => e.in)).toEqual(['1', '2.5', '10', '25', '40', '100'])
    expect(workedExamples(p('millions-to-crores')).map((e) => e.in)).toEqual(['0.05', '0.5', '1.5', '10', '100', '3800'])
    expect(workedExamples(p('billions-to-crores')).map((e) => e.in)).toEqual(['1', '1.49', '2', '2.5', '3.8', '7.5'])
    expect(workedExamples(p('thousands-to-lakhs')).map((e) => e.in)).toEqual(['100', '1500', '5000', '10000', '50000'])
    expect(sentences('crores-to-billions')).toContain('4000 crore in billion = 40 billion')
  })

  it('every new trillion / lakh crore / arab pair has 1-6 examples', () => {
    const fresh = PAIRS.filter((x) => /trillion|lakh-crore|arab/.test(x.slug))
    expect(fresh).toHaveLength(32)
    for (const pair of fresh) {
      const n = workedExamples(pair).length
      expect(n, pair.slug).toBeGreaterThanOrEqual(1)
      expect(n, pair.slug).toBeLessThanOrEqual(6)
    }
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
    expect(sentences('crores-to-thousands')).toContain('4000 crore in thousand = 40,000,000 thousand')
    expect(sentences('lakhs-to-trillions')).toContain('1 lakh in trillion = 0.0000001 trillion')
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
