// Lossless WebP metadata removal. Only extended (VP8X) files can carry metadata:
// their EXIF, "XMP " and C2PA chunks are dropped, the matching VP8X flag bits cleared
// and the RIFF size fixed. Image data and the ICC profile (ICCP) are copied as-is. A
// non-default EXIF orientation is written back as a minimal EXIF chunk.

import { readExif, orientationTiff, type ExifSummary } from '@/lib/jpeg-meta'

const FLAG_EXIF = 0x08
const FLAG_XMP = 0x04

export type WebpMetadata = { exif: ExifSummary | null; xmp: boolean; c2pa: boolean }

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

function exifOf(b: Uint8Array, c: Chunk) {
  const t = isAscii(b, c.data, 'Exif\0\0') ? c.data + 6 : c.data
  return readExif(b, t, c.data + c.size)
}

/** What metadata a WebP carries. Throws if the bytes are not a WebP. */
export function webpMetadata(b: Uint8Array): WebpMetadata {
  const m: WebpMetadata = { exif: null, xmp: false, c2pa: false }
  for (const c of chunks(b)) {
    if (c.id === 'EXIF') m.exif = exifOf(b, c) ?? { gps: false, orientation: 1 }
    else if (c.id === 'XMP ') m.xmp = true
    else if (c.id === 'C2PA') m.c2pa = true
  }
  return m
}

/** Copy of the WebP without EXIF/XMP/C2PA. Throws if the bytes are not a WebP. */
export function stripWebpMetadata(b: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [b.subarray(0, 12)]
  let flags = -1 // index of the VP8X flags byte in parts, once copied
  let keptOrientation = false
  for (const c of chunks(b)) {
    if (c.id === 'EXIF') {
      const o = exifOf(b, c)?.orientation ?? 1
      if (o === 1) continue
      const head = Uint8Array.from([0x45, 0x58, 0x49, 0x46, 26, 0, 0, 0]) // "EXIF", size 26
      parts.push(head, orientationTiff(o))
      keptOrientation = true
    } else if (c.id !== 'XMP ' && c.id !== 'C2PA') {
      const copy = b.slice(c.start, c.end)
      if (c.id === 'VP8X' && c.size > 0) flags = parts.length
      parts.push(copy)
    }
  }
  if (flags >= 0) parts[flags][8] &= ~(FLAG_XMP | (keptOrientation ? 0 : FLAG_EXIF))
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  const size = out.length - 8
  out.set([size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, size >>> 24], 4)
  return out
}
