// Fit engine for exam/form photo uploads: crop maths, a JPEG quality search
// that lands a file inside a KB range, byte-level padding and JFIF density.
// Pure functions — the canvas encode step is passed in, so tests can run it.

import { coverCrop } from '@/lib/stamp'

export const DEFAULT_DPI = 200
export const DEFAULT_MAX_SIDE = 1000

const Q_MAX = 0.95
const Q_MIN = 0.3
const SCALE_STEP = 0.85
const MAX_SCALE_STEPS = 6
/** Where in the KB range the quality search aims (0 = floor, 1 = ceiling). */
const TARGET_SHARE = 0.85

export type ByteBounds = { min: number; max: number; target: number }
export type Encode = (quality: number) => Promise<Blob>
export type FitResult =
  | { ok: true; bytes: Uint8Array; quality: number; width: number; height: number; padded: boolean; scaled: boolean }
  | { ok: false; reason: 'too-big' }
export type Check = { key: 'px' | 'kb' | 'jpg' | 'dpi'; ok: boolean; text: string }
export type FitSpec = { px?: [number, number]; width?: number; kb: [number, number]; dpi?: number }

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

/** Source rectangle for a cover-crop with zoom ≥ 1 and offsets in −1..1 (0 = centred). */
export function cropRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const z = Math.max(1, zoom)
  const ox = clamp(offsetX, -1, 1)
  const oy = clamp(offsetY, -1, 1)
  const base = coverCrop(srcW, srcH, dstW, dstH)
  const sw = Math.round(base.sw / z)
  const sh = Math.round(base.sh / z)
  return {
    sx: Math.round(((srcW - sw) / 2) * (1 + ox)),
    sy: Math.round(((srcH - sh) / 2) * (1 + oy)),
    sw,
    sh,
  }
}

/** Floor in 1024-byte KB, ceiling in 1000-byte KB, so either reading of "KB" passes. */
export function byteBounds(kb: [number, number]): ByteBounds {
  let min = kb[0] * 1024
  let max = kb[1] * 1000
  if (min > max) {
    min = kb[0] * 1000
    max = kb[1] * 1000
  }
  return { min, max, target: Math.round(min + TARGET_SHARE * (max - min)) }
}

/**
 * Top quality when it already fits under max. Otherwise the highest quality whose
 * size is ≤ the target (85% of the way up the range, a margin under the ceiling);
 * if even the lowest quality is above the target but still ≤ max, accept it.
 */
export async function fitQuality(
  encode: Encode,
  bounds: ByteBounds,
): Promise<{ blob: Blob; quality: number } | { tooBig: true }> {
  const top = await encode(Q_MAX)
  if (top.size <= bounds.max) return { blob: top, quality: Q_MAX }
  const bottom = await encode(Q_MIN)
  if (bottom.size > bounds.max) return { tooBig: true }
  if (bottom.size > bounds.target) return { blob: bottom, quality: Q_MIN }
  let lo = Q_MIN
  let hi = Q_MAX
  let best = { blob: bottom, quality: Q_MIN }
  for (let i = 0; i < 6; i++) {
    const mid = (lo + hi) / 2
    const b = await encode(mid)
    if (b.size <= bounds.target) {
      lo = mid
      best = { blob: b, quality: mid }
    } else {
      hi = mid
    }
  }
  return { blob: best.blob, quality: Math.round(best.quality * 100) / 100 }
}

const hasApp0 = (b: Uint8Array) => b.length > 4 && b[2] === 0xff && b[3] === 0xe0
const isJpeg = (b: Uint8Array) => b.length > 2 && b[0] === 0xff && b[1] === 0xd8
const isJfif = (b: Uint8Array) =>
  hasApp0(b) && b.length >= 18 && b[6] === 0x4a && b[7] === 0x46 && b[8] === 0x49 && b[9] === 0x46 && b[10] === 0

/** Grow a JPEG to ≥ minBytes with COM segments of spaces after APP0. Pixels are unchanged. */
export function padJpeg(bytes: Uint8Array, minBytes: number): Uint8Array {
  let need = minBytes - bytes.length
  if (need <= 0) return bytes
  const at = hasApp0(bytes) ? 4 + ((bytes[4] << 8) | bytes[5]) : 2
  const segs: number[] = []
  while (need > 0) {
    const s = clamp(need, 4, 65537)
    segs.push(s)
    need -= s
  }
  const out = new Uint8Array(bytes.length + segs.reduce((a, b) => a + b, 0))
  out.set(bytes.subarray(0, at), 0)
  let p = at
  for (const s of segs) {
    out[p] = 0xff
    out[p + 1] = 0xfe
    out[p + 2] = ((s - 2) >> 8) & 0xff
    out[p + 3] = (s - 2) & 0xff
    out.fill(0x20, p + 4, p + s)
    p += s
  }
  out.set(bytes.subarray(at), p)
  return out
}

/** Copy of the JPEG with JFIF density set to dpi × dpi (inserts an APP0 if missing). */
export function setJfifDensity(bytes: Uint8Array, dpi: number): Uint8Array {
  if (!isJpeg(bytes)) return bytes.slice()
  const d = clamp(Math.round(dpi), 1, 65535)
  if (isJfif(bytes)) {
    const out = bytes.slice()
    out[13] = 1
    out[14] = d >> 8
    out[15] = d & 0xff
    out[16] = d >> 8
    out[17] = d & 0xff
    return out
  }
  const app0 = [0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 1, d >> 8, d & 0xff, d >> 8, d & 0xff, 0, 0]
  const out = new Uint8Array(bytes.length + app0.length)
  out.set(bytes.subarray(0, 2), 0)
  out.set(app0, 2)
  out.set(bytes.subarray(2), 2 + app0.length)
  return out
}

/** JFIF DPI when units are dots-per-inch and X = Y; otherwise null. */
export function jfifDensity(bytes: Uint8Array): number | null {
  if (!isJpeg(bytes) || !isJfif(bytes) || bytes[13] !== 1) return null
  const x = (bytes[14] << 8) | bytes[15]
  const y = (bytes[16] << 8) | bytes[17]
  return x === y ? x : null
}

/** Push light, low-saturation pixels to pure white. strength 0–100; alpha untouched. */
export function whiten(data: Uint8ClampedArray, strength: number): void {
  const f = clamp(strength, 0, 100) / 100
  if (f <= 0) return
  const minLight = 1 - 0.35 * f
  const maxChroma = 64 * f
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const mx = Math.max(r, g, b)
    const mn = Math.min(r, g, b)
    if ((mx + mn) / 510 >= minLight && mx - mn <= maxChroma) {
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
    }
  }
}

/** Output pixels: fixed px, fixed width (height from source proportions), or the source capped at maxSide. */
export function targetSize(
  u: { px?: [number, number]; width?: number },
  srcW: number,
  srcH: number,
  maxSide = DEFAULT_MAX_SIDE,
): [number, number] {
  if (u.px) return [u.px[0], u.px[1]]
  if (u.width) return [u.width, Math.max(1, Math.round((u.width * srcH) / srcW))]
  const s = Math.min(1, maxSide / Math.max(srcW, srcH))
  return [Math.max(1, Math.round(srcW * s)), Math.max(1, Math.round(srcH * s))]
}

/** Encode at `size`, search quality, scale down (free size only), set DPI, pad to the minimum. */
export async function fitToBounds(
  render: (w: number, h: number) => Encode,
  size: [number, number],
  bounds: ByteBounds,
  opts: { fixedPx: boolean; dpi: number },
): Promise<FitResult> {
  const steps = opts.fixedPx ? 0 : MAX_SCALE_STEPS
  for (let step = 0; step <= steps; step++) {
    const k = Math.pow(SCALE_STEP, step)
    const w = Math.max(1, Math.round(size[0] * k))
    const h = Math.max(1, Math.round(size[1] * k))
    const encode = render(w, h)
    // Write the DPI before measuring, so an inserted APP0 counts against the maximum.
    const withDpi: Encode = async (q) =>
      new Blob([setJfifDensity(new Uint8Array(await (await encode(q)).arrayBuffer()), opts.dpi) as BlobPart], {
        type: 'image/jpeg',
      })
    const r = await fitQuality(withDpi, bounds)
    if ('tooBig' in r) continue
    let bytes: Uint8Array = new Uint8Array(await r.blob.arrayBuffer())
    const padded = bytes.length < bounds.min
    if (padded) bytes = padJpeg(bytes, bounds.min)
    return { ok: true, bytes, quality: r.quality, width: w, height: h, padded, scaled: step > 0 }
  }
  return { ok: false, reason: 'too-big' }
}

const kbText = (n: number) => `${(n / 1024).toFixed(1)} KB`

/** Checklist shown before download: pixels, KB range, JPG, DPI. */
export function checkOutput(bytes: Uint8Array, width: number, height: number, u: FitSpec): Check[] {
  const b = byteBounds(u.kb)
  const dpi = u.dpi ?? DEFAULT_DPI
  const pxOk = u.px ? u.px[0] === width && u.px[1] === height : u.width ? u.width === width : true
  const allowed = u.kb[0] > 0 ? `allowed ${u.kb[0]}–${u.kb[1]} KB` : `up to ${u.kb[1]} KB`
  return [
    { key: 'px', ok: pxOk, text: `${width} × ${height} px` },
    { key: 'kb', ok: bytes.length >= b.min && bytes.length <= b.max, text: `${kbText(bytes.length)} (${allowed})` },
    { key: 'jpg', ok: bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff, text: 'JPG' },
    { key: 'dpi', ok: jfifDensity(bytes) === dpi, text: `${dpi} DPI` },
  ]
}
