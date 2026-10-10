import { describe, it, expect } from 'vitest'
import { gstinCheckChar, validateGstin } from '@/lib/gstin'

describe('gstinCheckChar', () => {
  it('computes the mod-36 check character', () => {
    expect(gstinCheckChar('27AAPFU0939F1Z')).toBe('V')
    expect(gstinCheckChar('29AAACB2894G1Z')).toBe('J')
    expect(gstinCheckChar('33AAACH7409R1Z')).toBe('8')
    expect(gstinCheckChar('07AAACR5055K1Z')).toBe('9')
  })
})

describe('validateGstin', () => {
  it('accepts a valid Maharashtra firm GSTIN and extracts its parts', () => {
    expect(validateGstin('27AAPFU0939F1ZV')).toEqual({
      ok: true,
      gstin: '27AAPFU0939F1ZV',
      state: 'Maharashtra',
      stateCode: '27',
      pan: 'AAPFU0939F',
      entity: 'Firm',
      entityNo: '1',
    })
  })

  it('accepts Karnataka company and Tamil Nadu GSTINs', () => {
    const k = validateGstin('29AAACB2894G1ZJ')
    expect(k.ok && k.state).toBe('Karnataka')
    expect(k.ok && k.entity).toBe('Company')
    const t = validateGstin('33AAACH7409R1Z8')
    expect(t.ok && t.state).toBe('Tamil Nadu')
  })

  it('rejects a wrong check character and names the expected one', () => {
    const r = validateGstin('07AAACR5055K1Z8')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error).toMatch(/check character/i)
      expect(r.error).toContain('9')
    }
  })

  it('rejects a bad format (14th character not Z)', () => {
    const r = validateGstin('27AAPFU0939F1YV')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/format/i)
  })

  it('rejects an unknown state code', () => {
    const r = validateGstin('40AAPFU0939F1Z' + gstinCheckChar('40AAPFU0939F1Z'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/state/i)
  })

  it('trims and uppercases input', () => {
    const r = validateGstin('  27aapfu0939f1zv ')
    expect(r.ok).toBe(true)
    expect(r.gstin).toBe('27AAPFU0939F1ZV')
  })

  it('maps special codes 97 and 99', () => {
    const o = validateGstin('97AAPFU0939F1Z' + gstinCheckChar('97AAPFU0939F1Z'))
    expect(o.ok && o.state).toMatch(/other territory/i)
    const c = validateGstin('99AAPFU0939F1Z' + gstinCheckChar('99AAPFU0939F1Z'))
    expect(c.ok && c.state).toMatch(/centre jurisdiction/i)
  })

  it('rejects empty input without throwing', () => {
    expect(validateGstin('').ok).toBe(false)
  })

  it('accepts a TDS deductor GSTIN (TAN body, D in position 14)', () => {
    const g = '07DELA12345B1D' + gstinCheckChar('07DELA12345B1D')
    const r = validateGstin(g)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.pan).toBe('DELA12345B')
      expect(r.entity).toMatch(/TDS deductor/)
    }
  })

  it('accepts a TCS collector GSTIN (PAN body, C in position 14)', () => {
    const g = '29AAACB2894G1C' + gstinCheckChar('29AAACB2894G1C')
    const r = validateGstin(g)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.entity).toMatch(/TCS collector/)
  })

  it('rejects a PAN body with D in position 14', () => {
    const g = '27AAPFU0939F1D' + gstinCheckChar('27AAPFU0939F1D')
    expect(validateGstin(g).ok).toBe(false)
  })
})
