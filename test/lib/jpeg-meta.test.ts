import { describe, it, expect } from 'vitest'
import { jpegOrientation, stripJpegMetadata, jpegMetadataSummary } from '@/lib/jpeg-meta'

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

/** A TIFF block (little-endian) with IFD0 + an Exif sub-IFD + an empty GPS IFD; strings stored out of line. */
function richTiff() {
  const u16 = (v: number) => [v & 0xff, v >> 8]
  const u32 = (v: number) => [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, v >>> 24]
  const str = (s: string) => [...ascii(s), 0]
  const ifd0Tags: [number, number[]][] = [
    [0x010f, str('CANARY-MAKE')],
    [0x0110, str('CANARY-MODEL')],
    [0x0131, str('CANARY-SOFT')],
    [0x0132, str('2026:01:02 03:04:05')],
  ]
  // layout: header(8) | IFD0 | ExifIFD (1 entry) | GPS IFD (0 entries) | string data
  const n0 = ifd0Tags.length + 3 // + orientation, ExifIFD pointer, GPS pointer
  const ifd0 = 8
  const exifIfd = ifd0 + 2 + n0 * 12 + 4
  const gpsIfd = exifIfd + 2 + 12 + 4
  const data = gpsIfd + 2 + 4
  const blobs: number[] = []
  const entries: number[] = []
  const put = (bytes: number[]) => {
    const at = data + blobs.length
    blobs.push(...bytes)
    return at
  }
  for (const [tag, bytes] of ifd0Tags) entries.push(...u16(tag), ...u16(2), ...u32(bytes.length), ...u32(put(bytes)))
  entries.push(...u16(0x0112), ...u16(3), ...u32(1), ...u16(6), 0, 0)
  entries.push(...u16(0x8769), ...u16(4), ...u32(1), ...u32(exifIfd))
  entries.push(...u16(0x8825), ...u16(4), ...u32(1), ...u32(gpsIfd))
  const original = put(str('2025:12:31 23:59:58'))
  return [
    ...ascii('II'), ...u16(42), ...u32(ifd0),
    ...u16(n0), ...entries, ...u32(0),
    ...u16(1), ...u16(0x9003), ...u16(2), ...u32(20), ...u32(original), ...u32(0),
    ...u16(0), ...u32(0),
    ...blobs,
  ]
}

describe('jpegMetadataSummary', () => {
  it('reports GPS, make, model, dates, software and orientation from EXIF', () => {
    const s = jpegMetadataSummary(jpeg([seg(0xe1, [...ascii('Exif'), 0, 0, ...richTiff()])]))
    expect(s.exif).toEqual({
      gps: true,
      make: 'CANARY-MAKE',
      model: 'CANARY-MODEL',
      software: 'CANARY-SOFT',
      dateTime: '2026:01:02 03:04:05',
      dateTimeOriginal: '2025:12:31 23:59:58',
      orientation: 6,
    })
    expect(s).toMatchObject({ xmp: false, iptc: false, comment: false })
  })

  it('reports XMP, IPTC and comment segments, and no EXIF when absent', () => {
    const s = jpegMetadataSummary(
      jpeg([
        seg(0xe1, [...ascii('http://ns.adobe.com/xap/1.0/'), 0, ...ascii('<x/>')]),
        seg(0xed, [...ascii('Photoshop 3.0'), 0, 1]),
        seg(0xfe, ascii('hi')),
      ]),
    )
    expect(s).toEqual({ exif: null, xmp: true, iptc: true, comment: true, other: false, trailer: false })
  })

  it('flags other application segments (e.g. maker APPn) as other', () => {
    expect(jpegMetadataSummary(jpeg([seg(0xe5, [1, 2, 3])])).other).toBe(true)
    expect(jpegMetadataSummary(jpeg([])).other).toBe(false)
  })
})

describe('stripJpegMetadata keepOrientation', () => {
  it('re-inserts a minimal EXIF with only the orientation, right after APP0', () => {
    const input = jpeg([seg(0xe1, [...ascii('Exif'), 0, 0, ...richTiff()])])
    const out = stripJpegMetadata(input, { keepOrientation: true })
    expect(jpegOrientation(out)).toBe(6)
    for (const s of ['CANARY', '2026:01', '2025:12']) expect(has(out, s)).toBe(false)
    expect(jpegMetadataSummary(out).exif).toEqual({ gps: false, orientation: 6 })
    // APP0 stays first, the new APP1 follows it, then the rest is untouched.
    const base = Array.from(jpeg([]))
    const app0End = 2 + 4 + 14 // SOI + marker/length + JFIF body
    expect(Array.from(out.subarray(0, app0End))).toEqual(base.slice(0, app0End))
    expect([out[app0End], out[app0End + 1]]).toEqual([0xff, 0xe1])
    const app1Len = (out[app0End + 2] << 8) | out[app0End + 3]
    expect(Array.from(out.subarray(app0End + 2 + app1Len))).toEqual(base.slice(app0End))
  })

  it('adds nothing when the orientation is already 1 (or missing)', () => {
    const plain = Array.from(jpeg([]))
    expect(Array.from(stripJpegMetadata(jpeg([seg(0xe1, exifBody(1, true))]), { keepOrientation: true }))).toEqual(plain)
    expect(Array.from(stripJpegMetadata(jpeg([]), { keepOrientation: true }))).toEqual(plain)
  })

  it('inserts right after SOI when there is no APP0', () => {
    const noApp0 = Uint8Array.from([0xff, 0xd8, ...seg(0xe1, exifBody(8, false)), ...seg(0xda, [0]), 1, 0xff, 0xd9])
    const out = stripJpegMetadata(noApp0, { keepOrientation: true })
    expect([out[2], out[3]]).toEqual([0xff, 0xe1])
    expect(jpegOrientation(out)).toBe(8)
  })
})

describe('data after the primary image', () => {
  const exifText = (txt: string) => seg(0xe1, [...ascii('Exif'), 0, 0, ...ascii('MM'), 0, 42, 0, 0, 0, 8, 0, 0, ...ascii(txt)])

  it('cuts MPF images, maker trailers and motion-photo videos after the primary EOI', () => {
    const primary = jpeg([exifText('PRIMARYGPS')])
    const second = jpeg([exifText('TRAILERGPS')])
    const motion = [0, 0, 0, 24, ...ascii('ftypmp42'), ...ascii('MOTIONGPS-SECRET')]
    const input = Uint8Array.from([...primary, ...second, ...motion])
    const out = stripJpegMetadata(input)
    for (const s of ['PRIMARYGPS', 'TRAILERGPS', 'MOTIONGPS']) expect(has(out, s), s).toBe(false)
    expect(Array.from(out)).toEqual(Array.from(jpeg([])))
    expect(jpegMetadataSummary(input).trailer).toBe(true)
    expect(jpegMetadataSummary(primary).trailer).toBe(false)
  })

  it('treats FF00 stuffing and RST markers as scan data, and drops APPn/COM between progressive scans', () => {
    const scan = (n: number) => [...seg(0xda, [1, 1, 0, 0, 63, 0]), n, 0xff, 0x00, 7, 0xff, 0xd3, 8, 0xff, 0xff, 0xd4, 9]
    const head = [0xff, 0xd8, ...seg(0xe0, [...ascii('JFIF'), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]), ...seg(0xc2, [8, 0, 2, 0, 3, 1, 1, 0x11, 0])]
    const dht = seg(0xc4, [0, 1, 2, 3])
    const input = Uint8Array.from([
      ...head, ...scan(1),
      ...exifText('MIDSECRET'), ...seg(0xfe, ascii('MIDCOMMENT')), ...dht,
      ...scan(2), 0xff, 0xd9,
    ])
    const out = stripJpegMetadata(input)
    expect(has(out, 'MIDSECRET')).toBe(false)
    expect(has(out, 'MIDCOMMENT')).toBe(false)
    expect(Array.from(out)).toEqual([...head, ...scan(1), ...dht, ...scan(2), 0xff, 0xd9])
    expect(jpegMetadataSummary(input)).toMatchObject({ comment: true, trailer: false })
    expect(jpegMetadataSummary(input).exif).not.toBeNull()
  })

  it('still copies a truncated file (no EOI) to its end', () => {
    const cut = jpeg([]).subarray(0, -2)
    expect(Array.from(stripJpegMetadata(cut))).toEqual(Array.from(cut))
  })
})

describe('APP0', () => {
  const jfif = (thumb: number[], tw = 0, th = 0) => seg(0xe0, [...ascii('JFIF'), 0, 1, 1, 0, 0, 1, 0, 1, tw, th, ...thumb])
  const rest = [...seg(0xdb, [0, 1]), ...seg(0xda, [1, 1, 0, 0, 63, 0]), 5, 0xff, 0xd9]

  it('drops the JFIF thumbnail and fixes the segment length', () => {
    const input = Uint8Array.from([0xff, 0xd8, ...jfif(new Array(2 * 1 * 3).fill(0x77), 2, 1), ...rest])
    const out = stripJpegMetadata(input)
    expect(Array.from(out)).toEqual([0xff, 0xd8, ...jfif([]), ...rest])
    expect(jpegMetadataSummary(input).other).toBe(true)
  })

  it('drops JFXX and other APP0 segments', () => {
    const jfxx = seg(0xe0, [...ascii('JFXX'), 0, 0x10, 0xff, 0xd8, ...ascii('THUMB')])
    const vendor = seg(0xe0, ascii('VENDORDATA'))
    const out = stripJpegMetadata(Uint8Array.from([0xff, 0xd8, ...jfif([]), ...jfxx, ...vendor, ...rest]))
    expect(Array.from(out)).toEqual([0xff, 0xd8, ...jfif([]), ...rest])
  })
})
