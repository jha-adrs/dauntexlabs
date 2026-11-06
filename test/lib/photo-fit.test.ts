import { describe, it, expect, vi } from 'vitest'
import {
  cropRect, byteBounds, fitQuality, padJpeg, setJfifDensity, jfifDensity,
  whiten, targetSize, fitToBounds, checkOutput, DEFAULT_DPI,
} from '@/lib/photo-fit'
import { coverCrop } from '@/lib/stamp'
import { fakeJpeg } from './fake-jpeg'

const blobOf = (n: number) => new Blob([fakeJpeg(Math.max(26, Math.round(n)))], { type: 'image/jpeg' })
const encoder = (size: (q: number) => number) => vi.fn(async (q: number) => blobOf(size(q)))

/** Marker + declared length of every segment before SOS. */
function segments(b: Uint8Array) {
  const out: { marker: number; len: number }[] = []
  let i = 2
  while (i < b.length && b[i] === 0xff && b[i + 1] !== 0xda) {
    const len = (b[i + 2] << 8) | b[i + 3]
    out.push({ marker: b[i + 1], len })
    i += 2 + len
  }
  return out
}

describe('cropRect', () => {
  it('equals coverCrop at zoom 1, centred', () => {
    expect(cropRect(1200, 800, 200, 230, 1, 0, 0)).toEqual(coverCrop(1200, 800, 200, 230))
  })
  it('zooms in and moves to the edges with offsets', () => {
    expect(cropRect(1200, 800, 200, 230, 2, 0, 0)).toEqual({ sx: 426, sy: 200, sw: 348, sh: 400 })
    expect(cropRect(1200, 800, 200, 230, 2, 1, -1)).toEqual({ sx: 852, sy: 0, sw: 348, sh: 400 })
    expect(cropRect(1200, 800, 200, 230, 2, -1, 1)).toEqual({ sx: 0, sy: 400, sw: 348, sh: 400 })
  })
  it('clamps zoom < 1 and offsets outside −1..1', () => {
    expect(cropRect(1200, 800, 200, 230, 0.5, 3, -3)).toEqual(cropRect(1200, 800, 200, 230, 1, 1, -1))
  })
  it('upscales a source smaller than the target', () => {
    expect(cropRect(120, 90, 800, 400, 1, 0, 0)).toEqual({ sx: 0, sy: 15, sw: 120, sh: 60 })
  })
})

describe('byteBounds', () => {
  it('uses 1024 for the floor and 1000 for the ceiling', () => {
    // target = min + 0.85 × (max − min): high quality, still a margin under the ceiling.
    expect(byteBounds([20, 50])).toEqual({ min: 20480, max: 50000, target: 45572 })
  })
  it('falls back to 1000 both ways when the range collapses', () => {
    expect(byteBounds([30, 30])).toEqual({ min: 30000, max: 30000, target: 30000 })
  })
  it('handles a max-only limit', () => {
    expect(byteBounds([0, 20])).toEqual({ min: 0, max: 20000, target: 17000 })
  })
})

describe('fitQuality', () => {
  it('finds the highest quality at or under the target in ≤ 8 encodes', async () => {
    const enc = encoder((q) => 1000 + 100000 * q)
    const r = await fitQuality(enc, byteBounds([20, 50]))
    if ('tooBig' in r) throw new Error('expected a fit')
    expect(r.blob.size).toBeLessThanOrEqual(45572)
    expect(r.quality).toBeGreaterThanOrEqual(0.42)
    expect(enc.mock.calls.length).toBeLessThanOrEqual(8)
  })
  it('keeps q 0.95 when the top-quality file already fits under max, even above the target', async () => {
    const enc = encoder(() => 48000)
    const r = await fitQuality(enc, byteBounds([20, 50]))
    expect(r).toMatchObject({ quality: 0.95 })
    expect(enc).toHaveBeenCalledTimes(1)
  })
  it('returns q 0.95 at once when the file is already small', async () => {
    const enc = encoder(() => 3000)
    const r = await fitQuality(enc, byteBounds([10, 20]))
    expect(r).toMatchObject({ quality: 0.95 })
    expect(enc).toHaveBeenCalledTimes(1)
  })
  it('accepts q 0.30 above the target when it is still under max', async () => {
    const r = await fitQuality(encoder((q) => 45000 + 10000 * q), byteBounds([20, 50]))
    expect(r).toMatchObject({ quality: 0.3 })
  })
  it('reports too big when q 0.30 is over max', async () => {
    expect(await fitQuality(encoder(() => 1e6), byteBounds([20, 50]))).toEqual({ tooBig: true })
  })
})

describe('padJpeg', () => {
  it('pads with COM segments after APP0 and keeps the image data intact', () => {
    const b = fakeJpeg(126)
    const out = padJpeg(b, 20480)
    expect(out.length).toBeGreaterThanOrEqual(20480)
    expect(out.length).toBeLessThanOrEqual(20483)
    expect([out[0], out[1], out[2], out[3]]).toEqual([0xff, 0xd8, 0xff, 0xe0])
    expect([out[20], out[21]]).toEqual([0xff, 0xfe])
    expect([out.at(-2), out.at(-1)]).toEqual([0xff, 0xd9])
    expect(Array.from(out.slice(out.length - (b.length - 20)))).toEqual(Array.from(b.slice(20)))
  })
  it('splits into several segments, none longer than 65535', () => {
    const segs = segments(padJpeg(fakeJpeg(126), 200000)).filter((s) => s.marker === 0xfe)
    expect(segs.length).toBe(4)
    for (const s of segs) expect(s.len).toBeLessThanOrEqual(65535)
  })
  it('returns the same bytes when already big enough', () => {
    const b = fakeJpeg(5000)
    expect(Array.from(padJpeg(b, 4000))).toEqual(Array.from(b))
  })
  it('inserts right after SOI when there is no APP0', () => {
    const noApp0 = Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0x55, 0xff, 0xd9])
    const out = padJpeg(noApp0, 100)
    expect([out[2], out[3]]).toEqual([0xff, 0xfe])
  })
})

describe('setJfifDensity / jfifDensity', () => {
  it('rewrites an existing APP0 without mutating the input', () => {
    const b = fakeJpeg(100)
    const out = setJfifDensity(b, 200)
    expect(out.length).toBe(b.length)
    expect(Array.from(out.slice(13, 18))).toEqual([1, 0, 200, 0, 200])
    expect(jfifDensity(out)).toBe(200)
    expect(b[13]).toBe(0)
  })
  it('inserts an APP0 when missing', () => {
    const noApp0 = Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0x55, 0xff, 0xd9])
    const out = setJfifDensity(noApp0, 300)
    expect(out.length).toBe(noApp0.length + 18)
    expect([out[2], out[3]]).toEqual([0xff, 0xe0])
    expect(jfifDensity(out)).toBe(300)
  })
  it('leaves non-JPEG bytes alone and reads null from them', () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47])
    expect(Array.from(setJfifDensity(png, 200))).toEqual(Array.from(png))
    expect(jfifDensity(png)).toBeNull()
  })
})

describe('whiten', () => {
  const px = () => Uint8ClampedArray.from([225, 225, 225, 255, 40, 40, 40, 255, 250, 180, 180, 255, 230, 230, 230, 128])
  it('does nothing at strength 0', () => {
    const d = px()
    whiten(d, 0)
    expect(Array.from(d)).toEqual(Array.from(px()))
  })
  it('pushes light, grey pixels to white and keeps dark and coloured ones', () => {
    const d = px()
    whiten(d, 50)
    expect(Array.from(d)).toEqual([255, 255, 255, 255, 40, 40, 40, 255, 250, 180, 180, 255, 255, 255, 255, 128])
  })
})

describe('targetSize', () => {
  it('uses fixed px, fixed width, or the source capped at maxSide', () => {
    expect(targetSize({ px: [200, 230] }, 4000, 3000)).toEqual([200, 230])
    expect(targetSize({ width: 450 }, 900, 600)).toEqual([450, 300])
    expect(targetSize({}, 4000, 3000)).toEqual([1000, 750])
    expect(targetSize({}, 640, 480)).toEqual([640, 480])
  })
})

describe('fitToBounds', () => {
  const render = (size: (w: number, h: number, q: number) => number) =>
    vi.fn((w: number, h: number) => async (q: number) => blobOf(size(w, h, q)))

  it('lands in range and writes the DPI', async () => {
    const r = await fitToBounds(render(() => 30000), [200, 230], byteBounds([20, 50]), { fixedPx: true, dpi: 200 })
    if (!r.ok) throw new Error('expected ok')
    expect(r.bytes.length).toBeGreaterThanOrEqual(20480)
    expect(r.bytes.length).toBeLessThanOrEqual(50000)
    expect(jfifDensity(r.bytes)).toBe(200)
    expect(r).toMatchObject({ width: 200, height: 230, padded: false, scaled: false })
  })
  it('pads a file that stays under the minimum at q 0.95', async () => {
    const r = await fitToBounds(render(() => 2000), [200, 230], byteBounds([20, 50]), { fixedPx: true, dpi: 200 })
    expect(r).toMatchObject({ ok: true, padded: true })
    if (r.ok) expect(r.bytes.length).toBeGreaterThanOrEqual(20480)
  })
  it('fails for fixed px that cannot get under max', async () => {
    const rd = render(() => 1e6)
    expect(await fitToBounds(rd, [200, 230], byteBounds([20, 50]), { fixedPx: true, dpi: 200 })).toEqual({ ok: false, reason: 'too-big' })
    expect(rd).toHaveBeenCalledTimes(1)
  })
  it('scales free-size output down by 0.85 per step until it fits', async () => {
    const r = await fitToBounds(render((w, h, q) => w * h * (0.2 + q) * 0.1), [1000, 750], byteBounds([5, 10]), { fixedPx: false, dpi: 200 })
    if (!r.ok) throw new Error('expected ok')
    expect(r.scaled).toBe(true)
    expect(r.width).toBeLessThan(1000)
    expect(r.width / r.height).toBeCloseTo(4 / 3, 1)
    expect(r.bytes.length).toBeLessThanOrEqual(10000)
  })
  it('counts the inserted JFIF header against the maximum', async () => {
    // Encoder output without APP0: setJfifDensity adds 18 bytes, which must not push it over max.
    const noApp0 = (n: number) => {
      const b = new Uint8Array(n)
      b.set([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02])
      b.fill(0x55, 6, n - 2)
      b.set([0xff, 0xd9], n - 2)
      return new Blob([b], { type: 'image/jpeg' })
    }
    const rd = vi.fn(() => async (q: number) => noApp0(q >= 0.9 ? 9995 : 5000))
    const r = await fitToBounds(rd, [200, 230], byteBounds([0, 10]), { fixedPx: true, dpi: 200 })
    if (!r.ok) throw new Error('expected ok')
    expect(r.bytes.length).toBeLessThanOrEqual(10000)
    expect(jfifDensity(r.bytes)).toBe(200)
  })
  it('gives up after 6 scale steps', async () => {
    const rd = render(() => 1e7)
    expect(await fitToBounds(rd, [1000, 750], byteBounds([5, 10]), { fixedPx: false, dpi: 200 })).toEqual({ ok: false, reason: 'too-big' })
    expect(rd).toHaveBeenCalledTimes(7)
  })
})

describe('checkOutput', () => {
  it('passes all four checks for a good file', () => {
    const bytes = setJfifDensity(fakeJpeg(30000), 200)
    const c = checkOutput(bytes, 200, 230, { px: [200, 230], kb: [20, 50] })
    expect(c.map((x) => [x.key, x.ok])).toEqual([['px', true], ['kb', true], ['jpg', true], ['dpi', true]])
    expect(c.find((x) => x.key === 'kb')!.text).toMatch(/KB/)
  })
  it('flags wrong pixels, size and DPI', () => {
    const c = checkOutput(fakeJpeg(60000), 201, 230, { px: [200, 230], kb: [20, 50], dpi: 300 })
    expect(c.filter((x) => !x.ok).map((x) => x.key)).toEqual(['px', 'kb', 'dpi'])
  })
  it('uses DEFAULT_DPI when the upload sets none', () => {
    const c = checkOutput(setJfifDensity(fakeJpeg(30000), DEFAULT_DPI), 640, 480, { kb: [20, 50] })
    expect(c.every((x) => x.ok)).toBe(true)
  })
})
