import { test, expect, type Page } from '@playwright/test'
import { STATIC, applySiteHeaders, dismissConsent, SITE_HEADERS } from './headers'

// The Content-Security-Policy must not break the site, and must block any request
// to a host outside the allowlist (the runtime half of the "no network" rule).

async function collectViolations(page: Page) {
  await page.addInitScript(() => {
    ;(window as unknown as { __csp: string[] }).__csp = []
    document.addEventListener('securitypolicyviolation', (e) => {
      ;(window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`)
    })
  })
}
const violations = (page: Page) => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)

test.beforeEach(async ({ page }) => {
  await dismissConsent(page)
  await applySiteHeaders(page)
  await collectViolations(page)
})

test('the policy is present in public/_headers', () => {
  expect(SITE_HEADERS['content-security-policy']).toContain("connect-src 'self'")
})

for (const path of ['/', '/tools/json-formatter/', '/convert/png-to-jpg/', '/privacy/']) {
  test(`no CSP violations on ${path}`, async ({ page }) => {
    await page.goto(STATIC + path, { waitUntil: 'networkidle' })
    expect(await violations(page)).toEqual([])
  })
}

test('markdown-to-pdf preview and print iframe work under the policy', async ({ page }) => {
  await page.goto(STATIC + '/tools/markdown-to-pdf/', { waitUntil: 'networkidle' })
  await page.locator('.tool-console-body textarea').first().fill('# Hello\n\nSome **bold** text.')
  await page.waitForTimeout(300)
  expect(await violations(page)).toEqual([])
})

test('a request to another host is blocked', async ({ page }) => {
  await page.goto(STATIC + '/tools/json-formatter/', { waitUntil: 'networkidle' })
  const result = await page.evaluate(() =>
    // no-cors: without the CSP this request is sent (opaque response); only the CSP blocks it.
    window.fetch('https://example.com/collect', { mode: 'no-cors' }).then(
      () => 'sent',
      () => 'blocked',
    ),
  )
  expect(result).toBe('blocked')
})

test('json-formatter loose mode works under the policy (no eval)', async ({ page }) => {
  await page.goto(STATIC + '/tools/json-formatter/', { waitUntil: 'networkidle' })
  await page.getByLabel(/Parse JS objects/).check({ force: true })
  await page.locator('.tool-console-body textarea').first().fill("{ name: 'Ada', tags: ['x',], }")
  await expect(page.locator('.tool-console-body textarea').nth(1)).toHaveValue(/"name": "Ada"/)
  expect(await violations(page)).toEqual([])
})
