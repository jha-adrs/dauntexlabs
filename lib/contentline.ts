// Content-line helpers shared by the vCard (RFC 2426 / RFC 6350) and
// iCalendar (RFC 5545) parsers: both use the same `NAME;PARAM=V:value` grammar,
// the same line folding (CRLF + one space/tab) and the same TEXT escapes.

export interface ContentLine {
  /** Upper-cased property name, group prefix (`item1.`) removed. */
  name: string
  /** Upper-cased param name → values (quotes stripped, comma lists split). */
  params: Record<string, string[]>
  value: string
}

export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

function isQuotedPrintable(line: string): boolean {
  const colon = line.indexOf(':')
  return colon > 0 && /QUOTED-PRINTABLE/i.test(line.slice(0, colon))
}

/**
 * Splits text into logical lines: joins folded continuations and, when `qp` is
 * set, vCard 2.1 QUOTED-PRINTABLE soft line breaks (a value ending in `=`).
 */
export function unfold(text: string, qp = false): string[] {
  const out: string[] = []
  for (const line of stripBom(text).split(/\r\n|\r|\n/)) {
    const last = out.length - 1
    if (qp && last >= 0 && out[last].endsWith('=') && isQuotedPrintable(out[last])) {
      out[last] = out[last].slice(0, -1) + line
    } else if ((line.startsWith(' ') || line.startsWith('\t')) && last >= 0) {
      out[last] += line.slice(1)
    } else if (line.trim() !== '') {
      out.push(line)
    }
  }
  return out
}

/** Splits on `sep` outside double quotes. */
function splitOutsideQuotes(s: string, sep: string): string[] {
  const parts: string[] = []
  let cur = ''
  let quoted = false
  for (const ch of s) {
    if (ch === '"') quoted = !quoted
    if (ch === sep && !quoted) {
      parts.push(cur)
      cur = ''
    } else cur += ch
  }
  parts.push(cur)
  return parts
}

const ENCODINGS = /^(QUOTED-PRINTABLE|BASE64|B|8BIT|7BIT)$/i

export function parseLine(line: string): ContentLine | null {
  let quoted = false
  let colon = -1
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') quoted = !quoted
    else if (line[i] === ':' && !quoted) {
      colon = i
      break
    }
  }
  if (colon <= 0) return null
  const [rawName, ...rawParams] = splitOutsideQuotes(line.slice(0, colon), ';')
  const name = rawName.replace(/^.*\./, '').trim().toUpperCase()
  if (!name) return null
  const params: Record<string, string[]> = {}
  const add = (k: string, vals: string[]) => {
    params[k] = [...(params[k] ?? []), ...vals.filter(Boolean)]
  }
  for (const p of rawParams) {
    const eq = p.indexOf('=')
    if (eq < 0) {
      // vCard 2.1 bare params: `TEL;CELL;VOICE` or `;QUOTED-PRINTABLE`
      add(ENCODINGS.test(p.trim()) ? 'ENCODING' : 'TYPE', [p.trim()])
      continue
    }
    const key = p.slice(0, eq).trim().toUpperCase()
    const vals = splitOutsideQuotes(p.slice(eq + 1), ',').map((v) => v.trim().replace(/^"|"$/g, ''))
    add(key, vals.flatMap((v) => (key === 'TYPE' ? v.split(',') : [v])).map((v) => v.trim()))
  }
  return { name, params, value: line.slice(colon + 1) }
}

/** Splits on `sep` not preceded by a backslash escape (escapes are kept). */
export function splitUnescaped(value: string, sep: string): string[] {
  const parts: string[] = []
  let cur = ''
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (ch === '\\' && i + 1 < value.length) {
      cur += ch + value[++i]
    } else if (ch === sep) {
      parts.push(cur)
      cur = ''
    } else cur += ch
  }
  parts.push(cur)
  return parts
}

/** TEXT unescape: `\\` `\,` `\;` `\n` / `\N`. */
export function unescapeText(value: string): string {
  return value.replace(/\\([\\,;nN:])/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c))
}

export function param(cl: ContentLine, key: string): string | undefined {
  return cl.params[key]?.[0]
}
