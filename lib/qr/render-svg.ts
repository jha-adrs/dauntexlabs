// QR matrix + style → standalone SVG string. Pure; no DOM needed.
// Coordinates are in module units: the code occupies [quiet, quiet + size) on both axes.
// Eyes (finder patterns) are always drawn as their own groups so module shapes never distort them.

import type { QrMatrix } from './matrix'

export type ModuleShape = 'square' | 'rounded' | 'dots' | 'classy' | 'diamond' | 'vbars' | 'hbars' | 'fluid'
export type EyeFrame = 'square' | 'rounded' | 'circle' | 'leaf'
export type EyeBall = 'square' | 'rounded' | 'circle' | 'diamond'
export type Fill = { kind: 'solid'; color: string } | { kind: 'linear' | 'radial'; from: string; to: string; angle?: number }

export interface QrStyle {
  module: ModuleShape
  eyeFrame: EyeFrame
  eyeBall: EyeBall
  fill: Fill
  eyeColor: string
  background: string | 'transparent'
  /** Quiet zone in modules, 0–8. */
  quiet: number
  /** scale = logo width as a fraction of the code width, 0.1–0.25. */
  logo?: { dataUrl: string; scale: number; clear: boolean }
  frame: 'none' | 'box' | 'badge'
  cta: string
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const color = (c: string, fallback: string) => (HEX.test(c) ? c : fallback)
const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
const n = (v: number) => String(Math.round(v * 1000) / 1000)

/** One dark module at (x, y) — top-left corner in module units. */
function moduleEl(shape: ModuleShape, x: number, y: number, tag: string): string {
  switch (shape) {
    case 'rounded':
      return `<rect ${tag} x="${n(x + 0.05)}" y="${n(y + 0.05)}" width="0.9" height="0.9" rx="0.3"/>`
    case 'dots':
      return `<circle ${tag} cx="${n(x + 0.5)}" cy="${n(y + 0.5)}" r="0.45"/>`
    case 'classy': {
      // rounded top-left and bottom-right corners only
      const r = 0.45
      return `<path ${tag} d="M${n(x + r)} ${n(y)}H${n(x + 1)}V${n(y + 1 - r)}A${r} ${r} 0 0 1 ${n(x + 1 - r)} ${n(y + 1)}H${n(x)}V${n(y + r)}A${r} ${r} 0 0 1 ${n(x + r)} ${n(y)}Z"/>`
    }
    case 'diamond':
      return `<path ${tag} d="M${n(x + 0.5)} ${n(y)}L${n(x + 1)} ${n(y + 0.5)}L${n(x + 0.5)} ${n(y + 1)}L${n(x)} ${n(y + 0.5)}Z"/>`
    case 'fluid':
      return `<rect ${tag} x="${n(x)}" y="${n(y)}" width="1" height="1" rx="0.5"/>`
    default:
      return `<rect ${tag} x="${n(x)}" y="${n(y)}" width="1" height="1"/>`
  }
}

/** Eye frame: a 7×7 ring drawn with a 1-module stroke. (x, y) = top-left of the finder pattern. */
function eyeFrameEl(shape: EyeFrame, x: number, y: number, fill: string): string {
  const a = `fill="none" stroke="${fill}" stroke-width="1"`
  switch (shape) {
    case 'rounded':
      return `<rect ${a} x="${n(x + 0.5)}" y="${n(y + 0.5)}" width="6" height="6" rx="1.6"/>`
    case 'circle':
      return `<circle ${a} cx="${n(x + 3.5)}" cy="${n(y + 3.5)}" r="3"/>`
    case 'leaf': {
      const l = x + 0.5, t = y + 0.5, r = x + 6.5, b = y + 6.5, k = 2.5
      return `<path ${a} d="M${n(l + k)} ${n(t)}H${n(r)}V${n(b - k)}A${k} ${k} 0 0 1 ${n(r - k)} ${n(b)}H${n(l)}V${n(t + k)}A${k} ${k} 0 0 1 ${n(l + k)} ${n(t)}Z"/>`
    }
    default:
      return `<rect ${a} x="${n(x + 0.5)}" y="${n(y + 0.5)}" width="6" height="6"/>`
  }
}

/** Eye ball: the 3×3 centre. (x, y) = top-left of the finder pattern. */
function eyeBallEl(shape: EyeBall, x: number, y: number, fill: string): string {
  const bx = x + 2, by = y + 2
  switch (shape) {
    case 'rounded':
      return `<rect fill="${fill}" x="${n(bx)}" y="${n(by)}" width="3" height="3" rx="0.9"/>`
    case 'circle':
      return `<circle fill="${fill}" cx="${n(bx + 1.5)}" cy="${n(by + 1.5)}" r="1.5"/>`
    case 'diamond':
      return `<path fill="${fill}" d="M${n(bx + 1.5)} ${n(by - 0.2)}L${n(bx + 3.2)} ${n(by + 1.5)}L${n(bx + 1.5)} ${n(by + 3.2)}L${n(bx - 0.2)} ${n(by + 1.5)}Z"/>`
    default:
      return `<rect fill="${fill}" x="${n(bx)}" y="${n(by)}" width="3" height="3"/>`
  }
}

/** Centres of the alignment patterns (ISO 18004 table, computed as in Nayuki's QR library). */
function alignmentCentres(size: number): number[] {
  const version = (size - 17) / 4
  if (version < 2) return []
  const count = Math.floor(version / 7) + 2
  const step = Math.floor((version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2
  const out = [6]
  for (let pos = size - 7; out.length < count; pos -= step) out.splice(1, 0, pos)
  return out
}

export function renderSvg(m: QrMatrix, s: QrStyle): string {
  const q = Math.max(0, Math.min(8, Math.round(s.quiet)))
  const size = m.size
  const total = size + 2 * q
  const bg = s.background === 'transparent' ? null : color(s.background, '#ffffff')
  const eyeFill = color(s.eyeColor, '#000000')

  // ---- fill (solid or gradient across the code area) ----
  let defs = ''
  let modFill: string
  let primary: string
  if (s.fill.kind === 'solid') {
    modFill = color(s.fill.color, '#000000')
    primary = modFill
  } else {
    const from = color(s.fill.from, '#000000')
    const to = color(s.fill.to, '#000000')
    primary = from
    const stops = `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>`
    if (s.fill.kind === 'linear') {
      const ang = ((s.fill.angle ?? 45) * Math.PI) / 180
      const cx = q + size / 2, cy = q + size / 2, h = size / 2
      const dx = Math.cos(ang) * h, dy = Math.sin(ang) * h
      defs = `<linearGradient id="qr-fill" gradientUnits="userSpaceOnUse" x1="${n(cx - dx)}" y1="${n(cy - dy)}" x2="${n(cx + dx)}" y2="${n(cy + dy)}">${stops}</linearGradient>`
    } else {
      defs = `<radialGradient id="qr-fill" gradientUnits="userSpaceOnUse" cx="${n(q + size / 2)}" cy="${n(q + size / 2)}" r="${n(size * 0.7)}">${stops}</radialGradient>`
    }
    modFill = 'url(#qr-fill)'
  }

  // ---- logo box (module units, absolute) ----
  let logoEl = ''
  let cleared: (r: number, c: number) => boolean = () => false
  if (s.logo && /^data:image\/[a-z0-9.+-]+[;,]/i.test(s.logo.dataUrl)) {
    const scale = Math.max(0.1, Math.min(0.25, s.logo.scale))
    const w = size * scale
    const lx = q + (size - w) / 2
    logoEl = `<image href="${xml(s.logo.dataUrl)}" x="${n(lx)}" y="${n(lx)}" width="${n(w)}" height="${n(w)}" preserveAspectRatio="xMidYMid meet"/>`
    if (s.logo.clear) {
      const pad = 0.5
      const lo = lx - pad, hi = lx + w + pad
      cleared = (r, c) => {
        const x = c + q, y = r + q
        return x < hi && x + 1 > lo && y < hi && y + 1 > lo
      }
    }
  }

  // Alignment patterns stay plain squares in every style: scanners locate them by their 1:1:1 runs,
  // and gaps between rounded or dotted modules break that search.
  const centres = alignmentCentres(size)
  const align = new Set<number>()
  for (const ar of centres) {
    for (const ac of centres) {
      if ((ar === 6 && ac === 6) || (ar === 6 && ac === size - 7) || (ar === size - 7 && ac === 6)) continue
      for (let r = ar - 2; r <= ar + 2; r++) for (let c = ac - 2; c <= ac + 2; c++) align.add(r * size + c)
    }
  }
  const isAlign = (r: number, c: number) => align.has(r * size + c)

  const on = (r: number, c: number) =>
    r >= 0 && c >= 0 && r < size && c < size && m.dark[r][c] && !m.isEye(r, c) && !cleared(r, c)

  // ---- modules ----
  const parts: string[] = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isAlign(r, c) && on(r, c)) parts.push(`<rect data-m="${r},${c}" x="${c + q}" y="${r + q}" width="1" height="1"/>`)
    }
  }
  const free = (r: number, c: number) => on(r, c) && !isAlign(r, c)
  if (s.module === 'vbars' || s.module === 'hbars') {
    const vertical = s.module === 'vbars'
    for (let a = 0; a < size; a++) {
      let b = 0
      while (b < size) {
        const [r, c] = vertical ? [b, a] : [a, b]
        if (!free(r, c)) { b++; continue }
        let len = 1
        while (b + len < size && (vertical ? free(b + len, a) : free(a, b + len))) len++
        const x = c + q, y = r + q
        parts.push(
          vertical
            ? `<rect data-m="${r},${c}" x="${n(x + 0.1)}" y="${n(y + 0.05)}" width="0.8" height="${n(len - 0.1)}" rx="0.4"/>`
            : `<rect data-m="${r},${c}" x="${n(x + 0.05)}" y="${n(y + 0.1)}" width="${n(len - 0.1)}" height="0.8" rx="0.4"/>`,
        )
        b += len
      }
    }
  } else {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!free(r, c)) continue
        const x = c + q, y = r + q
        parts.push(moduleEl(s.module, x, y, `data-m="${r},${c}"`))
        if (s.module === 'fluid') {
          // bridge to dark right / bottom neighbours so runs merge into one blob
          if (free(r, c + 1)) parts.push(`<rect x="${n(x + 0.5)}" y="${n(y)}" width="1" height="1"/>`)
          if (free(r + 1, c)) parts.push(`<rect x="${n(x)}" y="${n(y + 0.5)}" width="1" height="1"/>`)
        }
      }
    }
  }

  // ---- eyes ----
  const eyes: string[] = []
  for (const [er, ec] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
    const x = ec + q, y = er + q
    eyes.push(`<g data-eye-frame="">${eyeFrameEl(s.eyeFrame, x, y, eyeFill)}</g>`)
    eyes.push(`<g data-eye-ball="">${eyeBallEl(s.eyeBall, x, y, eyeFill)}</g>`)
  }

  const crisp = s.module === 'square' ? ' shape-rendering="crispEdges"' : ''
  const code =
    (bg ? `<rect data-bg="" x="0" y="0" width="${total}" height="${total}" fill="${bg}"/>` : '') +
    `<g fill="${modFill}"${crisp}>${parts.join('')}</g>` +
    eyes.join('') +
    logoEl

  // ---- optional frame with call-to-action text ----
  let width = total, height = total, body = code
  if (s.frame !== 'none') {
    const b = 1 // border thickness in modules
    const ctaH = Math.max(4, Math.round(total * 0.18))
    width = total + 2 * b
    height = total + 2 * b + ctaH
    const frameColor = primary
    const textColor = bg ?? '#ffffff'
    const label = xml(s.cta.trim().slice(0, 40))
    const fontSize = n(Math.min(ctaH * 0.5, (width * 0.9) / Math.max(1, label.length * 0.6)))
    const cx = n(width / 2), cy = n(total + 2 * b + ctaH / 2)
    if (s.frame === 'box') {
      body =
        `<rect x="0" y="0" width="${width}" height="${height}" fill="${frameColor}"/>` +
        `<g transform="translate(${b} ${b})">${bg ? '' : `<rect x="0" y="0" width="${total}" height="${total}" fill="#ffffff"/>`}${code}</g>`
    } else {
      const r = n(Math.min(4, total * 0.08))
      body =
        `<rect x="0" y="0" width="${width}" height="${total + 2 * b}" rx="${r}" fill="${bg ?? '#ffffff'}" stroke="${frameColor}" stroke-width="${n(b * 0.6)}"/>` +
        `<g transform="translate(${b} ${b})">${code.replace(/^<rect data-bg="[^/]*\/>/, '')}</g>` +
        `<rect x="${n(width * 0.12)}" y="${n(total + 2 * b + ctaH * 0.15)}" width="${n(width * 0.76)}" height="${n(ctaH * 0.7)}" rx="${n(ctaH * 0.35)}" fill="${frameColor}"/>`
    }
    body += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-weight="600" font-size="${fontSize}" fill="${textColor}">${label}</text>`
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">` +
    (defs ? `<defs>${defs}</defs>` : '') +
    body +
    `</svg>`
  )
}

const solid = (color: string): Fill => ({ kind: 'solid', color })
const BASE: Omit<QrStyle, 'module' | 'eyeFrame' | 'eyeBall' | 'fill' | 'eyeColor'> = {
  background: '#ffffff',
  quiet: 4,
  frame: 'none',
  cta: '',
}

/** Ready-made styles: the Workbench green family plus neutrals, all dark-on-light for reliable scanning. */
export const PRESETS: { id: string; label: string; style: QrStyle }[] = [
  { id: 'classic', label: 'Classic', style: { ...BASE, module: 'square', eyeFrame: 'square', eyeBall: 'square', fill: solid('#000000'), eyeColor: '#000000' } },
  { id: 'soft', label: 'Soft green', style: { ...BASE, module: 'rounded', eyeFrame: 'rounded', eyeBall: 'rounded', fill: solid('#0f7a4a'), eyeColor: '#0b5c38' } },
  { id: 'dots', label: 'Dots', style: { ...BASE, module: 'dots', eyeFrame: 'circle', eyeBall: 'circle', fill: solid('#10261b'), eyeColor: '#0f7a4a' } },
  { id: 'fluid', label: 'Fluid', style: { ...BASE, module: 'fluid', eyeFrame: 'rounded', eyeBall: 'circle', fill: { kind: 'linear', from: '#0b5c38', to: '#10261b', angle: 45 }, eyeColor: '#10261b' } },
  { id: 'classy', label: 'Classy', style: { ...BASE, module: 'classy', eyeFrame: 'leaf', eyeBall: 'rounded', fill: solid('#1f2a24'), eyeColor: '#0f7a4a', background: '#f4f7f5' } },
  { id: 'badge', label: 'Scan me badge', style: { ...BASE, module: 'rounded', eyeFrame: 'rounded', eyeBall: 'circle', fill: solid('#0f7a4a'), eyeColor: '#0f7a4a', frame: 'badge', cta: 'Scan me' } },
]
