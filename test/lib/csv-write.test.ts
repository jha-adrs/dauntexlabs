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

  // OWASP "CSV Injection": a cell starting with = + - @ (or tab/CR) runs as a
  // formula in Excel/Sheets, e.g. =HYPERLINK/WEBSERVICE can send data off-device.
  it('neutralises spreadsheet formulas from untrusted files', () => {
    expect(csvField('=1+1')).toBe("'=1+1")
    expect(csvField('@SUM(A1)')).toBe("'@SUM(A1)")
    expect(csvField('=HYPERLINK("http://x")')).toBe(`"'=HYPERLINK(""http://x"")"`)
    expect(csvField('\t=cmd')).toBe("'\t=cmd")
    expect(csvField('+cmd|calc')).toBe("'+cmd|calc")
    expect(csvField('-2+3')).toBe("'-2+3")
  })

  it('keeps phone numbers and plain numbers as they are', () => {
    expect(csvField('+91 98765 43210')).toBe('+91 98765 43210')
    expect(csvField('+1 (555) 010-9999')).toBe('+1 (555) 010-9999')
    expect(csvField('-12.5')).toBe('-12.5')
  })
})
