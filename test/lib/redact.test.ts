import { describe, it, expect, vi } from 'vitest'
import { normalizeRect, applyRedactions, guideRect, REDACT_COLORS } from '@/lib/redact'

// Reference values are hand-computed: display→natural scale is a plain multiply,
// and the rect is the min corner + absolute extent of the drag.

describe('normalizeRect', () => {
  it('scales a top-left → bottom-right drag from display to natural pixels', () => {
    expect(normalizeRect({ x: 10, y: 20 }, { x: 60, y: 45 }, 2)).toEqual({ x: 20, y: 40, w: 100, h: 50 })
  })

  it('gives the same rect whichever direction the drag went', () => {
    const want = { x: 20, y: 40, w: 100, h: 50 }
    expect(normalizeRect({ x: 60, y: 45 }, { x: 10, y: 20 }, 2)).toEqual(want) // up-left
    expect(normalizeRect({ x: 60, y: 20 }, { x: 10, y: 45 }, 2)).toEqual(want) // down-left
    expect(normalizeRect({ x: 10, y: 45 }, { x: 60, y: 20 }, 2)).toEqual(want) // up-right
  })

  it('supports separate x / y scale factors', () => {
    expect(normalizeRect({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 3, y: 1.5 })).toEqual({ x: 0, y: 0, w: 30, h: 15 })
  })

  it('rounds outward so a fractional box never leaves an uncovered sliver', () => {
    // 1.25*3 = 3.75 → floor 3; 4.1*3 = 12.3 → ceil 13
    expect(normalizeRect({ x: 1.25, y: 1.25 }, { x: 4.1, y: 4.1 }, 3)).toEqual({ x: 3, y: 3, w: 10, h: 10 })
  })

  it('clamps to the image bounds when given', () => {
    expect(normalizeRect({ x: -5, y: -5 }, { x: 500, y: 500 }, 1, { w: 100, h: 80 })).toEqual({ x: 0, y: 0, w: 100, h: 80 })
  })

  it('a click without a drag gives a zero-size rect', () => {
    expect(normalizeRect({ x: 5, y: 5 }, { x: 5, y: 5 }, 2)).toEqual({ x: 10, y: 10, w: 0, h: 0 })
  })
})

describe('applyRedactions', () => {
  it('fills every rect with the chosen solid colour', () => {
    const fillRect = vi.fn()
    const ctx = { fillStyle: '', fillRect } as unknown as CanvasRenderingContext2D
    applyRedactions(ctx, [{ x: 1, y: 2, w: 3, h: 4 }, { x: 5, y: 6, w: 7, h: 8 }], 'black')
    expect(ctx.fillStyle).toBe(REDACT_COLORS.black)
    expect(fillRect).toHaveBeenCalledTimes(2)
    expect(fillRect).toHaveBeenNthCalledWith(1, 1, 2, 3, 4)
    expect(fillRect).toHaveBeenNthCalledWith(2, 5, 6, 7, 8)
    applyRedactions(ctx, [], 'white')
    expect(ctx.fillStyle).toBe(REDACT_COLORS.white)
  })
})

describe('guideRect', () => {
  it('sits inside the image, in the lower half', () => {
    const g = guideRect(1000, 630)
    expect(g.x).toBeGreaterThanOrEqual(0)
    expect(g.x + g.w).toBeLessThanOrEqual(1000)
    expect(g.y).toBeGreaterThan(315)
    expect(g.y + g.h).toBeLessThanOrEqual(630)
    expect(g.w).toBeGreaterThan(0)
  })
})
