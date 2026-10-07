import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Cloudflare Pages reads public/_headers: a path line, then indented "Name: value"
// lines. Comments belong on their own unindented lines — an indented comment inside a
// block risks being parsed as a header and breaking the CSP.
const lines = readFileSync('public/_headers', 'utf8').split('\n')

describe('public/_headers', () => {
  it('has no indented comment lines inside header blocks', () => {
    expect(lines.filter((l) => /^\s+#/.test(l))).toEqual([])
  })

  it('every indented line is a "Name: value" header', () => {
    const bad = lines.filter((l) => /^\s+\S/.test(l) && !/^\s+[A-Za-z0-9-]+:\s*\S/.test(l))
    expect(bad).toEqual([])
  })

  it('sends a Content-Security-Policy for every path', () => {
    const i = lines.findIndex((l) => l.trim() === '/*')
    const block = lines.slice(i + 1, lines.findIndex((l, j) => j > i && /^\S/.test(l)))
    expect(block.some((l) => /^\s+Content-Security-Policy:/.test(l))).toBe(true)
  })
})
