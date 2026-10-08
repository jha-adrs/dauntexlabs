import { describe, it, expect } from 'vitest'
import { validateAadhaar, verhoeffCheck, verhoeffValid } from '@/lib/verhoeff'

describe('verhoeff', () => {
  it('computes reference check digits', () => {
    expect(verhoeffCheck('236')).toBe(3)
    expect(verhoeffCheck('23412341234')).toBe(6) // plan said 9; independent impl + Wikipedia vector below agree on 6
    expect(verhoeffCheck('12345')).toBe(1)
  })
  it('validates numbers with their check digit', () => {
    expect(verhoeffValid('2363')).toBe(true)
    expect(verhoeffValid('2364')).toBe(false)
    expect(verhoeffValid('')).toBe(false)
    expect(verhoeffValid('12a3')).toBe(false)
  })
})

describe('validateAadhaar', () => {
  it('accepts a valid number with spaces and masks it', () => {
    expect(validateAadhaar('2341 2341 2346')).toEqual({ ok: true, masked: 'XXXX XXXX 2346' })
  })
  it('strips hyphens', () => {
    expect(validateAadhaar('2341-2341-2346').ok).toBe(true)
  })
  it('rejects a wrong check digit', () => {
    const r = validateAadhaar('234123412348')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/check digit/i)
  })
  it('rejects a number starting with 0 or 1', () => {
    expect(validateAadhaar('134123412349').ok).toBe(false)
    expect(validateAadhaar('034123412349').ok).toBe(false)
  })
  it('rejects 11 digits and non-digits', () => {
    const r = validateAadhaar('23412341234')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/12 digits/i)
    expect(validateAadhaar('2341 2341 234X').ok).toBe(false)
  })
})

describe('validateAadhaar check-digit error', () => {
  it('rejects 2341 2341 2349 (plan vector; correct check digit is 6)', () => {
    expect(validateAadhaar('234123412349').ok).toBe(false)
  })
})
