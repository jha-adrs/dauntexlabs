import { describe, it, expect } from 'vitest'
import { jpegOrientation, stripJpegMetadata } from '@/lib/jpeg-meta'

const seg = (marker: number, body: number[]) => {
  const len = body.length + 2
  return [0xff, marker, len >> 8, len & 0xff, ...body]
}
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))

/** EXIF APP1 body with IFD0 holding Orientation and a fake GPS string. */
function exifBody(orientation: number, bigEndian: boolean) {
  const u16 = (v: number) => (bigEndian ? [v >> 8, v & 0xff] : [v & 0xff, v >> 8])
  const u32 = (v: number) =>
    bigEndian ? [v >>> 24, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff] : [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, v >>> 24]
  const tiff = [
    ...(bigEndian ? ascii('MM') : ascii('II')),
    ...u16(42),
    ...u32(8),
    ...u16(1), // one entry
    ...u16(0x0112), ...u16(3), ...u32(1), ...u16(orientation), 0, 0,
    ...u32(0),
    ...ascii('GPS-SECRET-12.97N'),
  ]
  return [...ascii('Exif'), 0, 0, ...tiff]
}

function jpeg(extra: number[][]) {
  return Uint8Array.from([
    0xff, 0xd8,
    ...seg(0xe0, [...ascii('JFIF'), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]),
    ...extra.flat(),
    ...seg(0xdb, [0, ...new Array(64).fill(1)]),
    ...seg(0xc0, [8, 0, 2, 0, 3, 1, 1, 0x11, 0]),
    ...seg(0xda, [1, 1, 0, 0, 63, 0]),
    0x12, 0x34, 0xff, 0x00, 0x56,
    0xff, 0xd9,
  ])
}

const has = (buf: Uint8Array, s: string) => Buffer.from(buf).includes(Buffer.from(s, 'latin1'))

describe('jpegOrientation', () => {
  it('reads orientation from little- and big-endian EXIF', () => {
    expect(jpegOrientation(jpeg([seg(0xe1, exifBody(6, false))]))).toBe(6)
    expect(jpegOrientation(jpeg([seg(0xe1, exifBody(8, true))]))).toBe(8)
  })
  it('returns 1 when there is no EXIF or the bytes are not a JPEG', () => {
    expect(jpegOrientation(jpeg([]))).toBe(1)
    expect(jpegOrientation(Uint8Array.from([1, 2, 3]))).toBe(1)
  })
})

describe('stripJpegMetadata', () => {
  it('removes EXIF, XMP, IPTC and comments but keeps image data', () => {
    const input = jpeg([
      seg(0xe1, exifBody(1, false)),
      seg(0xe1, [...ascii('http://ns.adobe.com/xap/1.0/'), 0, ...ascii('<x:xmpmeta>XMP-SECRET')]),
      seg(0xed, [...ascii('Photoshop 3.0'), 0, ...ascii('IPTC-SECRET')]),
      seg(0xfe, ascii('COMMENT-SECRET')),
    ])
    const out = stripJpegMetadata(input)
    for (const s of ['GPS-SECRET', 'XMP-SECRET', 'IPTC-SECRET', 'COMMENT-SECRET', 'Exif']) expect(has(out, s)).toBe(false)
    expect(Array.from(out)).toEqual(Array.from(jpeg([])))
  })

  it('keeps the ICC colour profile and Adobe APP14 segments', () => {
    const icc = seg(0xe2, [...ascii('ICC_PROFILE'), 0, 1, 1, 9, 9])
    const adobe = seg(0xee, [...ascii('Adobe'), 0, 100, 0, 0, 0, 0, 1])
    const out = stripJpegMetadata(jpeg([icc, adobe, seg(0xe1, exifBody(1, false))]))
    expect(Array.from(out)).toEqual(Array.from(jpeg([icc, adobe])))
  })

  it('throws on input that is not a JPEG', () => {
    expect(() => stripJpegMetadata(Uint8Array.from([0x89, 0x50]))).toThrow()
  })
})
