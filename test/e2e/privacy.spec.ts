import { test, expect, type Page, type Request } from '@playwright/test'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { STATIC, applySiteHeaders, dismissConsent } from './headers'
import { makePng } from './png'

// Canary test for the owner's rule: nothing a user types or loads may reach a
// server, a log or a third party. Each case feeds a unique marker into a tool and
// then checks every request, both storages, the URL, the title and the console.

const ALLOWED_HOSTS = [/^localhost$/, /\.google-analytics\.com$/, /\.analytics\.google\.com$/, /^www\.googletagmanager\.com$/]

type Capture = { requests: Request[]; console: string[] }

async function watch(page: Page): Promise<Capture> {
  const cap: Capture = { requests: [], console: [] }
  page.on('request', (r) => cap.requests.push(r))
  page.on('console', (m) => cap.console.push(m.text()))
  // Never actually talk to Google from tests; the request is still recorded above.
  await page.route(/googletagmanager\.com|google-analytics\.com|analytics\.google\.com/, (r) => r.abort())
  return cap
}

async function assertNoLeak(page: Page, cap: Capture, canary: string) {
  for (const r of cap.requests) {
    const url = new URL(r.url())
    if (url.protocol === 'data:' || url.protocol === 'blob:') continue
    expect(ALLOWED_HOSTS.some((h) => h.test(url.hostname)), `unexpected host ${url.hostname}`).toBe(true)
    expect(r.url(), 'canary in request URL').not.toContain(canary)
    expect(JSON.stringify(await r.allHeaders()), 'canary in request headers').not.toContain(canary)
    expect(r.postData() ?? '', 'canary in request body').not.toContain(canary)
  }
  const local = await page.evaluate(() => ({
    href: location.href,
    title: document.title,
    storage: JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }),
  }))
  expect(local.title).not.toContain(canary)
  expect(local.storage).not.toContain(canary)
  for (const line of cap.console) expect(line).not.toContain(canary)
  return local
}

const ACTIONS = /^(encrypt|generate|convert|compress|merge|analy[sz]e|format|beautify|decode|encode|compute|calculate|preview|sign|verify)\b/i

/** Type the canary into every text field of the tool, then press its action buttons. */
async function exercise(page: Page, canary: string) {
  const fields = page.locator(
    '.tool-console-body textarea:visible:not([readonly]):not([disabled]), .tool-console-body input[type="text"]:visible:not([readonly]):not([disabled])',
  )
  const n = await fields.count()
  for (let i = 0; i < n; i++) await fields.nth(i).fill(`${canary} hello world`)
  const buttons = page.locator('.tool-console-body button:visible')
  const b = await buttons.count()
  for (let i = 0; i < b; i++) {
    const name = ((await buttons.nth(i).textContent()) ?? '').trim()
    if (ACTIONS.test(name) && (await buttons.nth(i).isEnabled())) await buttons.nth(i).click()
  }
  await page.waitForTimeout(400)
}

const canaryFor = () => `CANARY${Math.random().toString(36).slice(2, 10).toUpperCase()}`

test.beforeEach(async ({ page }) => {
  await dismissConsent(page)
  await applySiteHeaders(page)
})

test('a header search term never leaves the page', async ({ page }) => {
  const canary = canaryFor()
  const cap = await watch(page)
  await page.goto(STATIC + '/tools/json-formatter/', { waitUntil: 'networkidle' })
  await page.getByRole('textbox', { name: 'Search tools' }).fill(canary)
  await page.getByRole('textbox', { name: 'Search tools' }).press('Enter')
  await page.waitForURL(/\/#q=/)
  await page.waitForLoadState('networkidle')
  // The term is only in the local fragment, which no request carries.
  expect(page.url()).toContain(`#q=${canary}`)
  await assertNoLeak(page, cap, canary)
})

for (const slug of ['hash-generator', 'encryption', 'jwt-tool', 'markdown-to-pdf', 'json-formatter', 'keyword-density', 'text-diff']) {
  test(`${slug}: typed input never leaves the page`, async ({ page }) => {
    const canary = canaryFor()
    const cap = await watch(page)
    await page.goto(STATIC + `/tools/${slug}/`, { waitUntil: 'networkidle' })
    await exercise(page, canary)
    const local = await assertNoLeak(page, cap, canary)
    expect(local.href).not.toContain(canary)
  })
}

test('image-compressor: an uploaded image (and its name) never leaves the page', async ({ page }) => {
  const canary = canaryFor()
  const cap = await watch(page)
  await page.goto(STATIC + '/tools/image-compressor/', { waitUntil: 'networkidle' })
  await page.locator('input[type="file"]').setInputFiles({ name: `${canary}.png`, mimeType: 'image/png', buffer: makePng(64, 48) })
  await page.getByRole('button', { name: 'Compress', exact: true }).click()
  await page.waitForTimeout(400)
  await assertNoLeak(page, cap, canary)
})

test('merge-pdf: PDF contents and names never leave the page', async ({ page }) => {
  const canary = canaryFor()
  const pdf = async () => {
    const doc = await PDFDocument.create()
    const p = doc.addPage([300, 200])
    p.drawText(canary, { x: 20, y: 100, size: 12, font: await doc.embedFont(StandardFonts.Helvetica) })
    doc.setAuthor(canary)
    return Buffer.from(await doc.save())
  }
  const cap = await watch(page)
  await page.goto(STATIC + '/tools/merge-pdf/', { waitUntil: 'networkidle' })
  await page.locator('input[type="file"]').setInputFiles([
    { name: `${canary}-a.pdf`, mimeType: 'application/pdf', buffer: await pdf() },
    { name: `${canary}-b.pdf`, mimeType: 'application/pdf', buffer: await pdf() },
  ])
  await page.getByRole('button', { name: /merge/i }).first().click()
  await page.waitForTimeout(600)
  await assertNoLeak(page, cap, canary)
})

test('the checker itself catches a planted leak', async ({ page }) => {
  const canary = canaryFor()
  const cap = await watch(page)
  await page.goto(STATIC + '/tools/hash-generator/', { waitUntil: 'networkidle' })
  // Simulate a buggy tool that sends input to the site's own origin (allowed by CSP).
  await page.evaluate((c) => fetch(`/collect?d=${c}`).catch(() => null), canary)
  await page.waitForTimeout(200)
  await expect(assertNoLeak(page, cap, canary)).rejects.toThrow(/canary in request URL/)
})

// ---- niche tools (2026-10-07) ------------------------------------------------

for (const slug of [
  'cron-to-systemd-timer',
  'homoglyph-detector',
  'amount-in-words-rupees',
  'density-altitude-calculator',
  'wind-correction-angle',
  'true-airspeed-calculator',
  'crosswind-component',
]) {
  test(`${slug}: typed input never leaves the page`, async ({ page }) => {
    const canary = canaryFor()
    const cap = await watch(page)
    await page.goto(STATIC + `/tools/${slug}/`, { waitUntil: 'networkidle' })
    await exercise(page, canary)
    const local = await assertNoLeak(page, cap, canary)
    expect(local.href).not.toContain(canary)
  })
}

const fileCases: { slug: string; file: (c: string) => Promise<{ name: string; mimeType: string; buffer: Buffer }> }[] = [
  {
    slug: 'vcf-to-csv',
    file: async (c) => ({
      name: `${c}.vcf`,
      mimeType: 'text/vcard',
      buffer: Buffer.from(`BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${c} Person\r\nEMAIL:${c.toLowerCase()}@example.com\r\nTEL;TYPE=CELL:+911234567890\r\nEND:VCARD\r\n`),
    }),
  },
  {
    slug: 'ics-viewer',
    file: async (c) => ({
      name: `${c}.ics`,
      mimeType: 'text/calendar',
      buffer: Buffer.from(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:1\r\nSUMMARY:${c} meeting\r\nLOCATION:${c} office\r\nDTSTART:20261007T033000Z\r\nDTEND:20261007T043000Z\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`),
    }),
  },
  {
    slug: 'gpx-converter',
    file: async (c) => ({
      name: `${c}.gpx`,
      mimeType: 'application/gpx+xml',
      buffer: Buffer.from(`<?xml version="1.0"?><gpx version="1.1" creator="t" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${c} ride</name><trkseg><trkpt lat="12.97" lon="77.59"><ele>900</ele></trkpt><trkpt lat="12.98" lon="77.60"><ele>910</ele></trkpt></trkseg></trk></gpx>`),
    }),
  },
  {
    slug: 'pdf-metadata-remover',
    file: async (c) => {
      const doc = await PDFDocument.create()
      doc.addPage([200, 200])
      doc.setAuthor(c)
      doc.setTitle(`${c} report`)
      return { name: `${c}.pdf`, mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) }
    },
  },
  { slug: 'aadhaar-masker', file: async (c) => ({ name: `${c}.png`, mimeType: 'image/png', buffer: makePng(320, 200) }) },
  { slug: 'photo-date-stamp', file: async (c) => ({ name: `${c}.png`, mimeType: 'image/png', buffer: makePng(200, 230) }) },
]

for (const { slug, file } of fileCases) {
  test(`${slug}: a loaded file (contents and name) never leaves the page`, async ({ page }) => {
    const canary = canaryFor()
    const cap = await watch(page)
    await page.goto(STATIC + `/tools/${slug}/`, { waitUntil: 'networkidle' })
    await page.locator('.tool-console-body input[type="file"]').first().setInputFiles(await file(canary))
    await page.waitForTimeout(500)
    await exercise(page, canary) // also types the canary into any name/text fields (e.g. photo name strip)
    await assertNoLeak(page, cap, canary)
  })
}
