import { describe, it, expect } from 'vitest'
import { TOOL_CONTENT } from '@/lib/tool-content'
import { tools } from '@/lib/tools'

const ABSOLUTE = /never (upload|leave|sent)|nothing (is |ever )?(uploaded|leaves)|no uploads?\b|no telemetry/i
const words = (s: string) => s.split(/\s+/).filter(Boolean).length

const PHASE0 = [
  'keyword-density', 'sql-to-csv', 'cidr-calculator', 'morse-code', 'meta-tag-generator',
  'hash-generator', 'date-calculator', 'date-difference', 'json-pivot', 'random-number-generator',
]

describe('TOOL_CONTENT', () => {
  it('covers the 10 pages that already get search impressions', () => {
    for (const slug of PHASE0) expect(TOOL_CONTENT[slug], slug).toBeDefined()
  })
  const slugs = new Set(tools.map((t) => t.slug))
  for (const [slug, c] of Object.entries(TOOL_CONTENT)) {
    describe(slug, () => {
      it('belongs to a real tool', () => expect(slugs.has(slug)).toBe(true))
      it('has 1–3 intro paragraphs, 3–6 steps, 3–6 FAQs', () => {
        expect(c.intro.length).toBeGreaterThanOrEqual(1)
        expect(c.intro.length).toBeLessThanOrEqual(3)
        expect(c.steps.length).toBeGreaterThanOrEqual(3)
        expect(c.steps.length).toBeLessThanOrEqual(6)
        expect(c.faq.length).toBeGreaterThanOrEqual(3)
        expect(c.faq.length).toBeLessThanOrEqual(6)
      })
      it('is 300–700 words', () => {
        const all = [...c.intro, ...c.steps, ...c.faq.flatMap((f) => [f.q, f.a])].join(' ')
        expect(words(all)).toBeGreaterThanOrEqual(300)
        expect(words(all)).toBeLessThanOrEqual(700)
      })
      it('uses hedged privacy wording', () => {
        const all = [...c.intro, ...c.steps, ...c.faq.flatMap((f) => [f.q, f.a])].join(' ')
        expect(all).not.toMatch(ABSOLUTE)
      })
    })
  }
})
