import { describe, it, expect } from 'vitest'
import { contrastRatio, scanWarnings } from '@/lib/qr/contrast'
import { PRESETS, type QrStyle } from '@/lib/qr/render-svg'

const base: QrStyle = { ...PRESETS[0].style, fill: { kind: 'solid', color: '#000000' }, eyeColor: '#000000', background: '#ffffff' }

describe('contrastRatio', () => {
  it('is 21 for black on white and symmetric', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 1)
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1)
    expect(contrastRatio('#777', '#888')).toBeLessThan(4)
  })
})

describe('scanWarnings', () => {
  it('no warnings for black on white', () => {
    expect(scanWarnings(base, 'M')).toEqual({ warnings: [], ec: 'M' })
  })
  it('warns on low contrast', () => {
    const r = scanWarnings({ ...base, fill: { kind: 'solid', color: '#777777' }, eyeColor: '#777777', background: '#888888' }, 'M')
    expect(r.warnings.map((w) => w.kind)).toContain('contrast')
  })
  it('warns when modules are lighter than the background', () => {
    const r = scanWarnings({ ...base, fill: { kind: 'solid', color: '#ffffff' }, eyeColor: '#ffffff', background: '#000000' }, 'M')
    expect(r.warnings.map((w) => w.kind)).toContain('inverted')
  })
  it('raises EC to H for a logo over 20%', () => {
    const r = scanWarnings({ ...base, logo: { dataUrl: 'data:image/png;base64,AA==', scale: 0.22, clear: true } }, 'M')
    expect(r.ec).toBe('H')
    expect(r.warnings.map((w) => w.kind)).toContain('ec-raised')
    const small = scanWarnings({ ...base, logo: { dataUrl: 'data:image/png;base64,AA==', scale: 0.15, clear: true } }, 'M')
    expect(small.ec).toBe('M')
  })
  it('uses the darkest gradient stop', () => {
    const r = scanWarnings({ ...base, fill: { kind: 'linear', from: '#eeeeee', to: '#000000' } }, 'M')
    expect(r.warnings).toEqual([])
    const bad = scanWarnings({ ...base, fill: { kind: 'linear', from: '#eeeeee', to: '#dddddd' } }, 'M')
    expect(bad.warnings.map((w) => w.kind)).toContain('contrast')
  })
  it('treats a transparent background as white', () => {
    expect(scanWarnings({ ...base, background: 'transparent' }, 'M').warnings).toEqual([])
  })
})
