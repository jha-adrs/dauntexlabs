// Tiny RFC 4180 CSV writer shared by the data tools (vcf-to-csv, ics-viewer).
// Fields containing a comma, double quote, CR or LF are wrapped in double
// quotes with embedded quotes doubled; every record ends with CRLF.
//
// Input files (vCards, calendar invites) often come from third parties, so cells
// that a spreadsheet would run as a formula (= + - @, tab, CR) get a leading ' —
// otherwise =HYPERLINK/WEBSERVICE in Excel could send data off the device
// (OWASP "CSV Injection"). Phone numbers and plain numbers are left alone.

const FORMULA_START = /^[=+\-@\t\r]/
const PHONE_OR_NUMBER = /^[+-]?[\d\s().-]+$/

function neutralise(value: string): string {
  if (!FORMULA_START.test(value)) return value
  if (PHONE_OR_NUMBER.test(value) && !/[=@]/.test(value)) return value
  return `'${value}`
}

export function csvField(value: string): string {
  const v = neutralise(value)
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map(csvField).join(',') + '\r\n').join('')
}
