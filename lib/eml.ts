// .eml (RFC 5322 + MIME) parser for the EML viewer. Pure, no network.
//
// The message is handled as a "binary string" (one char per byte, latin1) so base64 /
// quoted-printable / 8bit bodies keep their exact bytes until they are decoded with the
// charset the part declares. Pasted text is UTF-8-encoded first, so it round-trips.
//
// cid: images (multipart/related) are inlined as data: URLs from the matching image
// part, which the sandbox CSP allows. Unmatched cid: references stay as they are and
// simply do not load.

export type Attachment = { filename: string; mime: string; bytes: Uint8Array }
export type Email = {
  headers: { name: string; value: string }[]
  subject: string
  from: string
  to: string
  date: string
  text: string
  html: string | null
  attachments: Attachment[]
}

/** CSP for the email's HTML: nothing may load except inline styles and data: images. */
export const SANDBOX_CSP = "default-src 'none'; img-src data:; style-src 'unsafe-inline'"

/* ---- bytes & charsets -------------------------------------------------- */

function binToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff
  return out
}

function bytesToBin(b: Uint8Array): string {
  let s = ''
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000))
  return s
}

function decodeBytes(bytes: Uint8Array, charset?: string): string {
  const label = (charset || '').trim().toLowerCase()
  if (!label || label === 'us-ascii' || label === 'ascii') {
    // Undeclared: try UTF-8, else the usual Windows Western default.
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    } catch {
      return new TextDecoder('windows-1252').decode(bytes)
    }
  }
  let dec: TextDecoder
  try {
    dec = new TextDecoder(label, { fatal: false })
  } catch {
    dec = new TextDecoder('utf-8', { fatal: false })
  }
  return dec.decode(bytes)
}

function base64Bin(s: string): string {
  let clean = s.replace(/[^A-Za-z0-9+/]/g, '')
  clean = clean.slice(0, clean.length - (clean.length % 4 === 1 ? 1 : 0))
  while (clean.length % 4) clean += '='
  try {
    return atob(clean)
  } catch {
    return ''
  }
}

function qpBin(s: string, underscoreSpace = false): string {
  let t = s.replace(/=\r?\n/g, '')
  if (underscoreSpace) t = t.replace(/_/g, ' ')
  return t.replace(/=([0-9A-Fa-f]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
}

/** Header bytes: RFC 6532 allows raw UTF-8; anything else is shown as latin1. */
function headerText(bin: string): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(binToBytes(bin))
  } catch {
    return bin
  }
}

/* ---- RFC 2047 encoded words ------------------------------------------- */

const ENCODED_WORD = /=\?([^?\s]+)\?([BbQq])\?([^?\s]*)\?=/g

/** Decode RFC 2047 encoded words (B and Q). Adjacent words are joined without the whitespace between them. */
export function decodeWords(s: string): string {
  const out: string[] = []
  let pending: { charset: string; bin: string } | null = null
  let last = 0
  const flush = () => {
    if (pending) out.push(decodeBytes(binToBytes(pending.bin), pending.charset))
    pending = null
  }
  for (const m of s.matchAll(ENCODED_WORD)) {
    const between = s.slice(last, m.index)
    const charset = m[1].split('*')[0] // RFC 2231 language suffix
    const bin = m[2].toUpperCase() === 'B' ? base64Bin(m[3]) : qpBin(m[3], true)
    const p = pending as { charset: string; bin: string } | null
    if (p && /^\s*$/.test(between)) {
      // Same charset: join bytes so a character split across words still decodes.
      if (p.charset.toLowerCase() === charset.toLowerCase()) p.bin += bin
      else {
        flush()
        pending = { charset, bin }
      }
    } else {
      flush()
      out.push(between)
      pending = { charset, bin }
    }
    last = (m.index ?? 0) + m[0].length
  }
  flush()
  out.push(s.slice(last))
  return out.join('')
}

/* ---- headers & parameters --------------------------------------------- */

type RawHeader = { name: string; value: string } // value still a binary string

function splitHead(s: string): { headers: RawHeader[]; body: string } {
  const headers: RawHeader[] = []
  let pos = 0
  while (pos < s.length) {
    const nl = s.indexOf('\n', pos)
    const end = nl === -1 ? s.length : nl + 1
    const line = s.slice(pos, nl === -1 ? s.length : nl).replace(/\r$/, '')
    if (line === '') {
      pos = end
      break
    }
    if (/^[ \t]/.test(line) && headers.length) {
      headers[headers.length - 1].value += ' ' + line.replace(/^[ \t]+/, '')
    } else if (/^[!-9;-~]+:/.test(line)) {
      const i = line.indexOf(':')
      headers.push({ name: line.slice(0, i), value: line.slice(i + 1).trim() })
    } else if (pos === 0 && /^From /.test(line)) {
      // mbox "From " separator line: skip
    } else {
      break // no blank line before the body: the body starts here
    }
    pos = end
  }
  return { headers, body: s.slice(pos) }
}

function getHeader(h: RawHeader[], name: string): string {
  const n = name.toLowerCase()
  return h.find((x) => x.name.toLowerCase() === n)?.value ?? ''
}

function splitParams(v: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < v.length; i++) {
    const c = v[i]
    if (quoted && c === '\\' && i + 1 < v.length) {
      cur += c + v[++i]
      continue
    }
    if (c === '"') quoted = !quoted
    if (c === ';' && !quoted) {
      out.push(cur)
      cur = ''
    } else cur += c
  }
  out.push(cur)
  return out
}

function unquote(v: string): string {
  const t = v.trim()
  return t.startsWith('"') && t.endsWith('"') && t.length >= 2 ? t.slice(1, -1).replace(/\\(.)/g, '$1') : t
}

function percentBin(s: string): string {
  return s.replace(/%([0-9A-Fa-f]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
}

/** `type/sub; a=b; c*=UTF-8''x` → value + params, with RFC 2231 extended values and continuations joined. */
function parseHeaderValue(raw: string): { value: string; params: Record<string, string> } {
  const [first, ...rest] = splitParams(raw)
  type Seg = { n: number; ext: boolean; val: string }
  const groups = new Map<string, Seg[]>()
  for (const piece of rest) {
    const eq = piece.indexOf('=')
    if (eq < 0) continue
    const key = piece.slice(0, eq).trim().toLowerCase()
    const m = /^([^*]+)(?:\*(\d+))?(\*)?$/.exec(key)
    if (!m) continue
    const seg = { n: m[2] === undefined ? -1 : Number(m[2]), ext: !!m[3], val: unquote(piece.slice(eq + 1)) }
    const list = groups.get(m[1]) ?? []
    list.push(seg)
    groups.set(m[1], list)
  }
  const params: Record<string, string> = {}
  for (const [name, segs] of groups) {
    const single = segs.find((s) => s.n === -1 && s.ext)
    const numbered = segs.filter((s) => s.n >= 0).sort((a, b) => a.n - b.n)
    const parts = single ? [single] : numbered.length ? numbered : segs.slice(0, 1)
    if (!parts.some((s) => s.ext)) {
      params[name] = decodeWords(headerText(parts.map((s) => s.val).join('')))
      continue
    }
    let charset = 'utf-8'
    let bin = ''
    parts.forEach((s, i) => {
      let v = s.val
      if (i === 0 && s.ext) {
        const m = /^([^']*)'[^']*'([\s\S]*)$/.exec(v)
        if (m) {
          charset = m[1] || charset
          v = m[2]
        }
      }
      bin += s.ext ? percentBin(v) : v
    })
    params[name] = decodeBytes(binToBytes(bin), charset)
  }
  return { value: first.trim().toLowerCase(), params }
}

/* ---- MIME tree --------------------------------------------------------- */

type Found = Attachment & { cid?: string }
type Ctx = { text: string | null; html: string | null; attachments: Found[] }

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function splitMultipart(body: string, boundary: string): string[] {
  const re = new RegExp(`(^|\\r?\\n)--${escapeRe(boundary)}(--)?[ \\t]*(?=\\r?\\n|$)`, 'g')
  const parts: string[] = []
  let start = -1
  for (const m of body.matchAll(re)) {
    const idx = m.index ?? 0
    if (start >= 0) parts.push(body.slice(start, idx))
    if (m[2]) return parts
    start = idx + m[0].length
    start += body.startsWith('\r\n', start) ? 2 : body.startsWith('\n', start) ? 1 : 0
  }
  if (start >= 0) parts.push(body.slice(start))
  return parts
}

function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? ''
  // eslint-disable-next-line no-control-regex
  return base.replace(/[\u0000-\u001f\u007f]/g, '').replace(/^[.\s]+/, '').trim()
}

function walk(headers: RawHeader[], body: string, ctx: Ctx, depth: number) {
  const ct = parseHeaderValue(getHeader(headers, 'content-type') || 'text/plain')
  const type = ct.value || 'text/plain'
  if (type.startsWith('multipart/') && ct.params.boundary && depth < 30) {
    for (const part of splitMultipart(body, ct.params.boundary)) {
      const p = splitHead(part)
      walk(p.headers, p.body, ctx, depth + 1)
    }
    return
  }
  const cte = getHeader(headers, 'content-transfer-encoding').trim().toLowerCase()
  const data = cte === 'base64' ? base64Bin(body) : cte === 'quoted-printable' ? qpBin(body) : body
  const disp = parseHeaderValue(getHeader(headers, 'content-disposition'))
  const name = disp.params.filename || ct.params.name || ''
  const isBody = type === 'text/plain' || type === 'text/html' || type.startsWith('multipart/')
  const attached = disp.value === 'attachment' || !isBody || (!!name && disp.value !== 'inline')

  if (!attached) {
    const textValue = decodeBytes(binToBytes(data), ct.params.charset)
    if (type === 'text/html' && ctx.html === null) return void (ctx.html = textValue)
    if (type !== 'text/html' && ctx.text === null) return void (ctx.text = textValue)
  }
  const n = ctx.attachments.length + 1
  const fallback = type === 'message/rfc822' ? 'message.eml' : type === 'text/html' ? `part-${n}.html` : type === 'text/plain' ? `part-${n}.txt` : `attachment-${n}`
  const cid = getHeader(headers, 'content-id').trim().replace(/^<|>$/g, '')
  ctx.attachments.push({
    filename: safeFilename(name) || fallback,
    mime: type,
    bytes: binToBytes(data),
    ...(cid ? { cid } : {}),
  })
}

function inlineCids(html: string, atts: Found[]): string {
  return html.replace(/cid:([^"'\s)>]+)/gi, (whole, ref: string) => {
    let id = ref
    try {
      id = decodeURIComponent(ref)
    } catch {
      /* keep as written */
    }
    const a = atts.find((x) => x.cid && x.cid.toLowerCase() === id.toLowerCase() && x.mime.startsWith('image/'))
    return a ? `data:${a.mime};base64,${btoa(bytesToBin(a.bytes))}` : whole
  })
}

/** Parse a raw .eml message (bytes from a file, or pasted text). */
export function parseEml(raw: string | Uint8Array): { ok: true; email: Email } | { ok: false; error: string } {
  try {
    const bin = typeof raw === 'string' ? bytesToBin(new TextEncoder().encode(raw)) : bytesToBin(raw)
    const { headers, body } = splitHead(bin.replace(/^﻿|^\xEF\xBB\xBF/, ''))
    if (!headers.length) return { ok: false, error: 'This does not look like an email: no headers found.' }
    const ctx: Ctx = { text: null, html: null, attachments: [] }
    walk(headers, body, ctx, 0)
    const shown = headers.map((h) => ({ name: h.name, value: decodeWords(headerText(h.value)) }))
    const pick = (n: string) => shown.find((h) => h.name.toLowerCase() === n)?.value ?? ''
    return {
      ok: true,
      email: {
        headers: shown,
        subject: pick('subject'),
        from: pick('from'),
        to: pick('to'),
        date: pick('date'),
        text: ctx.text ?? '',
        html: ctx.html === null ? null : inlineCids(ctx.html, ctx.attachments),
        attachments: ctx.attachments.map(({ filename, mime, bytes }) => ({ filename, mime, bytes })),
      },
    }
  } catch {
    return { ok: false, error: 'Could not read this email.' }
  }
}

/**
 * HTML for the sandboxed iframe's srcdoc. The meta CSP comes first so it is in force
 * before any of the email's markup; it is the real guard. Stripping script, meta refresh,
 * base and link tags is defence in depth. `<base target="_blank">` turns link clicks into
 * popups, which the sandbox (no allow-popups) blocks, so the frame never navigates away.
 */
export function safeSrcdoc(html: string): string {
  let out = html
  let prev: string
  do {
    prev = out
    out = out
      .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<\/?script\b[^>]*>?/gi, '')
      .replace(/<meta\b[^>]*http-equiv\s*=\s*["']?\s*refresh[^>]*>?/gi, '')
      .replace(/<base\b[^>]*>?/gi, '')
      .replace(/<link\b[^>]*>?/gi, '')
  } while (out !== prev)
  return `<meta http-equiv="Content-Security-Policy" content="${SANDBOX_CSP}"><base target="_blank">${out}`
}
