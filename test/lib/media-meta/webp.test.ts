import { describe, it, expect } from 'vitest'
import { webpMetadata, stripWebpMetadata } from '@/lib/media-meta/webp'

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))
const le32 = (v: number) => [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, v >>> 24]
const chunk = (id: string, data: number[]) => [...ascii(id), ...le32(data.length), ...data, ...(data.length & 1 ? [0] : [])]
const riff = (chunks: number[][]) => {
  const body = [...ascii('WEBP'), ...chunks.flat()]
  return Uint8Array.from([...ascii('RIFF'), ...le32(body.length), ...body])
}
const vp8x = (flags: number) => chunk('VP8X', [flags, 0, 0, 0, 9, 0, 0, 9, 0, 0])

const ICCP = chunk('ICCP', [1, 2, 3, 4])
const VP8 = chunk('VP8 ', [0x9d, 0x01, 0x2a, 7, 7]) // odd length: padded
/** EXIF payload as some writers store it: "Exif\0\0" + big-endian TIFF with Model + GPS. */
const EXIF = chunk('EXIF', [
  ...ascii('Exif'), 0, 0,
  ...ascii('MM'), 0, 42, 0, 0, 0, 8,
  0, 2,
  0x01, 0x10, 0, 2, 0, 0, 0, 4, ...ascii('CAM'), 0,
  0x88, 0x25, 0, 4, 0, 0, 0, 1, 0, 0, 0, 0,
  0, 0, 0, 0,
  ...ascii('EXIF-SECRET'),
])
const XMP = chunk('XMP ', ascii('<x:xmpmeta>XMP-SECRET</x:xmpmeta>'))

const has = (buf: Uint8Array, s: string) => Buffer.from(buf).includes(Buffer.from(s, 'latin1'))
const riffSize = (b: Uint8Array) => b[4] | (b[5] << 8) | (b[6] << 16) | (b[7] << 24)

describe('stripWebpMetadata', () => {
  it('drops EXIF and XMP chunks, clears their VP8X flags, keeps ICCP and fixes the RIFF size', () => {
    const input = riff([vp8x(0x20 | 0x08 | 0x04), ICCP, VP8, EXIF, XMP])
    const out = stripWebpMetadata(input)
    for (const s of ['EXIF-SECRET', 'XMP-SECRET', 'CAM']) expect(has(out, s), s).toBe(false)
    expect(Array.from(out)).toEqual(Array.from(riff([vp8x(0x20), ICCP, VP8])))
    expect(riffSize(out)).toBe(out.length - 8)
  })

  it('keeps alpha and animation flags', () => {
    const out = stripWebpMetadata(riff([vp8x(0x10 | 0x02 | 0x08), VP8, EXIF]))
    expect(out[20]).toBe(0x12)
  })

  it('returns simple (VP8/VP8L) files unchanged', () => {
    const simple = riff([chunk('VP8L', [0x2f, 1, 2, 3])])
    expect(Array.from(stripWebpMetadata(simple))).toEqual(Array.from(simple))
  })

  it('rejects input that is not a WebP or has a truncated chunk', () => {
    expect(() => stripWebpMetadata(Uint8Array.from(ascii('RIFF\0\0\0\0WAVE')))).toThrow(/WebP/)
    const cut = riff([vp8x(0), VP8]).subarray(0, 30)
    expect(() => stripWebpMetadata(cut)).toThrow()
  })
})

describe('webpMetadata', () => {
  it('reports EXIF (model, GPS) and XMP', () => {
    expect(webpMetadata(riff([vp8x(0x0c), VP8, EXIF, XMP]))).toEqual({
      exif: { gps: true, orientation: 1, model: 'CAM' },
      xmp: true,
      c2pa: false,
    })
  })
  it('reports nothing for a simple file', () => {
    expect(webpMetadata(riff([VP8]))).toEqual({ exif: null, xmp: false, c2pa: false })
  })
})

describe('C2PA and orientation', () => {
  it('drops a C2PA chunk and reports it', () => {
    const input = riff([vp8x(0x20), ICCP, VP8, chunk('C2PA', ascii('C2PA-SECRET'))])
    expect(webpMetadata(input).c2pa).toBe(true)
    expect(Array.from(stripWebpMetadata(input))).toEqual(Array.from(riff([vp8x(0x20), ICCP, VP8])))
  })

  it('keeps a non-default orientation as a minimal EXIF chunk and keeps the EXIF flag', () => {
    const rotated = chunk('EXIF', [
      ...ascii('II'), 42, 0, 8, 0, 0, 0, 2, 0,
      0x12, 0x01, 3, 0, 1, 0, 0, 0, 8, 0, 0, 0,
      0x25, 0x88, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, ...ascii('GPS-SECRET'),
    ])
    const out = stripWebpMetadata(riff([vp8x(0x08 | 0x04), VP8, rotated, XMP]))
    expect(has(out, 'GPS-SECRET')).toBe(false)
    expect(out[20]).toBe(0x08)
    expect(webpMetadata(out)).toEqual({ exif: { gps: false, orientation: 8 }, xmp: false, c2pa: false })
    expect(riffSize(out)).toBe(out.length - 8)
  })
})
