import { describe, it, expect } from 'vitest'
import { typeKeys, INSCRIPT, CHART } from '@/lib/hindi-keyboard'

describe('typeKeys — InScript', () => {
  it.each([
    ['k', 'क'],
    ['kd', 'क्'],
    ['ke', 'का'],
    ['kf', 'कि'],
    ['kdk', 'क्क'],
    ['jhl', 'रपत'],
  ])('%s → %s', (keys, out) => {
    expect(typeKeys(keys, 'inscript')).toBe(out)
  })

  it('maps shifted keys and the conjunct shortcuts', () => {
    expect(typeKeys('K', 'inscript')).toBe('ख')
    expect(typeKeys('&', 'inscript')).toBe('क्ष')
    expect(typeKeys('>', 'inscript')).toBe('।')
  })

  it('passes spaces, newlines and unmapped keys through', () => {
    expect(typeKeys('k k\n1', 'inscript')).toBe('क क\n1')
  })

  it('has a mapping for every letter key', () => {
    for (const c of 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      expect(INSCRIPT[c], c).toBeTruthy()
    }
  })
})

describe('typeKeys — Remington (Gail)', () => {
  it.each([
    ['Hkkjr', 'भारत'],
    ['fgUnh', 'हिन्दी'],
    ['deZ', 'कर्म'],
  ])('%s → %s', (keys, out) => {
    expect(typeKeys(keys, 'remington')).toBe(out)
  })

  it('returns empty for empty input', () => {
    expect(typeKeys('', 'remington')).toBe('')
    expect(typeKeys('', 'inscript')).toBe('')
  })
})

describe('CHART', () => {
  it('has 4 non-empty rows per layout', () => {
    for (const layout of ['inscript', 'remington'] as const) {
      expect(CHART[layout]).toHaveLength(4)
      for (const row of CHART[layout]) expect(row.length).toBeGreaterThan(0)
    }
  })
  it('agrees with typeKeys', () => {
    for (const layout of ['inscript', 'remington'] as const)
      for (const row of CHART[layout])
        for (const { key, out } of row) expect(typeKeys(key, layout)).toBe(out)
  })
})
