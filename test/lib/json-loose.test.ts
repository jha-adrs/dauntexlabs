import { describe, it, expect } from 'vitest'
import { parseLooseJson } from '@/lib/json-loose'

describe('parseLooseJson (relaxed JSON, never executed as code)', () => {
  it('accepts unquoted keys, single quotes, trailing commas and comments', () => {
    const input = `{
      // a comment
      name: 'Ada',  /* block */
      tags: ['a', 'b',],
      nested: { ok: true, n: -1.5e2, none: null, },
    }`
    expect(parseLooseJson(input)).toEqual({ name: 'Ada', tags: ['a', 'b'], nested: { ok: true, n: -150, none: null } })
  })

  it('handles quotes inside strings', () => {
    expect(parseLooseJson(`{ a: 'it\\'s "fine"', b: "x'y" }`)).toEqual({ a: `it's "fine"`, b: "x'y" })
  })

  it('keeps // and /* inside strings', () => {
    expect(parseLooseJson(`{ url: 'http://x.io/a/*b*/' }`)).toEqual({ url: 'http://x.io/a/*b*/' })
  })

  it('still parses strict JSON', () => {
    expect(parseLooseJson('[1, {"a": "b"}]')).toEqual([1, { a: 'b' }])
  })

  it('rejects code instead of running it', () => {
    expect(() => parseLooseJson('alert(1)')).toThrow()
    expect(() => parseLooseJson('{ a: window.location }')).toThrow()
    expect(() => parseLooseJson('(() => 1)()')).toThrow()
  })
})
