// Pure helpers for photo-date-stamp: text fitting, Indian date format, layout.

export type Box = { x: number; y: number; w: number; h: number }

/** Largest whole font size (≤ maxFont, ≥ minFont) at which `text` fits in maxWidth. */
export function fitText(
  measure: (text: string, px: number) => number,
  text: string,
  maxWidth: number,
  maxFont: number,
  minFont = 8,
): number {
  let px = Math.floor(maxFont)
  while (px > minFont && measure(text, px) > maxWidth) px--
  return Math.max(px, minFont)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 'YYYY-MM-DD' (as from <input type="date">) or a Date → 'DD/MM/YYYY'; '' if invalid. */
export function formatDateIN(input: Date | string): string {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return ''
    return `${pad(input.getDate())}/${pad(input.getMonth() + 1)}/${input.getFullYear()}`
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
  if (!m) return ''
  const y = +m[1]
  const mo = +m[2]
  const d = +m[3]
  // Validate the calendar day (UTC avoids DST/timezone surprises).
  const dt = new Date(Date.UTC(y, mo - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return ''
  return `${m[3]}/${m[2]}/${m[1]}`
}

/** Centred source crop so (srcW×srcH) fills (dstW×dstH) without distortion. */
export function coverCrop(srcW: number, srcH: number, dstW: number, dstH: number) {
  const scale = Math.max(dstW / srcW, dstH / srcH)
  const sw = Math.round(dstW / scale)
  const sh = Math.round(dstH / scale)
  return { sx: Math.round((srcW - sw) / 2), sy: Math.round((srcH - sh) / 2), sw, sh }
}

/** Centred destination rect so (srcW×srcH) fits entirely inside `box`. */
export function containRect(srcW: number, srcH: number, box: Box): Box {
  const scale = Math.min(box.w / srcW, box.h / srcH)
  const w = Math.round(srcW * scale)
  const h = Math.round(srcH * scale)
  return { x: box.x + Math.round((box.w - w) / 2), y: box.y + Math.round((box.h - h) / 2), w, h }
}

/**
 * Output layout: photo box of width×height with the name/date strip taking the
 * bottom `stripPct`% of it (exam style), plus an optional signature band joined
 * below, as wide as the photo and keeping the signature's aspect ratio.
 */
export function layoutStamp(opts: {
  width: number
  height: number
  stripPct: number
  sig?: { w: number; h: number }
}): { width: number; height: number; photo: Box; strip: Box | null; sig: Box | null } {
  const { width, height } = opts
  const stripH = Math.round((height * Math.min(Math.max(opts.stripPct, 0), 50)) / 100)
  const photo = { x: 0, y: 0, w: width, h: height - stripH }
  const strip = stripH > 0 ? { x: 0, y: height - stripH, w: width, h: stripH } : null
  const sigH = opts.sig ? Math.round((width * opts.sig.h) / opts.sig.w) : 0
  const sig = opts.sig ? { x: 0, y: height, w: width, h: sigH } : null
  return { width, height: height + sigH, photo, strip, sig }
}
