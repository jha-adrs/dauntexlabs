import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'

// The production static build (out/) served on :4173 by `serve`, which does not read
// Cloudflare's public/_headers — so tests apply the same headers via route interception.
export const STATIC = 'http://localhost:4173'

function siteHeaders(): Record<string, string> {
  const lines = readFileSync('public/_headers', 'utf8').split('\n')
  const out: Record<string, string> = {}
  let inAll = false
  for (const line of lines) {
    if (/^\S/.test(line)) inAll = line.trim() === '/*'
    else if (inAll) {
      const m = line.match(/^\s+([^:]+):\s*(.+)$/)
      if (m) out[m[1].toLowerCase()] = m[2].trim()
    }
  }
  return out
}

export const SITE_HEADERS = siteHeaders()

/** Serve every same-origin response with the site's real security headers. */
export async function applySiteHeaders(page: Page) {
  await page.route(`${STATIC}/**`, async (route) => {
    const res = await route.fetch()
    await route.fulfill({ response: res, headers: { ...res.headers(), ...SITE_HEADERS } })
  })
}

/** Accept the consent banner (no analytics) before any page script runs. */
export async function dismissConsent(page: Page) {
  await page.addInitScript(() => localStorage.setItem('dxl-consent-v1', 'accepted'))
}
