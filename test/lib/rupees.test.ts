import { describe, it, expect } from 'vitest'
import { rupeesInWords, formatIndian } from '@/lib/rupees'

// English vectors from the plan (docs/superpowers/plans/2026-10-07-niche-expansion.md, Task 12).
// Hindi 1–99 forms checked against en.wiktionary.org entries (each carries {{number box|hi|N}}).

function en(a: string, only = true) {
  const r = rupeesInWords(a, 'en', { only })
  if (!r.ok) throw new Error(r.error)
  return r.words
}
function hi(a: string, only = true) {
  const r = rupeesInWords(a, 'hi', { only })
  if (!r.ok) throw new Error(r.error)
  return r.words
}

describe('rupeesInWords — English', () => {
  it('plan vectors', () => {
    expect(en('0')).toBe('Zero Rupees Only')
    expect(en('1')).toBe('One Rupee Only')
    expect(en('99.5')).toBe('Ninety-Nine Rupees and Fifty Paise Only')
    expect(en('100000')).toBe('One Lakh Rupees Only')
    expect(en('123456789.05')).toBe(
      'Twelve Crore Thirty-Four Lakh Fifty-Six Thousand Seven Hundred Eighty-Nine Rupees and Five Paise Only',
    )
  })
  it('singular paisa, paise-only amounts, Only toggle', () => {
    expect(en('2.01')).toBe('Two Rupees and One Paisa Only')
    expect(en('0.75')).toBe('Seventy-Five Paise Only')
    expect(en('21', false)).toBe('Twenty-One Rupees')
  })
  it('continues as Crore multiples above 99 crore', () => {
    expect(en('1000000000')).toBe('One Hundred Crore Rupees Only')
    expect(en('9999999999999.99')).toBe(
      'Nine Lakh Ninety-Nine Thousand Nine Hundred Ninety-Nine Crore Ninety-Nine Lakh Ninety-Nine Thousand Nine Hundred Ninety-Nine Rupees and Ninety-Nine Paise Only',
    )
  })
  it('accepts commas, spaces and ₹', () => {
    expect(en('₹ 1,00,000')).toBe('One Lakh Rupees Only')
  })
  it('rejects bad input', () => {
    expect(rupeesInWords('1.234', 'en', { only: true }).ok).toBe(false)
    expect(rupeesInWords('-5', 'en', { only: true }).ok).toBe(false)
    expect(rupeesInWords('abc', 'en', { only: true }).ok).toBe(false)
    expect(rupeesInWords('', 'en', { only: true }).ok).toBe(false)
    expect(rupeesInWords('10000000000000', 'en', { only: true }).ok).toBe(false)
  })
})

describe('rupeesInWords — Hindi', () => {
  it('plan vector', () => {
    expect(hi('100000')).toBe('एक लाख रुपये मात्र')
  })
  it('irregular 1–99 forms', () => {
    expect(hi('21', false)).toBe('इक्कीस रुपये')
    expect(hi('99', false)).toBe('निन्यानवे रुपये')
    expect(hi('1', false)).toBe('एक रुपया')
  })
  it('crore/lakh/paise', () => {
    expect(hi('123456789.05')).toBe(
      'बारह करोड़ चौंतीस लाख छप्पन हज़ार सात सौ नवासी रुपये और पाँच पैसे मात्र',
    )
  })
})

describe('formatIndian', () => {
  it('groups digits the Indian way', () => {
    const r = rupeesInWords('123456789.05', 'en', { only: true })
    expect(r.ok && r.formatted).toBe('₹12,34,56,789.05')
    expect(formatIndian('1000')).toBe('1,000')
    expect(formatIndian('999')).toBe('999')
    expect(formatIndian('100000')).toBe('1,00,000')
  })
})
