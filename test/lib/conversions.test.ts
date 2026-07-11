import { describe, it, expect } from 'vitest'
import {
  PAIRS,
  getPair,
  reverseSlug,
  convertUnit,
  convertBase,
  tableRows,
  formatNum,
} from '@/lib/conversions'

const p = (slug: string) => {
  const pair = getPair(slug)
  if (!pair) throw new Error(`missing pair ${slug}`)
  return pair
}

describe('conversions registry', () => {
  it('generates a healthy number of pages with unique slugs', () => {
    expect(PAIRS.length).toBeGreaterThan(150)
    expect(new Set(PAIRS.map((x) => x.slug)).size).toBe(PAIRS.length)
  })

  it('every pair has a valid reverse in the registry', () => {
    for (const pair of PAIRS) expect(getPair(reverseSlug(pair))).toBeTruthy()
  })
})

describe('unit conversions', () => {
  it('length: miles → kilometers', () => {
    expect(convertUnit(p('miles-to-kilometers'), 1)).toBeCloseTo(1.609344, 5)
  })
  it('mass: kilograms → pounds', () => {
    expect(convertUnit(p('kilograms-to-pounds'), 1)).toBeCloseTo(2.2046226, 4)
  })
  it('mass: pounds → kilograms (reverse round-trips)', () => {
    const lb = convertUnit(p('kilograms-to-pounds'), 5)
    expect(convertUnit(p('pounds-to-kilograms'), lb)).toBeCloseTo(5, 6)
  })
  it('temperature: celsius → fahrenheit', () => {
    expect(convertUnit(p('celsius-to-fahrenheit'), 100)).toBe(212)
    expect(convertUnit(p('celsius-to-fahrenheit'), 0)).toBe(32)
  })
  it('temperature: fahrenheit → celsius and celsius → kelvin', () => {
    expect(convertUnit(p('fahrenheit-to-celsius'), 32)).toBe(0)
    expect(convertUnit(p('celsius-to-kelvin'), 0)).toBeCloseTo(273.15, 2)
  })
  it('data: gigabytes → megabytes (binary)', () => {
    expect(convertUnit(p('gigabytes-to-megabytes'), 1)).toBe(1024)
  })
})

describe('number-base conversions', () => {
  it('binary → decimal', () => {
    expect(convertBase(p('binary-to-decimal'), '1010')).toBe('10')
  })
  it('decimal → hexadecimal', () => {
    expect(convertBase(p('decimal-to-hexadecimal'), '255')).toBe('ff')
  })
  it('hexadecimal → binary', () => {
    expect(convertBase(p('hexadecimal-to-binary'), 'ff')).toBe('11111111')
  })
  it('rejects digits outside the source base', () => {
    expect(() => convertBase(p('binary-to-decimal'), '2')).toThrow()
  })
})

describe('helpers', () => {
  it('tableRows produces rows for unit + base pairs', () => {
    expect(tableRows(p('kilograms-to-pounds')).length).toBeGreaterThan(0)
    expect(tableRows(p('binary-to-decimal'))[0]).toHaveProperty('out')
  })
  it('formatNum trims trailing zeros', () => {
    expect(formatNum(2.5)).toBe('2.5')
    expect(formatNum(100)).toBe('100')
  })
})
