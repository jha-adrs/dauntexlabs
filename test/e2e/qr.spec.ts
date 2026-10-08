import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { STATIC, applySiteHeaders, dismissConsent } from './headers'
import { makePng } from './png'

// Scannability of the shipped QR designer: the SVG the real UI renders (and the PNG it
// downloads) is rasterised in Chromium and decoded with jsQR, which must give back the input.
// The decoder is injected as an init script (not subject to the page CSP) and runs in-page.

const PAGE = `${STATIC}/tools/qr-code-generator/`
const URL_TEXT = 'https://dauntexlabs.com/qr-e2e?ref=print'
const LONG_TEXT =
  'Table 7 menu: masala chai, filter coffee, idli and vada. Ask for the Wi-Fi password at the counter. Thanks for visiting!'
const PX = 512

const PRESETS = ['Classic', 'Soft green', 'Dots', 'Fluid', 'Classy', 'Scan me badge']
const MODULES = ['square', 'rounded', 'dots', 'classy', 'diamond', 'vbars', 'hbars', 'fluid']
// Must match EYE_BALLS_FOR in lib/qr/render-svg.ts (UI labels).
const PAIRS: [string, string][] = [
  ['Square', 'Square'],
  ['Rounded', 'Rounded'],
  ['Circle', 'Circle'],
  ['Leaf', 'Rounded'],
  ['Leaf', 'Circle'],
]

const JSQR = readFileSync('node_modules/jsqr/dist/jsQR.js', 'utf8')
const HELPERS = `
window.__qrDecodeUrl = async (src) => {
  const img = new Image()
  img.src = src
  await img.decode()
  const w = ${PX}, h = Math.round(${PX} * img.naturalHeight / img.naturalWidth)
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h)
  const r = jsQR(ctx.getImageData(0, 0, w, h).data, w, h)
  return r ? r.data : null
}
window.__qrDecodePreview = async () => {
  const svg = document.querySelector('[aria-label="QR code preview"] svg')
  if (!svg) return null
  const [, , vw, vh] = svg.getAttribute('viewBox').split(/\\s+/).map(Number)
  const clone = svg.cloneNode(true)
  clone.setAttribute('width', String(${PX})); clone.setAttribute('height', String(Math.round(${PX} * vh / vw)))
  const markup = new XMLSerializer().serializeToString(clone)
  return window.__qrDecodeUrl('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup))
}
`

type Win = { __qrDecodePreview(): Promise<string | null>; __qrDecodeUrl(src: string): Promise<string | null> }

async function open(page: Page, text = URL_TEXT) {
  await applySiteHeaders(page)
  await dismissConsent(page)
  await page.addInitScript({ content: JSQR + HELPERS })
  await page.goto(PAGE)
  if (text === URL_TEXT) {
    await page.getByLabel('Link', { exact: true }).fill(text)
  } else {
    await page.getByLabel('Content').selectOption('text')
    await page.getByLabel('Text', { exact: true }).fill(text)
  }
  await expect(page.getByRole('img', { name: 'QR code preview' })).toBeVisible()
}

const previewHtml = (page: Page) => page.getByRole('img', { name: 'QR code preview' }).innerHTML()
const decodePreview = (page: Page) => page.evaluate(() => (window as unknown as Win).__qrDecodePreview())

/** Run `change`, then wait until the preview markup differs from before. */
async function changed(page: Page, change: () => Promise<unknown>) {
  const before = await previewHtml(page)
  await change()
  await expect.poll(() => previewHtml(page)).not.toBe(before)
}

const group = (page: Page, label: string) =>
  page.locator('.field', { has: page.locator('.field-label', { hasText: new RegExp(`^${label}$`) }) })

test.describe('QR designer scannability', () => {
  test('every preset decodes back to the input', async ({ page }) => {
    await open(page)
    for (const name of PRESETS) {
      if (name !== 'Classic') await changed(page, () => page.getByRole('button', { name, exact: true }).click())
      expect(await decodePreview(page), name).toBe(URL_TEXT)
    }
  })

  test('a preset with a 25% logo decodes (error correction raised to H)', async ({ page }) => {
    await open(page)
    await changed(page, () => page.getByRole('button', { name: 'Soft green', exact: true }).click())
    await page.locator('input[type="file"]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: makePng(128, 128) })
    await expect(page.getByText(/Error correction raised to H/)).toBeVisible()
    await changed(page, () => page.getByLabel(/^Logo size/).fill('25'))
    await expect(page.locator('[aria-label="QR code preview"] svg image')).toHaveCount(1)
    // the EC-H matrix replaces the EC-M one after the 150 ms debounce
    await expect.poll(() => decodePreview(page), { timeout: 5000 }).toBe(URL_TEXT)
  })

  for (const text of [URL_TEXT, LONG_TEXT]) {
    test(`every allowed eye pair × module shape decodes (${text.length} chars)`, async ({ page }) => {
      await open(page, text)
      const failures: string[] = []
      for (const [frame, ball] of PAIRS) {
        for (const module of MODULES) {
          await group(page, 'Eye frame').getByRole('tab', { name: frame, exact: true }).click()
          await group(page, 'Eye centre').getByRole('tab', { name: ball, exact: true }).click()
          await page.getByLabel('Module shape').selectOption(module)
          // style changes re-render synchronously (no debounce); confirm the preview shows this state
          await expect(group(page, 'Eye centre').getByRole('tab', { name: ball, exact: true })).toHaveAttribute('aria-selected', 'true')
          const got = await decodePreview(page)
          if (got !== text) failures.push(`${frame}/${ball}/${module}`)
        }
      }
      expect(failures).toEqual([])
    })
  }

  test('downloads: PNG has PNG magic bytes and decodes, SVG parses', async ({ page }) => {
    await open(page)
    const [png] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PNG' }).click()])
    expect(png.suggestedFilename()).toBe('qr-code.png')
    const bytes = readFileSync(await png.path())
    expect([...bytes.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47])
    const decoded = await page.evaluate(
      (b64) => (window as unknown as Win).__qrDecodeUrl(`data:image/png;base64,${b64}`),
      bytes.toString('base64'),
    )
    expect(decoded).toBe(URL_TEXT)

    const [svg] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download SVG' }).click()])
    expect(svg.suggestedFilename()).toBe('qr-code.svg')
    const markup = readFileSync(await svg.path(), 'utf8')
    const parsed = await page.evaluate((m) => {
      const doc = new DOMParser().parseFromString(m, 'image/svg+xml')
      return { errors: doc.getElementsByTagName('parsererror').length, root: doc.documentElement.nodeName, viewBox: doc.documentElement.getAttribute('viewBox') }
    }, markup)
    expect(parsed).toEqual({ errors: 0, root: 'svg', viewBox: expect.stringMatching(/^0 0 \d+/) })
  })
})
