import { describe, it, expect } from 'vitest'
import { parseAmount, formatInternational, inScale, describeAmount } from '@/lib/indian-number'
import { tools } from '@/lib/tools'
import content from '@/lib/tool-content/indian-number-format'

function ok(text: string) {
  const r = parseAmount(text)
  if (!r || !r.ok) throw new Error(`expected ${text} to parse`)
  return describeAmount(r.value)
}
function scale(d: ReturnType<typeof describeAmount>, unit: string) {
  return [...d.indianScale, ...d.internationalScale].find((s) => s.unit === unit)?.text
}

describe('parseAmount', () => {
  it('returns null for empty input', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('   ')).toBeNull()
  })

  it('reads plain digits and phrases into exact hundredths', () => {
    const v = (t: string) => {
      const r = parseAmount(t)
      return r && r.ok ? r.value : undefined
    }
    expect(v('12345678')).toBe(1234567800n)
    expect(v('2.5 crore')).toBe(2500000000n)
    expect(v('50k crore')).toBe(v('50 thousand crore'))
    expect(v('1 lakh crore')).toBe(10n ** 14n)
  })

  it('accepts unit aliases and commas in either style', () => {
    const v = (t: string) => {
      const r = parseAmount(t)
      return r && r.ok ? r.value : undefined
    }
    const lakh = v('1 lakh')
    for (const t of ['1 lac', '1 lacs', '1 lakhs', '1lakh', '1,00,000', '100,000']) expect(v(t)).toBe(lakh)
    expect(v('2.5cr')).toBe(v('2.5 crores'))
    expect(v('2.5 cr')).toBe(v('2.5 crore'))
    expect(v('3 mn')).toBe(v('3 million'))
    expect(v('3 bn')).toBe(v('3 billion'))
    expect(v('5k')).toBe(v('5 thousand'))
  })

  it('rejects junk, negatives, too many decimals and values above 10^18', () => {
    for (const t of ['abc', '-5', '1e5', '5 apples', '0.001', '10000000000000000001', '1001 billion billion']) {
      const r = parseAmount(t)
      expect(r && r.ok).toBe(false)
    }
    const max = parseAmount('1000000000000000000')
    expect(max && max.ok).toBe(true)
  })
})

describe('parseAmount — query-shaped input', () => {
  const v = (t: string) => {
    const r = parseAmount(t)
    return r && r.ok ? r.value : undefined
  }
  it('strips currency, filler words, "in X" tails and trailing dots', () => {
    const five = v('5 crore')
    expect(five).toBe(5000000000n)
    for (const t of ['5 crore in million', '5 crore views in million', '5 crore rupees', '₹5 crore', 'Rs 5 crore', 'rs. 5 crore', '5 crores.', '5 crore to billion', '5 crore into lakh', '5 crore inr'])
      expect(v(t), t).toBe(five)
    expect(v('2.5 Cr.')).toBe(v('2.5 crore'))
    expect(v('2.5cr in million')).toBe(v('2.5 crore'))
    expect(v('50k crore in billion')).toBe(v('50 thousand crore'))
  })

  it('rejects input longer than 60 characters', () => {
    const r = parseAmount('1'.repeat(61))
    expect(r && r.ok).toBe(false)
  })

  it('returns quickly on pathological input', () => {
    const t0 = performance.now()
    const r = parseAmount('9'.repeat(50000) + '!')
    expect(performance.now() - t0).toBeLessThan(100)
    expect(r && r.ok).toBe(false)
  })
})

describe('formatInternational', () => {
  it('groups digits in threes', () => {
    expect(formatInternational('10000000')).toBe('10,000,000')
    expect(formatInternational('123')).toBe('123')
    expect(formatInternational('0001234')).toBe('1,234')
  })
})

describe('inScale', () => {
  it('divides exactly by powers of ten, never in e-notation', () => {
    expect(inScale(123456789n * 100n, 'crore')).toBe('12.3456789')
    expect(inScale(100000n * 100n, 'trillion')).toBe('0.0000001')
    expect(inScale(10000000n * 100n, 'crore')).toBe('1')
  })
})

describe('describeAmount — spec acceptance', () => {
  it('10000000', () => {
    const d = ok('10000000')
    expect(d.indian).toBe('1,00,00,000')
    expect(d.international).toBe('10,000,000')
    expect(scale(d, 'crore')).toBe('1 crore')
    expect(scale(d, 'million')).toBe('10 million')
    expect(d.zeros).toBe(7)
    expect(d.digits).toBe(8)
    expect(d.wordsIndian).toBe('One Crore')
    expect(d.wordsInternational).toBe('Ten Million')
  })

  it('2.5 crore', () => {
    const d = ok('2.5 crore')
    expect(d.indian).toBe('2,50,00,000')
    expect(d.international).toBe('25,000,000')
    expect(scale(d, 'lakh')).toBe('250 lakh')
    expect(scale(d, 'million')).toBe('25 million')
  })

  it('1.5 lakh', () => {
    const d = ok('1.5 lakh')
    expect(d.indian).toBe('1,50,000')
    expect(d.international).toBe('150,000')
    expect(scale(d, 'million')).toBe('0.15 million')
    expect(scale(d, 'thousand')).toBe('150 thousand')
  })

  it('50 thousand crore and 50k crore', () => {
    for (const t of ['50 thousand crore', '50k crore']) {
      const d = ok(t)
      expect(d.indian).toBe('5,00,00,00,00,000')
      expect(d.international).toBe('500,000,000,000')
      expect(scale(d, 'billion')).toBe('500 billion')
      expect(scale(d, 'lakh crore')).toBe('0.5 lakh crore')
    }
  })

  it('1 lakh crore', () => {
    const d = ok('1 lakh crore')
    expect(d.indian).toBe('10,00,00,00,00,000')
    expect(d.international).toBe('1,000,000,000,000')
    expect(scale(d, 'trillion')).toBe('1 trillion')
  })

  it('123456789', () => {
    const d = ok('123456789')
    expect(d.indian).toBe('12,34,56,789')
    expect(d.international).toBe('123,456,789')
    expect(scale(d, 'crore')).toBe('12.3456789 crore')
    expect(scale(d, 'million')).toBe('123.456789 million')
  })

  it('3.8 billion and 0.05 million', () => {
    expect(scale(ok('3.8 billion'), 'crore')).toBe('380 crore')
    const d = ok('0.05 million')
    expect(d.indian).toBe('50,000')
    expect(scale(d, 'lakh')).toBe('0.5 lakh')
  })

  it('keeps up to two decimals in digits and words', () => {
    const d = ok('1.5')
    expect(d.indian).toBe('1.5')
    expect(d.wordsIndian).toBe('One Point Five')
    expect(ok('0').wordsIndian).toBe('Zero')
  })

  it('spells 10^18 without losing precision', () => {
    const d = ok('1000000000000000000')
    expect(d.wordsInternational).toBe('One Quintillion')
    expect(d.wordsIndian).toBe('—')
    const e = ok('999999999999999999')
    expect(e.wordsInternational.startsWith('Nine Hundred Ninety-Nine Quadrillion')).toBe(true)
    expect(e.wordsIndian).toBe('—')
    expect(ok('999999999999999').wordsIndian.endsWith('Nine Hundred Ninety-Nine')).toBe(true)
  })
})

describe('describeAmount — display rules', () => {
  it('hides scale rows below 0.001 of the unit', () => {
    const d = ok('1.5 lakh')
    expect(scale(d, 'lakh crore')).toBeUndefined()
    expect(scale(d, 'trillion')).toBeUndefined()
    expect(scale(d, 'billion')).toBeUndefined() // 0.00015
    expect(scale(d, 'crore')).toBe('0.015 crore')
    expect(scale(ok('50k crore'), 'lakh crore')).toBe('0.5 lakh crore')
  })

  it('leaves zeros/digits undefined when there is a fractional part', () => {
    expect(ok('1.5').zeros).toBeUndefined()
    expect(ok('1.5').digits).toBeUndefined()
  })
})

describe('registry and content', () => {
  it('blurb is at most 155 characters', () => {
    const t = tools.find((x) => x.slug === 'indian-number-format')
    expect(t).toBeDefined()
    expect(t!.blurb.length).toBeLessThanOrEqual(155)
  })
  it('has a worked-examples FAQ', () => {
    const a = content.faq.map((f) => f.a).join(' ')
    for (const s of ['0.05 million', '0.01 crore', '500 billion', '50 million']) expect(a).toContain(s)
  })
})
