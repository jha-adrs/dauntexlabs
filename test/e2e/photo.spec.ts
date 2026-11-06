import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { makePng, makeTransparentPng } from './png'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('dxl-consent-v1', 'accepted'))
})

/** Width/height from SOF0–2 and JFIF units/density from APP0. */
function jpegInfo(b: Buffer) {
  const info = { width: 0, height: 0, units: -1, density: -1 }
  let i = 2
  while (i < b.length && b[i] === 0xff && b[i + 1] !== 0xda) {
    const m = b[i + 1]
    const len = b.readUInt16BE(i + 2)
    if (m >= 0xc0 && m <= 0xc2) { info.height = b.readUInt16BE(i + 5); info.width = b.readUInt16BE(i + 7) }
    if (m === 0xe0 && b.toString('latin1', i + 4, i + 8) === 'JFIF') { info.units = b[i + 11]; info.density = b.readUInt16BE(i + 12) }
    i += 2 + len
  }
  return info
}

async function make(page: Page, region: string, file: { name: string; mimeType: string; buffer: Buffer }) {
  const r = page.getByRole('region', { name: region, exact: true })
  await r.locator('input[type="file"]').setInputFiles(file)
  await r.getByRole('button', { name: 'Make file', exact: true }).click()
  await expect(r.getByRole('list', { name: 'Checks' })).toBeVisible()
  const wait = page.waitForEvent('download')
  await r.getByRole('button', { name: /^Download / }).click()
  return readFileSync(await (await wait).path())
}

const png = (w: number, h: number) => ({ name: 'in.png', mimeType: 'image/png', buffer: makePng(w, h) })

test('IBPS: every file has exact pixels, an in-range size and 200 DPI', async ({ page }) => {
  await page.goto('/photo/ibps-photo-signature-size/')
  const cases: [string, number, number, number, number][] = [
    ['Photo', 200, 230, 20, 50],
    ['Signature', 140, 60, 10, 20],
    ['Left thumb impression', 240, 240, 20, 50],
    ['Handwritten declaration', 800, 400, 50, 100],
  ]
  for (const [region, w, h, minKb, maxKb] of cases) {
    const bytes = await make(page, region, png(800, 600))
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xff, 0xd8, 0xff])
    expect(jpegInfo(bytes)).toEqual({ width: w, height: h, units: 1, density: 200 })
    expect(bytes.length).toBeGreaterThanOrEqual(minKb * 1024)
    expect(bytes.length).toBeLessThanOrEqual(maxKb * 1000)
  }
})

test('increase-image-size-in-kb: a tiny input comes out above the minimum and still decodes', async ({ page }) => {
  await page.goto('/photo/increase-image-size-in-kb/')
  const bytes = await make(page, 'Photo', png(40, 30))
  expect(bytes.length).toBeGreaterThanOrEqual(50 * 1024)
  const dims = await page.evaluate(async (data) => {
    const bmp = await createImageBitmap(new Blob([new Uint8Array(data)], { type: 'image/jpeg' }))
    return [bmp.width, bmp.height]
  }, Array.from(bytes))
  expect(dims).toEqual([40, 30])
})

test('resize-image-to-20kb: a large photo lands in 10–20 KB', async ({ page }) => {
  await page.goto('/photo/resize-image-to-20kb/')
  const bytes = await make(page, 'Photo', png(1600, 1200))
  expect(bytes.length).toBeGreaterThanOrEqual(10 * 1024)
  expect(bytes.length).toBeLessThanOrEqual(20000)
})

test('a transparent PNG signature gets a white background', async ({ page }) => {
  await page.goto('/photo/ssc-signature-size/')
  const bytes = await make(page, 'Signature', { name: 's.png', mimeType: 'image/png', buffer: makeTransparentPng(280, 120) })
  const rgb = await page.evaluate(async (data) => {
    const bmp = await createImageBitmap(new Blob([new Uint8Array(data)], { type: 'image/jpeg' }))
    const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height
    const ctx = c.getContext('2d')!; ctx.drawImage(bmp, 0, 0)
    return Array.from(ctx.getImageData(bmp.width >> 1, bmp.height >> 1, 1, 1).data.slice(0, 3))
  }, Array.from(bytes))
  for (const v of rgb) expect(v).toBeGreaterThan(240)
})
