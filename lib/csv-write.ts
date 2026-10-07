// Tiny RFC 4180 CSV writer shared by the data tools (vcf-to-csv, ics-viewer).
// Fields containing a comma, double quote, CR or LF are wrapped in double
// quotes with embedded quotes doubled; every record ends with CRLF.

export function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map(csvField).join(',') + '\r\n').join('')
}
