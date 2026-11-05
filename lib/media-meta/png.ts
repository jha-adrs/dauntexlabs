// Lossless PNG metadata removal: drops the text (tEXt/zTXt/iTXt, incl. XMP), EXIF
// (eXIf) and modification-time (tIME) chunks and copies every other chunk as-is,
// so pixels and colour data (iCCP, gAMA, cHRM, sRGB…) are untouched. Pure bytes.

import { readExif, type ExifSummary } from '@/lib/jpeg-meta'

const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const DROP = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME'])

export type PngMetadata = {
  /** Keywords of tEXt/zTXt/iTXt chunks other than XMP (e.g. Author, Comment). */
  text: string[]
  xmp: boolean
  exif: ExifSummary | null
  time: boolean
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
  const m: PngMetadata = { text: [], xmp: false, exif: null, time: false }
  for (const c of chunks(b)) {
    if (c.type === 'tEXt' || c.type === 'zTXt' || c.type === 'iTXt') {
      const k = keyword(b, c)
      if (k === 'XML:com.adobe.xmp') m.xmp = true
      else m.text.push(k)
    } else if (c.type === 'eXIf') m.exif = readExif(b, c.data, c.end - 4) ?? { gps: false, orientation: 1 }
    else if (c.type === 'tIME') m.time = true
  }
  return m
}

/** Copy of the PNG without metadata chunks. Throws if the bytes are not a PNG. */
export function stripPngMetadata(b: Uint8Array): Uint8Array {
  const kept = chunks(b).filter((c) => !DROP.has(c.type))
  const out = new Uint8Array(8 + kept.reduce((n, c) => n + c.end - c.start, 0))
  out.set(b.subarray(0, 8))
  let o = 8
  for (const c of kept) {
    out.set(b.subarray(c.start, c.end), o)
    o += c.end - c.start
  }
  return out
}
