import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { makePng, makeTransparentPng } from './png'
import { PDFDocument } from 'pdf-lib'

// Dismiss the consent banner before any page script runs (it overlays the foot).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('dxl-consent-v1', 'accepted'))
})

const sample = () => ({ name: 'sample.png', mimeType: 'image/png', buffer: makePng(128, 96) })

async function captureDownload(page: Page, click: () => Promise<void>): Promise<Buffer> {
  const waitDownload = page.waitForEvent('download')
  await click()
  const download = await waitDownload
  const path = await download.path()
  return readFileSync(path)
}

test('ImageCompressor outputs a real JPEG from a real PNG', async ({ page }) => {
  await page.goto('/tools/image-compressor/')
  await page.locator('input[type="file"]').setInputFiles(sample())
  await page.getByLabel('Output format').selectOption('image/jpeg')
  await page.getByRole('button', { name: 'Compress', exact: true }).click()
  const bytes = await captureDownload(page, () =>
    page.getByRole('button', { name: 'Download', exact: true }).click(),
  )
  // JPEG SOI marker
  expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xff, 0xd8, 0xff])
  expect(bytes.length).toBeGreaterThan(100)
})

/** Decodes image bytes in the page and returns the RGB of the centre pixel. */
async function centrePixel(page: Page, bytes: Buffer, type: string): Promise<number[]> {
  return page.evaluate(
    async ({ data, type }) => {
      const bmp = await createImageBitmap(new Blob([new Uint8Array(data)], { type }))
      const c = document.createElement('canvas')
      c.width = bmp.width
      c.height = bmp.height
      const ctx = c.getContext('2d')!
      ctx.drawImage(bmp, 0, 0)
      const d = ctx.getImageData(bmp.width >> 1, bmp.height >> 1, 1, 1).data
      return [d[0], d[1], d[2]]
    },
    { data: Array.from(bytes), type },
  )
}

test('ImageCompressor turns transparent areas white, not black, in a JPEG', async ({ page }) => {
  await page.goto('/tools/image-compressor/')
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: makeTransparentPng() })
  await page.getByLabel('Output format').selectOption('image/jpeg')
  await page.getByRole('button', { name: 'Compress', exact: true }).click()
  const bytes = await captureDownload(page, () =>
    page.getByRole('button', { name: 'Download', exact: true }).click(),
  )
  for (const v of await centrePixel(page, bytes, 'image/jpeg')) expect(v).toBeGreaterThan(240)
})

test('ImagesToPdf keeps a rotated phone photo upright and drops its EXIF', async ({ page }) => {
  await page.goto('/tools/images-to-pdf/')
  // A real 40x20 (landscape-pixel) JPEG from the browser's own encoder...
  const plain = Buffer.from(
    await page.evaluate(async () => {
      const c = document.createElement('canvas')
      c.width = 40
      c.height = 20
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#3366cc'
      ctx.fillRect(0, 0, 40, 20)
      const b: Blob = await new Promise((r) => c.toBlob((x) => r(x!), 'image/jpeg', 0.9))
      return Array.from(new Uint8Array(await b.arrayBuffer()))
    }),
  )
  // ...with an EXIF APP1 spliced in: Orientation 6 (rotate 90° CW) plus a GPS-like marker.
  const a = (s: string) => [...s].map((ch) => ch.charCodeAt(0))
  const exif = [...a('Exif'), 0, 0, ...a('II'), 42, 0, 8, 0, 0, 0, 1, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, ...a('GPS-SECRET')]
  const app1 = Buffer.from([0xff, 0xe1, (exif.length + 2) >> 8, (exif.length + 2) & 0xff, ...exif])
  const photo = Buffer.concat([plain.subarray(0, 2), app1, plain.subarray(2)])

  await page.locator('input[type="file"]').setInputFiles({ name: 'phone.jpg', mimeType: 'image/jpeg', buffer: photo })
  const pdf = await captureDownload(page, () => page.getByRole('button', { name: /Create PDF/ }).click())
  expect(pdf.toString('latin1')).not.toContain('GPS-SECRET')
  const doc = await PDFDocument.load(pdf)
  const { width, height } = doc.getPage(0).getSize()
  expect([width, height]).toEqual([20, 40])
})

test('ImageConverter produces genuine WebP bytes', async ({ page }) => {
  await page.goto('/tools/image-converter/')
  await page.locator('input[type="file"]').setInputFiles(sample())
  await page.getByLabel('Convert to').selectOption('image/webp')
  await page.getByRole('button', { name: 'Convert', exact: true }).click()
  const bytes = await captureDownload(page, () =>
    page.getByRole('button', { name: /Download \.webp/ }).click(),
  )
  // RIFF....WEBP container
  expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF')
  expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP')
})

test('ImageResizer outputs a PNG with the exact requested dimensions', async ({ page }) => {
  await page.goto('/tools/image-resizer/')
  await page.locator('input[type="file"]').setInputFiles(sample())
  // lock aspect is on by default: 128×96 → width 64 implies height 48
  await page.getByLabel('Width (px)').fill('64')
  await page.getByRole('button', { name: 'Resize', exact: true }).click()
  const bytes = await captureDownload(page, () =>
    page.getByRole('button', { name: 'Download', exact: true }).click(),
  )
  // PNG signature + IHDR width/height (big-endian at offsets 16/20)
  expect(bytes.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]))
  expect(bytes.readUInt32BE(16)).toBe(64)
  expect(bytes.readUInt32BE(20)).toBe(48)
})

test('FaviconGenerator builds a valid multi-size .ico', async ({ page }) => {
  await page.goto('/tools/favicon-generator/')
  await page.locator('input[type="file"]').setInputFiles(sample())
  const bytes = await captureDownload(page, () =>
    page.getByRole('button', { name: /Download favicon\.ico/ }).click(),
  )
  // ICONDIR: reserved=0, type=1 (icon), count=3 (16/32/48)
  expect([bytes[0], bytes[1], bytes[2], bytes[3]]).toEqual([0, 0, 1, 0])
  expect(bytes.readUInt16LE(4)).toBe(3)
})
