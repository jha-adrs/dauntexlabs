import { describe, it, expect } from 'vitest'
import { makeMatrix } from '@/lib/qr/matrix'

describe('makeMatrix', () => {
  it('builds a version-1 matrix for short text', async () => {
    const m = await makeMatrix('hi', 'M')
    expect(m.size).toBe(21)
    expect(m.dark.length).toBe(21)
    expect(m.dark[0].length).toBe(21)
    expect(m.dark[0][0]).toBe(true)
  })
  it('grows with the input length', async () => {
    const m = await makeMatrix('x'.repeat(200), 'M')
    expect(m.size).toBeGreaterThan(21)
  })
  it('identifies the three finder patterns as eyes', async () => {
    const m = await makeMatrix('hi', 'M')
    const n = m.size
    expect(m.isEye(0, 0)).toBe(true)
    expect(m.isEye(0, n - 1)).toBe(true)
    expect(m.isEye(n - 1, 0)).toBe(true)
    expect(m.isEye(6, 6)).toBe(true)
    expect(m.isEye(n - 1, n - 1)).toBe(false)
    expect(m.isEye(8, 8)).toBe(false)
    expect(m.isEye(7, 7)).toBe(false)
  })
  it('encodes non-Latin text as UTF-8 (more bytes, bigger code)', async () => {
    const a = await makeMatrix('a'.repeat(14), 'M')
    const b = await makeMatrix('₹'.repeat(14), 'M')
    expect(b.size).toBeGreaterThan(a.size)
  })
})
