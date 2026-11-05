import { describe, it, expect } from 'vitest'
import { pngMetadata, stripPngMetadata } from '@/lib/media-meta/png'

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))
const u32 = (v: number) => [v >>> 24, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
// CRC is not checked by the stripper, so a fixed fake one keeps fixtures short.
const chunk = (type: string, data: number[]) => [...u32(data.length), ...ascii(type), ...data, 1, 2, 3, 4]

const IHDR = chunk('IHDR', [0, 0, 0, 2, 0, 0, 0, 2, 8, 2, 0, 0, 0])
const ICCP = chunk('iCCP', [...ascii('icc'), 0, 0, 9, 9, 9])
const GAMA = chunk('gAMA', u32(45455))
const IDAT = chunk('IDAT', [0x78, 0x9c, 1, 2, 3])
const IEND = chunk('IEND', [])

/** Little-endian TIFF with Make + a GPS pointer. */
const tiff = [
  ...ascii('II'), 42, 0, 8, 0, 0, 0,
  2, 0,
  0x0f, 0x01, 2, 0, 4, 0, 0, 0, ...ascii('ACM'), 0,
  0x25, 0x88, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0,
]

const png = (extra: number[][]) => Uint8Array.from([...SIG, ...IHDR, ...ICCP, ...extra.flat(), ...GAMA, ...IDAT, ...IEND])
const has = (buf: Uint8Array, s: string) => Buffer.from(buf).includes(Buffer.from(s, 'latin1'))

const META = [
  chunk('tEXt', [...ascii('Author'), 0, ...ascii('TEXT-SECRET')]),
  chunk('zTXt', [...ascii('Comment'), 0, 0, 0x78, 0x9c, ...ascii('ZTXT-SECRET')]),
  chunk('iTXt', [...ascii('XML:com.adobe.xmp'), 0, 0, 0, 0, 0, ...ascii('<x:xmpmeta>XMP-SECRET')]),
  chunk('eXIf', tiff),
  chunk('tIME', [7, 234, 1, 2, 3, 4, 5]),
]

describe('stripPngMetadata', () => {
  it('drops tEXt, zTXt, iTXt, eXIf and tIME and keeps every other chunk byte-for-byte', () => {
    const out = stripPngMetadata(png(META))
    for (const s of ['TEXT-SECRET', 'ZTXT-SECRET', 'XMP-SECRET', 'ACM', 'tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME']) expect(has(out, s), s).toBe(false)
    expect(Array.from(out)).toEqual(Array.from(png([])))
  })

  it('keeps iCCP and gAMA colour chunks', () => {
    const out = stripPngMetadata(png(META))
    expect(has(out, 'iCCP')).toBe(true)
    expect(has(out, 'gAMA')).toBe(true)
  })

  it('rejects a bad signature or a truncated chunk', () => {
    expect(() => stripPngMetadata(Uint8Array.from([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0]))).toThrow(/PNG/)
    const truncated = png([]).subarray(0, 8 + IHDR.length + 5)
    expect(() => stripPngMetadata(truncated)).toThrow()
  })
})

describe('pngMetadata', () => {
  it('reports text keywords, XMP, EXIF (with GPS and make) and the time chunk', () => {
    expect(pngMetadata(png(META))).toEqual({
      text: ['Author', 'Comment'],
      xmp: true,
      exif: { gps: true, orientation: 1, make: 'ACM' },
      time: true,
      c2pa: false,
    })
  })
  it('reports nothing for a clean PNG', () => {
    expect(pngMetadata(png([]))).toEqual({ text: [], xmp: false, exif: null, time: false, c2pa: false })
  })
})

const crc32 = (bytes: number[]) => {
  let c = 0xffffffff
  for (const x of bytes) {
    c ^= x
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return (c ^ 0xffffffff) >>> 0
}

describe('C2PA and orientation', () => {
  it('drops a caBX (C2PA content credentials) chunk and reports it', () => {
    const input = png([chunk('caBX', ascii('C2PA-SECRET'))])
    expect(pngMetadata(input).c2pa).toBe(true)
    expect(Array.from(stripPngMetadata(input))).toEqual(Array.from(png([])))
  })

  it('keeps a non-default orientation as a minimal eXIf chunk with a valid CRC, before IDAT', () => {
    const rotated = [...ascii('MM'), 0, 42, 0, 0, 0, 8, 0, 2,
      0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, 6, 0, 0,
      0x88, 0x25, 0, 4, 0, 0, 0, 1, 0, 0, 0, 0,
      0, 0, 0, 0, ...ascii('GPS-SECRET')]
    const out = stripPngMetadata(png([chunk('eXIf', rotated)]))
    expect(has(out, 'GPS-SECRET')).toBe(false)
    expect(pngMetadata(out).exif).toEqual({ gps: false, orientation: 6 })
    const at = Buffer.from(out).indexOf('eXIf') - 4
    const len = Buffer.from(out).readUInt32BE(at)
    expect(len).toBe(26)
    const typeAndData = Array.from(out.subarray(at + 4, at + 8 + len))
    expect(Buffer.from(out).readUInt32BE(at + 8 + len)).toBe(crc32(typeAndData))
    expect(at).toBeLessThan(Buffer.from(out).indexOf('IDAT'))
  })
})
