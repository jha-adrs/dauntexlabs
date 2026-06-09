import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { makePng } from './png'

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
