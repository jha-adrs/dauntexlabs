import { describe, it, expect } from 'vitest'
import { fitText, formatDateIN, coverCrop, containRect, layoutStamp } from '@/lib/stamp'

// Reference values hand-computed. The fake measure says every glyph is 0.5em wide.
const measure = (text: string, px: number) => text.length * px * 0.5

describe('fitText', () => {
  it('returns maxFont when the text already fits', () => {
    expect(fitText(measure, 'ABCD', 100, 20)).toBe(20) // 4*20*0.5 = 40 ≤ 100
  })
  it('shrinks to the largest whole size that fits', () => {
    // 10 chars: width = 5*px ≤ 72 → px = 14
    expect(fitText(measure, 'ABCDEFGHIJ', 72, 30)).toBe(14)
  })
  it('never goes below the minimum font size', () => {
    expect(fitText(measure, 'X'.repeat(500), 50, 30, 8)).toBe(8)
  })
  it('empty text gets maxFont', () => {
    expect(fitText(measure, '', 10, 18)).toBe(18)
  })
})

describe('formatDateIN', () => {
  it('formats a YYYY-MM-DD string as DD/MM/YYYY without timezone shifts', () => {
    expect(formatDateIN('2026-10-07')).toBe('07/10/2026')
    expect(formatDateIN('2024-02-29')).toBe('29/02/2024')
  })
  it('formats a Date using its local calendar day', () => {
    expect(formatDateIN(new Date(2025, 0, 5))).toBe('05/01/2025')
  })
  it('returns empty string for invalid input', () => {
    expect(formatDateIN('')).toBe('')
    expect(formatDateIN('2025-13-01')).toBe('')
    expect(formatDateIN('2025-02-30')).toBe('')
    expect(formatDateIN(new Date('nope'))).toBe('')
  })
})

describe('coverCrop', () => {
  it('crops the sides of a wide source to fill a tall box (centred)', () => {
    // 400x200 into 100x100 → square 200x200 from x=100
    expect(coverCrop(400, 200, 100, 100)).toEqual({ sx: 100, sy: 0, sw: 200, sh: 200 })
  })
  it('crops top/bottom of a tall source', () => {
    expect(coverCrop(200, 400, 100, 100)).toEqual({ sx: 0, sy: 100, sw: 200, sh: 200 })
  })
})

describe('containRect', () => {
  it('letterboxes a wide signature into a box, centred', () => {
    // 300x60 into 140x60 → scale 140/300 → 140x28, y offset 16
    expect(containRect(300, 60, { x: 0, y: 100, w: 140, h: 60 })).toEqual({ x: 0, y: 116, w: 140, h: 28 })
  })
})

describe('layoutStamp', () => {
  it('puts the strip inside the bottom of the photo box', () => {
    const l = layoutStamp({ width: 200, height: 230, stripPct: 20 })
    expect(l).toEqual({
      width: 200,
      height: 230,
      photo: { x: 0, y: 0, w: 200, h: 184 },
      strip: { x: 0, y: 184, w: 200, h: 46 },
      sig: null,
    })
  })
  it('no strip when stripPct is 0', () => {
    const l = layoutStamp({ width: 200, height: 230, stripPct: 0 })
    expect(l.strip).toBeNull()
    expect(l.photo.h).toBe(230)
  })
  it('joins a signature below, scaled to the photo width and keeping the signature ratio', () => {
    // 140x60 at width 200 → 200 * 60/140 = 85.7 → 86
    const l = layoutStamp({ width: 200, height: 230, stripPct: 20, sig: { w: 140, h: 60 } })
    expect(l.height).toBe(316)
    expect(l.sig).toEqual({ x: 0, y: 230, w: 200, h: 86 })
  })
})
