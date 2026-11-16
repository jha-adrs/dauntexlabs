import { describe, it, expect } from 'vitest'
import { attendance, formatPct } from '@/lib/attendance'

const ok = (held: number, attended: number, target: number, remaining?: number) => {
  const r = attendance({ held, attended, target, remaining })
  if (!r.ok) throw new Error(r.error)
  return r
}

describe('attendance — can miss', () => {
  it('42 of 50 at 75 → 84%, can miss 6', () => {
    const r = ok(50, 42, 75)
    expect(formatPct(r.percent)).toBe('84')
    expect(r.canMiss).toBe(6)
    expect(r.mustAttend).toBe(0)
  })
  it('50 of 60 at 75 → can miss 6', () => expect(ok(60, 50, 75).canMiss).toBe(6))
  it('45 of 60 at 75 → exactly 75%, can miss 0', () => {
    const r = ok(60, 45, 75)
    expect(formatPct(r.percent)).toBe('75')
    expect(r.canMiss).toBe(0)
    expect(r.mustAttend).toBe(0)
  })
  it('100% target with full attendance → can miss 0', () => expect(ok(10, 10, 100).canMiss).toBe(0))
})

describe('attendance — must attend', () => {
  it('30 of 50 at 75 → 60%, attend 30', () => {
    const r = ok(50, 30, 75)
    expect(formatPct(r.percent)).toBe('60')
    expect(r.mustAttend).toBe(30)
    expect(r.canMiss).toBe(0)
  })
  it('10 of 20 at 80 → attend 30', () => expect(ok(20, 10, 80).mustAttend).toBe(30))
  it('p = 100 with any absence → not reachable', () => {
    const r = ok(20, 19, 100)
    expect(r.reachable).toBe(false)
    expect(r.mustAttend).toBeNull()
  })
})

describe('attendance — with remaining classes', () => {
  it('30 of 50, 20 remaining, 75 → needs 23, not reachable, best 71.43%', () => {
    const r = ok(50, 30, 75, 20)
    expect(r.plan).not.toBeNull()
    expect(r.plan!.needed).toBe(23)
    expect(r.plan!.reachable).toBe(false)
    expect(formatPct(r.plan!.best)).toBe('71.43')
  })
  it('40 of 50, 20 remaining, 75 → attend 13, can miss 7', () => {
    const r = ok(50, 40, 75, 20)
    expect(r.plan!.needed).toBe(13)
    expect(r.plan!.canMiss).toBe(7)
    expect(r.plan!.reachable).toBe(true)
  })
  it('already safe → needs 0 of remaining', () => {
    const r = ok(50, 45, 75, 10)
    expect(r.plan!.needed).toBe(0)
    expect(r.plan!.canMiss).toBe(10)
  })
  it('p = 100 with absence and remaining → not reachable', () => {
    expect(ok(20, 19, 100, 10).plan!.reachable).toBe(false)
  })
  it('remaining 0 is accepted', () => expect(ok(50, 40, 75, 0).plan!.needed).toBe(0))
  it('no remaining → plan is null', () => expect(ok(50, 40, 75).plan).toBeNull())
})

describe('attendance — invalid input', () => {
  const bad: [string, Parameters<typeof attendance>[0]][] = [
    ['attended > held', { held: 10, attended: 11, target: 75 }],
    ['negative attended', { held: 10, attended: -1, target: 75 }],
    ['negative held', { held: -10, attended: 0, target: 75 }],
    ['non-integer held', { held: 10.5, attended: 5, target: 75 }],
    ['non-integer attended', { held: 10, attended: 5.5, target: 75 }],
    ['held = 0', { held: 0, attended: 0, target: 75 }],
    ['target 0', { held: 10, attended: 5, target: 0 }],
    ['target 101', { held: 10, attended: 5, target: 101 }],
    ['non-integer target', { held: 10, attended: 5, target: 75.5 }],
    ['negative remaining', { held: 10, attended: 5, target: 75, remaining: -1 }],
    ['non-integer remaining', { held: 10, attended: 5, target: 75, remaining: 1.5 }],
    ['NaN', { held: NaN, attended: 5, target: 75 }],
    ['Infinity', { held: Infinity, attended: 5, target: 75 }],
  ]
  for (const [name, input] of bad) {
    it(`${name} → error`, () => {
      const r = attendance(input)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toMatch(/\S/)
    })
  }
})

describe('formatPct', () => {
  it('rounds to 2 decimals and trims zeros', () => {
    expect(formatPct(200 / 3)).toBe('66.67')
    expect(formatPct(84)).toBe('84')
    expect(formatPct(82.5)).toBe('82.5')
  })
})
