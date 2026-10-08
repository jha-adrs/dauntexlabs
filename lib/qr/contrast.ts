// Scannability checks for a QR style: colour contrast, inverted colours, logo size vs error correction.

import type { Ec } from './matrix'
import type { QrStyle } from './render-svg'

export type Warning = { kind: 'contrast' | 'inverted' | 'ec-raised'; message: string }

function rgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(h)) return [0, 0, 0]
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2 contrast ratio between two hex colours (#rgb or #rrggbb), 1–21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

const MIN_RATIO = 4

export function scanWarnings(s: QrStyle, ec: Ec): { warnings: Warning[]; ec: Ec } {
  const warnings: Warning[] = []
  const bg = s.background === 'transparent' ? '#ffffff' : s.background
  // For a gradient, check the end closest to the background — that is where scanners fail.
  const moduleColor =
    s.fill.kind === 'solid'
      ? s.fill.color
      : Math.abs(luminance(s.fill.from) - luminance(bg)) <= Math.abs(luminance(s.fill.to) - luminance(bg))
        ? s.fill.from
        : s.fill.to

  const ratio = Math.min(contrastRatio(moduleColor, bg), contrastRatio(s.eyeColor, bg))
  if (ratio < MIN_RATIO) {
    warnings.push({
      kind: 'contrast',
      message: `Low contrast (${ratio.toFixed(1)}:1). Phones may not read this code; aim for at least ${MIN_RATIO}:1 between the code and the background.`,
    })
  }
  if (luminance(moduleColor) > luminance(bg) || luminance(s.eyeColor) > luminance(bg)) {
    warnings.push({
      kind: 'inverted',
      message: 'The code is lighter than its background. Some scanners cannot read inverted QR codes; dark on light is safest.',
    })
  }
  let out = ec
  // Any logo hides modules; even small ones failed to scan at L/M, so always use H.
  if (s.logo && ec !== 'H') {
    out = 'H'
    warnings.push({
      kind: 'ec-raised',
      message: 'Error correction raised to H so the code still scans with a logo covering part of it.',
    })
  }
  return { warnings, ec: out }
}
