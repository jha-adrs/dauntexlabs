import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { jpegOrientation } from '../../lib/jpeg-meta'

// Real Chromium, real files: a canvas-encoded JPEG and a MediaRecorder MP4, each with
// metadata spliced in from Node. Asserts on the downloaded bytes and that they decode.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('dxl-consent-v1', 'accepted'))
})

async function captureDownload(page: Page, click: () => Promise<void>) {
  const wait = page.waitForEvent('download')
  await click()
  const d = await wait
  return { name: d.suggestedFilename(), bytes: readFileSync(await d.path()) }
}

const MARKER = 'E2EMARKER-7731'

/** EXIF APP1: Make = MARKER (out of line), Orientation = 6, GPS pointer. Big-endian TIFF. */
function exifSegment(): Buffer {
  const make = Buffer.from(MARKER + '\0', 'latin1')
  const tiff = Buffer.alloc(8 + 2 + 3 * 12 + 4)
  tiff.write('MM', 0, 'latin1')
  tiff.writeUInt16BE(42, 2)
  tiff.writeUInt32BE(8, 4)
  tiff.writeUInt16BE(3, 8)
  const entry = (k: number, tag: number, type: number, count: number, value: number, short = false) => {
    const e = 10 + k * 12
    tiff.writeUInt16BE(tag, e)
    tiff.writeUInt16BE(type, e + 2)
    tiff.writeUInt32BE(count, e + 4)
    if (short) tiff.writeUInt16BE(value, e + 8)
    else tiff.writeUInt32BE(value, e + 8)
  }
  entry(0, 0x010f, 2, make.length, tiff.length)
  entry(1, 0x0112, 3, 1, 6, true)
  entry(2, 0x8825, 4, 1, 0)
  const body = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff, make])
  const head = Buffer.from([0xff, 0xe1, 0, 0])
  head.writeUInt16BE(body.length + 2, 2)
  return Buffer.concat([head, body])
}

test('JPEG from the browser canvas: marker removed, orientation 6 kept, still decodes', async ({ page }) => {
  await page.goto('/tools/metadata-remover/')
  const jpeg = Buffer.from(
    await page.evaluate(async () => {
      const c = document.createElement('canvas')
      c.width = 40
      c.height = 20
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#c03'
      ctx.fillRect(0, 0, 20, 20)
      ctx.fillStyle = '#03c'
      ctx.fillRect(20, 0, 20, 20)
      const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), 'image/jpeg', 0.9))
      return Array.from(new Uint8Array(await blob.arrayBuffer()))
    }),
  )
  const input = Buffer.concat([jpeg.subarray(0, 2), exifSegment(), jpeg.subarray(2)])
  expect(jpegOrientation(input)).toBe(6)

  await page.locator('input[type="file"]').setInputFiles({ name: 'photo.jpg', mimeType: 'image/jpeg', buffer: input })
  await expect(page.getByText('GPS location', { exact: true })).toBeVisible()
  await expect(page.getByText(MARKER)).toBeVisible()
  const { name, bytes } = await captureDownload(page, () => page.getByRole('button', { name: 'Download', exact: true }).click())

  expect(name).toBe('photo.jpg')
  expect(bytes.includes(Buffer.from(MARKER))).toBe(false)
  expect(jpegOrientation(bytes)).toBe(6)
  // Decodes, and the browser still applies orientation 6 (40×20 shown as 20×40).
  const size = await page.evaluate(async (data) => {
    const bmp = await createImageBitmap(new Blob([new Uint8Array(data)], { type: 'image/jpeg' }))
    return [bmp.width, bmp.height]
  }, Array.from(bytes))
  expect(size).toEqual([20, 40])
})

/* ---- MP4 ------------------------------------------------------------------ */

type Box = { type: string; start: number; end: number }
function children(b: Buffer, start: number, end: number): Box[] {
  const out: Box[] = []
  for (let i = start; i + 8 <= end; ) {
    const size = b.readUInt32BE(i) || end - i
    out.push({ type: b.toString('latin1', i + 4, i + 8), start: i, end: i + size })
    i += size
  }
  return out
}

function qtString(type: string, s: string) {
  const text = Buffer.from(s, 'latin1')
  const h = Buffer.alloc(12)
  h.writeUInt32BE(12 + text.length, 0)
  Buffer.from(type, 'latin1').copy(h, 4)
  h.writeUInt16BE(text.length, 8)
  return Buffer.concat([h, text])
}

/**
 * Appends a udta (©xyz location + ©mak make) to moov and moves the absolute offsets
 * that follow it (tfhd base_data_offset, tfra moof_offset) so the input stays valid.
 */
function withUserData(rec: Buffer): Buffer {
  const items = Buffer.concat([qtString('©xyz', '+12.9716+077.5946/'), qtString('©mak', MARKER)])
  const udta = Buffer.alloc(8)
  udta.writeUInt32BE(8 + items.length, 0)
  udta.write('udta', 4, 'latin1')
  const add = Buffer.concat([udta, items])
  const moov = children(rec, 0, rec.length).find((x) => x.type === 'moov')!
  const out = Buffer.concat([rec.subarray(0, moov.end), add, rec.subarray(moov.end)])
  out.writeUInt32BE(moov.end - moov.start + add.length, moov.start)
  const n = add.length
  let patched = 0
  for (const top of children(out, 0, out.length)) {
    if (top.type === 'moof')
      for (const traf of children(out, top.start + 8, top.end).filter((x) => x.type === 'traf'))
        for (const tfhd of children(out, traf.start + 8, traf.end).filter((x) => x.type === 'tfhd'))
          if (out[tfhd.start + 11] & 1) {
            const at = tfhd.start + 16
            out.writeBigUInt64BE(out.readBigUInt64BE(at) + BigInt(n), at)
            patched++
          }
    if (top.type === 'mfra')
      for (const tfra of children(out, top.start + 8, top.end).filter((x) => x.type === 'tfra')) {
        const p = tfra.start + 8
        const v1 = out[p] === 1
        const sizes = out[p + 11]
        const tail = ((sizes >> 4) & 3) + ((sizes >> 2) & 3) + (sizes & 3) + 3
        const w = v1 ? 8 : 4
        const count = out.readUInt32BE(p + 12)
        for (let k = 0; k < count; k++) {
          const at = p + 16 + k * (2 * w + tail) + w
          if (v1) out.writeBigUInt64BE(out.readBigUInt64BE(at) + BigInt(n), at)
          else out.writeUInt32BE(out.readUInt32BE(at) + n, at)
          patched++
        }
      }
  }
  return Object.assign(out, { patched })
}

async function canPlay(page: Page, bytes: Buffer) {
  return page.evaluate(async (data) => {
    const v = document.createElement('video')
    v.muted = true
    v.src = URL.createObjectURL(new Blob([new Uint8Array(data)], { type: 'video/mp4' }))
    const ok = await new Promise<boolean>((res) => {
      v.onloadeddata = () => res(true)
      v.onerror = () => res(false)
      setTimeout(() => res(false), 5000)
    })
    const out = { ok, w: v.videoWidth, h: v.videoHeight }
    URL.revokeObjectURL(v.src)
    return out
  }, Array.from(bytes))
}

test('MP4 recorded by MediaRecorder: udta removed, file is byte-identical to the recording and plays', async ({ page }) => {
  await page.goto('/tools/metadata-remover/')
  const recorded = await page.evaluate(async () => {
    if (!MediaRecorder.isTypeSupported('video/mp4')) return null
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 48
    const ctx = c.getContext('2d')!
    let f = 0
    const iv = setInterval(() => {
      ctx.fillStyle = `hsl(${(f += 30) % 360},80%,50%)`
      ctx.fillRect(0, 0, 64, 48)
    }, 30)
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: 'video/mp4' })
    const parts: Blob[] = []
    rec.ondataavailable = (e) => parts.push(e.data)
    const stopped = new Promise((r) => (rec.onstop = r))
    rec.start()
    await new Promise((r) => setTimeout(r, 1000))
    rec.stop()
    await stopped
    clearInterval(iv)
    return Array.from(new Uint8Array(await new Blob(parts).arrayBuffer()))
  })
  // Must really run: our Chromium records MP4. If a future build cannot, fail loudly instead of skipping.
  expect(recorded, 'MediaRecorder in this Chromium cannot record video/mp4, so the MP4 path was not exercised').not.toBeNull()
  const original = Buffer.from(recorded!)
  expect(original.toString('latin1', 4, 8)).toBe('ftyp')
  expect((await canPlay(page, original)).ok).toBe(true)

  const input = withUserData(original)
  expect(input.includes(Buffer.from(MARKER))).toBe(true)
  expect((await canPlay(page, input)).ok).toBe(true)

  await page.locator('input[type="file"]').setInputFiles({ name: 'clip.mp4', mimeType: 'video/mp4', buffer: input })
  await expect(page.getByText('+12.9716+077.5946/')).toBeVisible()
  await expect(page.getByText(MARKER)).toBeVisible()
  const { name, bytes } = await captureDownload(page, () => page.getByRole('button', { name: 'Download', exact: true }).click())

  expect(name).toBe('clip.mp4')
  expect(bytes.includes(Buffer.from(MARKER))).toBe(false)
  expect(bytes.includes(Buffer.from('12.9716'))).toBe(false)
  // Removing exactly what was added (and moving the offsets back) restores the recording.
  expect(bytes.equals(original)).toBe(true)
  const played = await canPlay(page, bytes)
  expect(played).toEqual({ ok: true, w: 64, h: 48 })
})
