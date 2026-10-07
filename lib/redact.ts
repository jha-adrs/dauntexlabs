// Pure helpers for manual image redaction (aadhaar-masker). No DOM, no network.

export type Point = { x: number; y: number }
export type Rect = { x: number; y: number; w: number; h: number }
export type RedactColor = 'black' | 'white'

/** Canvas fill colours for redaction boxes — solid and fully opaque. */
export const REDACT_COLORS: Record<RedactColor, string> = { black: '#000000', white: '#ffffff' }

/**
 * Turn a drag (start → end, in displayed CSS pixels) into a rect in the image's
 * natural pixels. Works for a drag in any direction. Rounds outward so the box
 * always fully covers what the user saw, then clamps to `bounds` if given.
 */
export function normalizeRect(
  start: Point,
  end: Point,
  scale: number | Point,
  bounds?: { w: number; h: number },
): Rect {
  const sx = typeof scale === 'number' ? scale : scale.x
  const sy = typeof scale === 'number' ? scale : scale.y
  let x0 = Math.floor(Math.min(start.x, end.x) * sx)
  let y0 = Math.floor(Math.min(start.y, end.y) * sy)
  let x1 = Math.ceil(Math.max(start.x, end.x) * sx)
  let y1 = Math.ceil(Math.max(start.y, end.y) * sy)
  if (bounds) {
    x0 = Math.min(Math.max(x0, 0), bounds.w)
    y0 = Math.min(Math.max(y0, 0), bounds.h)
    x1 = Math.min(Math.max(x1, 0), bounds.w)
    y1 = Math.min(Math.max(y1, 0), bounds.h)
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/** Paint each rect as a solid box. */
export function applyRedactions(ctx: CanvasRenderingContext2D, rects: Rect[], color: RedactColor): void {
  ctx.fillStyle = REDACT_COLORS[color]
  for (const r of rects) ctx.fillRect(r.x, r.y, r.w, r.h)
}

/**
 * Rough area where the first 8 digits of the Aadhaar number tend to sit on the
 * front of a card photographed edge to edge. A visual hint only — layouts vary
 * (card, letter, e-Aadhaar), so it is never applied automatically.
 */
export function guideRect(width: number, height: number): Rect {
  return {
    x: Math.round(width * 0.28),
    y: Math.round(height * 0.72),
    w: Math.round(width * 0.3),
    h: Math.round(height * 0.12),
  }
}
