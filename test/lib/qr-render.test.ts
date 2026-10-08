import { describe, it, expect, beforeAll } from 'vitest'
import { makeMatrix, type QrMatrix } from '@/lib/qr/matrix'
import { renderSvg, PRESETS, EYE_BALLS_FOR, type QrStyle, type ModuleShape } from '@/lib/qr/render-svg'

let m: QrMatrix
beforeAll(async () => {
  m = await makeMatrix('https://dauntexlabs.com', 'M')
})

const base: QrStyle = {
  module: 'square',
  eyeFrame: 'square',
  eyeBall: 'square',
  fill: { kind: 'solid', color: '#000000' },
  eyeColor: '#000000',
  background: '#ffffff',
  quiet: 4,
  frame: 'none',
  cta: '',
}

function parse(svg: string): Document {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  expect(doc.getElementsByTagName('parsererror').length).toBe(0)
  return doc
}
function viewBox(doc: Document): number[] {
  return doc.documentElement.getAttribute('viewBox')!.split(/\s+/).map(Number)
}

describe('renderSvg', () => {
  it('draws one element per dark non-eye module and the eyes separately', () => {
    const doc = parse(renderSvg(m, base))
    let expected = 0
    for (let r = 0; r < m.size; r++) for (let c = 0; c < m.size; c++) if (m.dark[r][c] && !m.isEye(r, c)) expected++
    expect(doc.querySelectorAll('[data-m]').length).toBe(expected)
    expect(doc.querySelectorAll('[data-eye-frame]').length).toBe(3)
    expect(doc.querySelectorAll('[data-eye-ball]').length).toBe(3)
    expect(viewBox(doc)).toEqual([0, 0, m.size + 8, m.size + 8])
  })

  const shapes: ModuleShape[] = ['square', 'rounded', 'dots', 'classy', 'diamond', 'vbars', 'hbars', 'fluid']
  it.each(shapes)('renders module shape %s as parseable SVG', (module) => {
    for (const eyeFrame of ['square', 'rounded', 'circle', 'leaf'] as const) {
      for (const eyeBall of ['square', 'rounded', 'circle', 'diamond'] as const) {
        const doc = parse(renderSvg(m, { ...base, module, eyeFrame, eyeBall }))
        expect(doc.documentElement.getAttribute('viewBox')).toBeTruthy()
        expect(doc.querySelectorAll('[data-m]').length).toBeGreaterThan(0)
      }
    }
  })

  it('adds a linearGradient in defs for gradient fills', () => {
    const doc = parse(renderSvg(m, { ...base, fill: { kind: 'linear', from: '#0f7a4a', to: '#10261b', angle: 45 } }))
    expect(doc.querySelector('defs linearGradient')).not.toBeNull()
    const radial = parse(renderSvg(m, { ...base, fill: { kind: 'radial', from: '#0f7a4a', to: '#10261b' } }))
    expect(radial.querySelector('defs radialGradient')).not.toBeNull()
  })

  it('embeds a logo and clears the modules under it', () => {
    const logo = { dataUrl: 'data:image/png;base64,iVBORw0KGgo=', scale: 0.25, clear: true }
    const doc = parse(renderSvg(m, { ...base, logo }))
    const imgs = doc.getElementsByTagName('image')
    expect(imgs.length).toBe(1)
    const img = imgs[0]
    expect(img.getAttribute('href')).toMatch(/^data:image\/png/)
    const x = Number(img.getAttribute('x')), y = Number(img.getAttribute('y'))
    const w = Number(img.getAttribute('width')), h = Number(img.getAttribute('height'))
    for (const el of Array.from(doc.querySelectorAll('[data-m]'))) {
      const [r, c] = el.getAttribute('data-m')!.split(',').map(Number)
      const mx = c + 4, my = r + 4
      const overlaps = mx < x + w && mx + 1 > x && my < y + h && my + 1 > y
      expect(overlaps).toBe(false)
    }
    // without clear, modules stay under the logo
    const kept = parse(renderSvg(m, { ...base, logo: { ...logo, clear: false } }))
    expect(kept.querySelectorAll('[data-m]').length).toBeGreaterThan(doc.querySelectorAll('[data-m]').length)
  })

  it('ignores a logo that is not an image data URL', () => {
    const doc = parse(renderSvg(m, { ...base, logo: { dataUrl: 'https://evil.example/x.png', scale: 0.2, clear: true } }))
    expect(doc.getElementsByTagName('image').length).toBe(0)
  })

  it('draws a background rect unless transparent', () => {
    expect(parse(renderSvg(m, base)).querySelector('[data-bg]')).not.toBeNull()
    expect(parse(renderSvg(m, { ...base, background: 'transparent' })).querySelector('[data-bg]')).toBeNull()
  })

  it('adds a frame with CTA text below the code', () => {
    for (const frame of ['box', 'badge'] as const) {
      const doc = parse(renderSvg(m, { ...base, frame, cta: 'Scan me' }))
      const text = doc.getElementsByTagName('text')[0]
      expect(text.textContent).toBe('Scan me')
      const [, , w, h] = viewBox(doc)
      expect(h).toBeGreaterThan(w)
    }
  })

  it('XML-escapes the CTA text', () => {
    const svg = renderSvg(m, { ...base, frame: 'box', cta: '<&>"' })
    expect(svg).not.toContain('<&>')
    expect(parse(svg).getElementsByTagName('text')[0].textContent).toBe('<&>"')
  })

  it('falls back to safe colours when given non-hex input', () => {
    const svg = renderSvg(m, { ...base, fill: { kind: 'solid', color: 'red"/><script>' }, eyeColor: 'x' })
    expect(svg).not.toContain('<script')
    parse(svg)
  })

  it('ships 6 presets that all render', () => {
    expect(PRESETS.length).toBe(6)
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(6)
    for (const p of PRESETS) parse(renderSvg(m, p.style))
  })

  it('offers only eye frame/centre pairs that decode in jsQR for every module shape', () => {
    expect(EYE_BALLS_FOR).toEqual({
      square: ['square'],
      rounded: ['rounded'],
      circle: ['circle'],
      leaf: ['rounded', 'circle'],
    })
    expect(Object.values(EYE_BALLS_FOR).flat()).not.toContain('diamond')
  })

  it('every preset uses an allowed eye pair', () => {
    for (const p of PRESETS) expect(EYE_BALLS_FOR[p.style.eyeFrame], p.id).toContain(p.style.eyeBall)
  })
})

describe('box frame quiet zone', () => {
  it('keeps at least 2 modules of quiet zone inside a box frame', async () => {
    const m = await makeMatrix('https://x.co/a', 'M')
    const box: QrStyle = { ...base, frame: 'box', cta: 'Scan me' }
    expect(renderSvg(m, { ...box, quiet: 0 })).toBe(renderSvg(m, { ...box, quiet: 2 }))
    expect(renderSvg(m, { ...box, quiet: 4 })).not.toBe(renderSvg(m, { ...box, quiet: 2 }))
  })
})
