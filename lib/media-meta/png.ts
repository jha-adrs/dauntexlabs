// Lossless PNG metadata removal: drops the text (tEXt/zTXt/iTXt, incl. XMP), EXIF
// (eXIf), modification-time (tIME) and C2PA (caBX) chunks and copies every other
// chunk as-is, so pixels and colour data (iCCP, gAMA, cHRM, sRGB…) are untouched.
// A non-default EXIF orientation is written back as a minimal eXIf. Pure bytes.

import { readExif, orientationTiff, type ExifSummary } from '@/lib/jpeg-meta'

const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const DROP = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME', 'caBX'])

export type PngMetadata = {
  /** Keywords of tEXt/zTXt/iTXt chunks other than XMP (e.g. Author, Comment). */
  text: string[]
  xmp: boolean
  exif: ExifSummary | null
  time: boolean
  /** C2PA content credentials (caBX chunk). */
  c2pa: boolean
}

type Chunk = { type: string; start: number; data: number; end: number }

function chunks(b: Uint8Array): Chunk[] {
  if (b.length < 8 || SIG.some((v, i) => b[i] !== v)) throw new Error('Not a PNG')
  const out: Chunk[] = []
  let i = 8
  while (i < b.length) {
    if (i + 12 > b.length) throw new Error('Corrupt PNG')
    const len = ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3]
    const end = i + 12 + len
    if (end > b.length) throw new Error('Corrupt PNG')
    const type = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7])
    out.push({ type, start: i, data: i + 8, end })
    i = end
    if (type === 'IEND') break
  }
  return out
}

function keyword(b: Uint8Array, c: Chunk) {
  let s = ''
  for (let i = c.data; i < Math.min(c.end - 4, c.data + 79) && b[i] !== 0; i++) s += String.fromCharCode(b[i])
  return s
}

/** What metadata a PNG carries. Throws if the bytes are not a PNG. */
export function pngMetadata(b: Uint8Array): PngMetadata {
  const m: PngMetadata = { text: [], xmp: false, exif: null, time: false, c2pa: false }
  for (const c of chunks(b)) {
    if (c.type === 'tEXt' || c.type === 'zTXt' || c.type === 'iTXt') {
      const k = keyword(b, c)
      if (k === 'XML:com.adobe.xmp') m.xmp = true
      else m.text.push(k)
    } else if (c.type === 'eXIf') m.exif = readExif(b, c.data, c.end - 4) ?? { gps: false, orientation: 1 }
    else if (c.type === 'tIME') m.time = true
    else if (c.type === 'caBX') m.c2pa = true
  }
  return m
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

/** A PNG chunk (length, type, data, CRC). */
function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const dv = new DataView(out.buffer)
  dv.setUint32(0, data.length)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  let c = 0xffffffff
  for (let i = 4; i < 8 + data.length; i++) c = CRC_TABLE[(c ^ out[i]) & 0xff] ^ (c >>> 8)
  dv.setUint32(8 + data.length, (c ^ 0xffffffff) >>> 0)
  return out
}

/** Copy of the PNG without metadata chunks. Throws if the bytes are not a PNG. */
export function stripPngMetadata(b: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [b.subarray(0, 8)]
  for (const c of chunks(b)) {
    if (c.type === 'eXIf') {
      const o = readExif(b, c.data, c.end - 4)?.orientation ?? 1
      if (o !== 1) parts.push(makeChunk('eXIf', orientationTiff(o)))
    } else if (!DROP.has(c.type)) parts.push(b.subarray(c.start, c.end))
  }
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}
