import { describe, it, expect } from 'vitest'
import { findConfusables, skeleton, removeInvisible, ZERO_WIDTH } from '@/lib/confusables'

// Mappings come from Unicode confusables.txt v18.0.0
// (https://www.unicode.org/Public/security/latest/confusables.txt), e.g.
// "0430 ; 0061 ; MA # ( а → a ) CYRILLIC SMALL LETTER A → LATIN SMALL LETTER A".

describe('findConfusables', () => {
  it('flags Cyrillic а in pаypal at index 1 as a', () => {
    const hits = findConfusables('pаypal')
    expect(hits).toHaveLength(1)
    expect(hits[0]).toMatchObject({ index: 1, char: 'а', codePoint: 0x430, looksLike: 'a', script: 'Cyrillic' })
  })
  it('flags Greek capital Eta', () => {
    const hits = findConfusables('Ηello')
    expect(hits).toHaveLength(1)
    expect(hits[0]).toMatchObject({ index: 0, looksLike: 'H', script: 'Greek' })
  })
  it('flags zero-width characters', () => {
    const hits = findConfusables('a​b')
    expect(hits).toHaveLength(1)
    expect(hits[0]).toMatchObject({ index: 1, codePoint: 0x200b, script: 'Invisible', looksLike: '' })
  })
  it('flags fullwidth and math letters, counting code points (not UTF-16 units)', () => {
    const hits = findConfusables('\u{1D41A}ｂc')
    expect(hits.map((h) => [h.index, h.looksLike, h.script])).toEqual([
      [0, 'a', 'Mathematical'],
      [1, 'b', 'Fullwidth'],
    ])
  })
  it('plain ASCII has no hits', () => {
    expect(findConfusables('paypal.com Hello, world! 123')).toEqual([])
  })
})

describe('skeleton / removeInvisible', () => {
  it('maps lookalikes to ASCII and drops invisibles', () => {
    expect(skeleton('pаypаl​.com')).toBe('paypal.com')
    expect(skeleton('Ηello')).toBe('Hello')
  })
  it('removeInvisible keeps other characters', () => {
    expect(removeInvisible('pаy﻿pal­')).toBe('pаypal')
  })
  it('ZERO_WIDTH contains the core set', () => {
    for (const cp of [0x200b, 0x200c, 0x200d, 0x2060, 0xfeff, 0x00ad, 0x180e]) expect(ZERO_WIDTH.has(cp)).toBe(true)
  })
})
