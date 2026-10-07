import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// Source-level guard for the privacy rules in CLAUDE.md: tool logic makes no network
// requests, never persists or logs user data, and never writes it into the URL.
// The CSP header and the Playwright canary test (test/e2e/privacy.spec.ts) enforce the same at runtime.

const ROOT = process.cwd()
const DIRS = ['components', 'lib', 'app']

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return files(p)
    return /\.(ts|tsx)$/.test(name) ? [p] : []
  })
}

const SOURCES = DIRS.flatMap((d) => files(join(ROOT, d))).map((p) => ({
  path: relative(ROOT, p),
  text: readFileSync(p, 'utf8'),
}))

function hits(pattern: RegExp, allow: string[] = []): string[] {
  return SOURCES.filter((f) => !allow.includes(f.path))
    .flatMap((f) =>
      f.text.split('\n').flatMap((line, i) => (pattern.test(line) ? [`${f.path}:${i + 1}: ${line.trim()}`] : [])),
    )
}

describe('privacy static guard', () => {
  it('scans the source tree', () => {
    expect(SOURCES.length).toBeGreaterThan(100)
  })

  it('makes no network calls from site code', () => {
    expect(hits(/\bfetch\(|XMLHttpRequest|new WebSocket|sendBeacon|new EventSource/)).toEqual([])
  })

  it('stores nothing except the consent flags', () => {
    expect(
      hits(/localStorage|sessionStorage|indexedDB|document\.cookie/, [
        'components/ConsentBanner.tsx',
        'components/Analytics.tsx',
        'app/privacy/page.tsx', // prose that discloses the consent flags
      ]),
    ).toEqual([])
  })

  it('never logs to the console (FileGenerators only contains console.log inside sample-file text)', () => {
    expect(hits(/console\.(log|info|debug|warn|error|trace)\(/, ['components/tools/FileGenerators.tsx'])).toEqual([])
  })

  it('never pushes history entries or rewrites the query string', () => {
    expect(hits(/history\.pushState|location\.search\s*=|location\.href\s*=/)).toEqual([])
  })

  it('uses hedged privacy wording only', () => {
    expect(hits(/never (upload|leave|sent)|nothing (is |ever )?(uploaded|leaves)|no uploads?\b|no telemetry/i)).toEqual([])
  })
})
