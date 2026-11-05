// Lossless WebP metadata removal. Only extended (VP8X) files can carry metadata:
// their EXIF and "XMP " chunks are dropped, the matching VP8X flag bits cleared and
// the RIFF size fixed. Image data and the ICC profile (ICCP) are copied as-is.

import { readExif, type ExifSummary } from '@/lib/jpeg-meta'

const FLAG_EXIF = 0x08
const FLAG_XMP = 0x04

export type WebpMetadata = { exif: ExifSummary | null; xmp: boolean }

type Chunk = { id: string; start: number; data: number; size: number; end: number }

const isAscii = (b: Uint8Array, at: number, s: string) => [...s].every((c, i) => b[at + i] === c.charCodeAt(0))
const le32 = (b: Uint8Array, at: number) => (b[at] | (b[at + 1] << 8) | (b[at + 2] << 16) | (b[at + 3] << 24)) >>> 0

function chunks(b: Uint8Array): Chunk[] {
  if (b.length < 12 || !isAscii(b, 0, 'RIFF') || !isAscii(b, 8, 'WEBP')) throw new Error('Not a WebP')
  const limit = 8 + le32(b, 4)
  if (limit > b.length) throw new Error('Corrupt WebP')
  const out: Chunk[] = []
  let i = 12
  while (i + 8 <= limit) {
    const size = le32(b, i + 4)
    const data = i + 8
    if (data + size > limit) throw new Error('Corrupt WebP')
    const end = Math.min(data + size + (size & 1), limit)
    out.push({ id: String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]), start: i, data, size, end })
    i = end
  }
  return out
}

/** What metadata a WebP carries. Throws if the bytes are not a WebP. */
export function webpMetadata(b: Uint8Array): WebpMetadata {
  const m: WebpMetadata = { exif: null, xmp: false }
  for (const c of chunks(b)) {
    if (c.id === 'EXIF') {
      const t = isAscii(b, c.data, 'Exif\0\0') ? c.data + 6 : c.data
      m.exif = readExif(b, t, c.data + c.size) ?? { gps: false, orientation: 1 }
    } else if (c.id === 'XMP ') m.xmp = true
  }
  return m
}

/** Copy of the WebP without EXIF/XMP. Throws if the bytes are not a WebP. */
export function stripWebpMetadata(b: Uint8Array): Uint8Array {
  const kept = chunks(b).filter((c) => c.id !== 'EXIF' && c.id !== 'XMP ')
  const out = new Uint8Array(12 + kept.reduce((n, c) => n + c.end - c.start, 0))
  out.set(b.subarray(0, 12))
  let o = 12
  for (const c of kept) {
    out.set(b.subarray(c.start, c.end), o)
    if (c.id === 'VP8X' && c.size > 0) out[o + 8] &= ~(FLAG_EXIF | FLAG_XMP)
    o += c.end - c.start
  }
  const size = out.length - 8
  out.set([size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, size >>> 24], 4)
  return out
}
