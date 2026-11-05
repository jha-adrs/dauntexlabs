import { describe, it, expect } from 'vitest'
import { inspectMedia } from '@/lib/media-meta'

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))
const u32 = (v: number) => [v >>> 24, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]

/** JPEG whose EXIF has orientation 6 and a GPS pointer (big-endian TIFF). */
const jpeg = Uint8Array.from([
  0xff, 0xd8,
  0xff, 0xe1, 0, 2 + 6 + 8 + 2 + 2 * 12 + 4, // length bytes + "Exif\0\0" + TIFF header + IFD
  ...ascii('Exif'), 0, 0,
  ...ascii('MM'), 0, 42, 0, 0, 0, 8,
  0, 2,
  0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, 6, 0, 0,
  0x88, 0x25, 0, 4, 0, 0, 0, 1, 0, 0, 0, 0,
  0, 0, 0, 0,
  0xff, 0xda, 0, 2, 1, 0xff, 0xd9,
])

describe('inspectMedia', () => {
  it('lists what a JPEG contains and cleans it, keeping orientation', () => {
    const r = inspectMedia(jpeg)!
    expect(r.format).toBe('JPEG')
    expect(r.mime).toBe('image/jpeg')
    expect(r.items).toContainEqual({ label: 'GPS location', value: 'present' })
    expect(r.items).toContainEqual({ label: 'Orientation', value: 'kept, so the photo stays upright' })
    const out = r.clean()
    expect(inspectMedia(out)!.items).toEqual([{ label: 'Orientation', value: 'kept, so the photo stays upright' }])
  })

  it('recognises PNG, WebP and MP4/MOV by their bytes, not their name', () => {
    expect(inspectMedia(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...u32(0), ...ascii('IEND'), 0, 0, 0, 0]))!.format).toBe('PNG')
    expect(inspectMedia(Uint8Array.from([...ascii('RIFF'), 4, 0, 0, 0, ...ascii('WEBP')]))!.format).toBe('WebP')
    const mp4 = inspectMedia(Uint8Array.from([...u32(16), ...ascii('ftyp'), ...ascii('qt  '), 0, 0, 0, 0]))!
    expect(mp4.format).toBe('MP4 / MOV')
    expect(mp4.items).toEqual([])
  })

  it('returns null for unsupported files', () => {
    expect(inspectMedia(Uint8Array.from(ascii('%PDF-1.7 hello')))).toBeNull()
    expect(inspectMedia(new Uint8Array(0))).toBeNull()
  })
})
