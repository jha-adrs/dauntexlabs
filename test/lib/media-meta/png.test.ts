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
    })
  })
  it('reports nothing for a clean PNG', () => {
    expect(pngMetadata(png([]))).toEqual({ text: [], xmp: false, exif: null, time: false })
  })
})
