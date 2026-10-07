import { describe, it, expect } from 'vitest'
import { toCsv, csvField } from '@/lib/csv-write'

// Quoting rules from RFC 4180 §2: fields containing comma, double quote or
// line breaks are enclosed in double quotes; embedded quotes are doubled;
// records end with CRLF.
describe('toCsv (RFC 4180)', () => {
  it('leaves plain fields unquoted and ends records with CRLF', () => {
    expect(toCsv([['a', 'b'], ['1', '2']])).toBe('a,b\r\n1,2\r\n')
  })

  it('quotes commas, quotes and newlines', () => {
    expect(csvField('Doe, Jane')).toBe('"Doe, Jane"')
    expect(csvField('say "hi"')).toBe('"say ""hi"""')
    expect(csvField('line1\nline2')).toBe('"line1\nline2"')
    expect(csvField('cr\rhere')).toBe('"cr\rhere"')
  })

  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('')
  })
})
