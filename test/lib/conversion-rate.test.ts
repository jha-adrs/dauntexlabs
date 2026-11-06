import { describe, it, expect } from 'vitest'
import { conversionRate, visitsNeeded, conversionsNeeded, revenue, formatMoney } from '@/lib/conversion-rate'

describe('conversion-rate', () => {
  it('rate', () => {
    expect(conversionRate(25, 500)).toEqual({ ok: true, value: 5 })
    expect(conversionRate(NaN, 500)).toEqual({ ok: false, error: 'Enter valid numbers for conversions and visits.' })
    expect(conversionRate(10, 0)).toEqual({ ok: false, error: 'Visits must be greater than zero.' })
    expect(conversionRate(-1, 5)).toEqual({ ok: false, error: 'Conversions cannot be negative.' })
    expect(conversionRate(600, 500)).toEqual({ ok: false, error: 'Conversions cannot exceed total visits.' })
  })
  it('visits needed rounds up and ignores float noise', () => {
    expect(visitsNeeded(50, 2.5)).toEqual({ ok: true, value: 2000 })
    expect(visitsNeeded(10, 3)).toEqual({ ok: true, value: 334 })
    expect(visitsNeeded(50, 0)).toEqual({ ok: false, error: 'Conversion rate must be greater than 0% and at most 100%.' })
    expect(visitsNeeded(50, 101).ok).toBe(false)
    expect(visitsNeeded(-5, 2)).toEqual({ ok: false, error: 'Values cannot be negative.' })
    expect(visitsNeeded(NaN, 2).ok).toBe(false)
  })
  it('conversions needed rounds up', () => {
    expect(conversionsNeeded(2000, 2.5)).toEqual({ ok: true, value: 50 })
    expect(conversionsNeeded(1000, 3)).toEqual({ ok: true, value: 30 })
    expect(conversionsNeeded(1000, 3.33)).toEqual({ ok: true, value: 34 })
    expect(conversionsNeeded(-1, 3)).toEqual({ ok: false, error: 'Values cannot be negative.' })
  })
  it('revenue and revenue per visitor', () => expect(revenue(25, 500, 40)).toEqual({ revenue: 1000, perVisitor: 2 }))
  it('formats money per currency', () => {
    expect(formatMoney(1000, 'USD')).toBe('$1,000.00')
    expect(formatMoney(1000, 'EUR')).toBe('€1,000.00')
    expect(formatMoney(1000, 'GBP')).toBe('£1,000.00')
    expect(formatMoney(100000, 'INR')).toBe('₹1,00,000.00')
  })
})
