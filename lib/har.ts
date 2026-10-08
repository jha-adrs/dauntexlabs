/**
 * HAR sanitizer: finds and redacts secrets in an HTTP Archive (HAR 1.2) before it is shared.
 *
 * One walker does both jobs. `analyzeHar` runs it with every category on and records a finding
 * for each value it would remove; `redactHar` runs it on a copy with the chosen categories and
 * counts what it actually removed. Each value is visited once, so with every category on
 * `count === findings.length`.
 *
 * Coverage: request/response headers (cookie headers, auth headers, any header whose name looks
 * secret, URL-valued headers like Referer/Location), `cookies[]`, `queryString[]`, the `url` /
 * `redirectURL` query and fragment, `postData.params[]`, `postData.text` (form-urlencoded,
 * multipart, JSON keys), `response.content.text`, and JWTs in every string of the file.
 *
 * Base64 bodies (`content.encoding: 'base64'`) are decoded byte-for-byte (latin1), scrubbed with
 * string matching (JSON keys, JWTs) and re-encoded, so non-text bytes survive unchanged. With the
 * `bodies` category on, request and response bodies are dropped entirely instead.
 */

export type Category = 'cookies' | 'auth' | 'query' | 'jwt' | 'bodies'
export type Finding = { category: Category; where: string; name: string; preview: string }

export const CATEGORIES: { id: Category; label: string; hint: string }[] = [
  { id: 'cookies', label: 'Cookies', hint: 'Cookie and Set-Cookie headers, cookie lists' },
  { id: 'auth', label: 'Auth headers and API keys', hint: 'Authorization, X-Api-Key, tokens, CSRF' },
  { id: 'query', label: 'Token-like parameters', hint: 'URL query, form fields and JSON keys named like token, key, secret, session, code, password' },
  { id: 'jwt', label: 'JWTs anywhere', hint: 'eyJ… tokens in URLs, headers and bodies' },
  { id: 'bodies', label: 'Drop request and response bodies', hint: 'Removes every body entirely' },
]

/** Parameter / JSON key / header names that usually carry secrets (deliberately broad). */
const NAME_RE = /token|key|secret|session|code|passw|pwd|auth|sig|csrf|xsrf|jwt/i
const JWT_RE = /eyJ[\w-]+\.[\w-]+\.[\w-]*/g
const COOKIE_HEADERS = new Set(['cookie', 'set-cookie', 'cookie2', 'set-cookie2'])
const AUTH_HEADERS = new Set(['authorization', 'proxy-authorization', 'x-api-key', 'x-auth-token', 'x-csrf-token', 'x-xsrf-token'])
const URL_HEADERS = new Set(['referer', 'location', 'content-location'])
const R = '[REDACTED]'
const RU = 'REDACTED' // inside URLs and urlencoded text, so the result stays valid

export function maskSecret(v: string): string {
  if (v.length < 8) return '••••'
  return `${v.slice(0, 3)}… (${v.length} chars)`
}

type Rec = Record<string, unknown>
const isObj = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v)

class Ctx {
  findings: Finding[] = []
  count = 0
  constructor(private on: Set<Category>) {}
  /** Records a finding and returns true when `cat` is on (the caller then redacts). */
  hit(category: Category, where: string, name: string, value: string): boolean {
    if (!this.on.has(category)) return false
    this.findings.push({ category, where, name, preview: maskSecret(value) })
    this.count++
    return true
  }
}

function jwt(ctx: Ctx, s: string, where: string, name: string, repl = R): string {
  if (s.indexOf('eyJ') < 0) return s
  return s.replace(JWT_RE, (m) => (ctx.hit('jwt', where, name, m) ? repl : m))
}

function generic(ctx: Ctx, v: unknown, where: string, name: string): unknown {
  if (typeof v === 'string') return jwt(ctx, v, where, name)
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) v[i] = generic(ctx, v[i], where, name)
  } else if (isObj(v)) {
    for (const k of Object.keys(v)) v[k] = generic(ctx, v[k], where, k)
  }
  return v
}

/** Processes every key of `o` except `skip` generically (JWT sweep). */
function rest(ctx: Ctx, o: Rec, skip: string[], where: string) {
  for (const k of Object.keys(o)) if (!skip.includes(k)) o[k] = generic(ctx, o[k], where, k)
}

function decodeName(n: string): string {
  try {
    return decodeURIComponent(n.replace(/\+/g, ' '))
  } catch {
    return n
  }
}

/** `a=1&b=2` style text (URL query, fragment, form body). */
function pairs(ctx: Ctx, s: string, where: string): string {
  return s
    .split('&')
    .map((part) => {
      const eq = part.indexOf('=')
      if (eq < 0) return jwt(ctx, part, where, 'JWT', RU)
      const name = decodeName(part.slice(0, eq))
      const value = part.slice(eq + 1)
      if (value && NAME_RE.test(name) && ctx.hit('query', where, name, value)) return part.slice(0, eq + 1) + RU
      return part.slice(0, eq + 1) + jwt(ctx, value, where, name, RU)
    })
    .join('&')
}

function url(ctx: Ctx, u: string, where: string): string {
  const h = u.indexOf('#')
  const main = h < 0 ? u : u.slice(0, h)
  const q = main.indexOf('?')
  let out = jwt(ctx, q < 0 ? main : main.slice(0, q), where, 'JWT', RU)
  if (q >= 0) out += '?' + pairs(ctx, main.slice(q + 1), where)
  if (h >= 0) {
    const frag = u.slice(h + 1)
    out += '#' + (frag.includes('=') ? pairs(ctx, frag, where) : jwt(ctx, frag, where, 'JWT', RU))
  }
  return out
}

function redactCookieHeader(value: string, isSet: boolean): string {
  if (isSet) {
    // One cookie per line; keep the name and attributes (Path, Expires…), drop the value.
    return value
      .split('\n')
      .map((line) => {
        const semi = line.indexOf(';')
        const first = semi < 0 ? line : line.slice(0, semi)
        const eq = first.indexOf('=')
        return (eq < 0 ? R : first.slice(0, eq + 1) + R) + (semi < 0 ? '' : line.slice(semi))
      })
      .join('\n')
  }
  return value
    .split(';')
    .map((p) => {
      const eq = p.indexOf('=')
      return eq < 0 ? p.replace(/\S[\s\S]*$/, R) : p.slice(0, eq + 1) + R
    })
    .join(';')
}

function headers(ctx: Ctx, list: unknown[], where: string) {
  const w = `${where} header`
  for (let i = 0; i < list.length; i++) {
    const h = list[i]
    if (!isObj(h) || typeof h.name !== 'string' || typeof h.value !== 'string') {
      list[i] = generic(ctx, h, w, 'header')
      continue
    }
    const name = h.name
    const value = h.value
    const lname = name.toLowerCase()
    if (COOKIE_HEADERS.has(lname)) {
      h.value = value && ctx.hit('cookies', w, name, value) ? redactCookieHeader(value, lname.startsWith('set-')) : jwt(ctx, value, w, name)
    } else if (AUTH_HEADERS.has(lname) || NAME_RE.test(lname)) {
      h.value = value && ctx.hit('auth', w, name, value) ? R : jwt(ctx, value, w, name)
    } else if (URL_HEADERS.has(lname)) {
      h.value = url(ctx, value, w)
    } else {
      h.value = jwt(ctx, value, w, name)
    }
    rest(ctx, h, ['name', 'value'], w)
  }
}

/** Named-value lists: cookies[], queryString[], postData.params[]. */
function namedValues(ctx: Ctx, list: unknown[], where: string, cat: 'cookies' | 'query') {
  for (let i = 0; i < list.length; i++) {
    const p = list[i]
    if (!isObj(p) || typeof p.value !== 'string') {
      list[i] = generic(ctx, p, where, 'value')
      continue
    }
    const name = typeof p.name === 'string' ? p.name : ''
    const secret = p.value !== '' && (cat === 'cookies' || NAME_RE.test(name))
    p.value = secret && ctx.hit(cat, where, name, p.value) ? R : jwt(ctx, p.value, where, name)
    rest(ctx, p, ['name', 'value'], where)
  }
}

function walkJson(ctx: Ctx, v: unknown, where: string, key: string, forced: boolean): unknown {
  if (typeof v === 'string') return forced && v !== '' && ctx.hit('query', where, key, v) ? R : jwt(ctx, v, where, key)
  if (typeof v === 'number') return forced && ctx.hit('query', where, key, String(v)) ? R : v
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) v[i] = walkJson(ctx, v[i], where, key, forced)
  } else if (isObj(v)) {
    for (const k of Object.keys(v)) v[k] = walkJson(ctx, v[k], where, k, forced || NAME_RE.test(k))
  }
  return v
}

const KV_RE = /"([^"\\]*)"(\s*:\s*)("(?:[^"\\]|\\.)*"|-?\d[\d.eE+-]*)/g
const MULTIPART_RE = /(name="([^"]*)"[^\r\n]*(?:\r?\n[^\r\n]+)*\r?\n\r?\n)([^\r\n]*)/g

/** Scrubs body text. `parse` false keeps the text byte-identical outside the replaced spans. */
function scrubText(ctx: Ctx, s: string, mime: string, where: string, parse: boolean): string {
  const m = mime.toLowerCase()
  let out = s
  if (m.includes('x-www-form-urlencoded')) {
    out = pairs(ctx, s, where)
  } else if (m.includes('multipart/form-data')) {
    out = s.replace(MULTIPART_RE, (all, head: string, name: string, val: string) =>
      val && NAME_RE.test(name) && ctx.hit('query', where, name, val) ? head + R : all,
    )
  } else if (m.includes('json') || /^\s*[[{]/.test(s)) {
    let parsed: { v: unknown } | null = null
    if (parse) {
      try {
        parsed = { v: JSON.parse(s) }
      } catch {
        /* not valid JSON: fall back to key matching below */
      }
    }
    if (parsed) {
      const before = ctx.count
      const v = walkJson(ctx, parsed.v, where, 'body', false)
      return ctx.count > before ? JSON.stringify(v) : s
    }
    out = s.replace(KV_RE, (all, k: string, sep: string, val: string) =>
      val !== '""' && NAME_RE.test(k) && ctx.hit('query', where, k, val) ? `"${k}"${sep}"${R}"` : all,
    )
  }
  return jwt(ctx, out, where, 'JWT')
}

function body(ctx: Ctx, text: string, mime: string, where: string, base64: boolean): string {
  if (!base64) return scrubText(ctx, text, mime, where, true)
  let bin: string
  try {
    bin = atob(text.replace(/\s+/g, ''))
  } catch {
    return scrubText(ctx, text, mime, where, true)
  }
  const out = scrubText(ctx, bin, mime, where, false)
  return out === bin ? text : btoa(out)
}

function message(ctx: Ctx, m: Rec, where: string) {
  for (const k of Object.keys(m)) {
    const v = m[k]
    if ((k === 'url' || k === 'redirectURL') && typeof v === 'string') {
      m[k] = url(ctx, v, `${where} ${k === 'url' ? 'URL' : 'redirect URL'}`)
    } else if (k === 'headers' && Array.isArray(v)) {
      headers(ctx, v, where)
    } else if (k === 'cookies' && Array.isArray(v)) {
      namedValues(ctx, v, `${where} cookie`, 'cookies')
    } else if (k === 'queryString' && Array.isArray(v)) {
      namedValues(ctx, v, `${where} query`, 'query')
    } else if (k === 'postData' && isObj(v)) {
      postData(ctx, v, where)
    } else if (k === 'content' && isObj(v)) {
      content(ctx, v, where)
    } else {
      m[k] = generic(ctx, v, where, k)
    }
  }
}

function postData(ctx: Ctx, p: Rec, where: string) {
  const w = `${where} body`
  const mime = typeof p.mimeType === 'string' ? p.mimeType : ''
  const hasParams = Array.isArray(p.params) && p.params.length > 0
  if (Array.isArray(p.params)) namedValues(ctx, p.params, `${where} form`, 'query')
  const original = typeof p.text === 'string' ? p.text : ''
  if (original) p.text = body(ctx, original, mime, w, false)
  rest(ctx, p, ['params', 'text'], w)
  if ((original || hasParams) && ctx.hit('bodies', w, 'request body', original || 'form parameters')) {
    if ('text' in p) p.text = ''
    if ('params' in p) p.params = []
  }
}

function content(ctx: Ctx, c: Rec, where: string) {
  const w = `${where} body`
  const mime = typeof c.mimeType === 'string' ? c.mimeType : ''
  const original = typeof c.text === 'string' ? c.text : ''
  if (original) c.text = body(ctx, original, mime, w, c.encoding === 'base64')
  rest(ctx, c, ['text'], w)
  if (original && ctx.hit('bodies', w, 'response body', original)) {
    delete c.text
    delete c.encoding
  }
}

function walk(ctx: Ctx, har: unknown) {
  if (!isObj(har) || !isObj(har.log)) {
    generic(ctx, har, 'file', 'file')
    return
  }
  const log = har.log
  for (const k of Object.keys(log)) {
    const v = log[k]
    if (k === 'entries' && Array.isArray(v)) {
      v.forEach((e, i) => {
        const n = `Entry ${i + 1}`
        if (!isObj(e)) return void (v[i] = generic(ctx, e, n, 'entry'))
        for (const ek of Object.keys(e)) {
          const ev = e[ek]
          if ((ek === 'request' || ek === 'response') && isObj(ev)) message(ctx, ev, `${n} · ${ek}`)
          else e[ek] = generic(ctx, ev, n, ek)
        }
      })
    } else if (k === 'pages' && Array.isArray(v)) {
      v.forEach((p, i) => {
        const w = `Page ${i + 1}`
        if (isObj(p) && typeof p.title === 'string') {
          p.title = url(ctx, p.title, `${w} title`)
          rest(ctx, p, ['title'], w)
        } else v[i] = generic(ctx, p, w, 'page')
      })
    } else {
      log[k] = generic(ctx, v, 'log', k)
    }
  }
}

const ALL: Category[] = ['cookies', 'auth', 'query', 'jwt', 'bodies']

export function analyzeHar(
  text: string,
): { ok: true; har: unknown; findings: Finding[] } | { ok: false; error: string } {
  let har: unknown
  let scratch: unknown
  try {
    har = JSON.parse(text)
    scratch = JSON.parse(text) // walked (and modified) copy; `har` stays pristine
  } catch {
    return { ok: false, error: 'This is not valid JSON, so it cannot be a HAR file.' }
  }
  if (!isObj(har) || !isObj(har.log) || !Array.isArray(har.log.entries)) {
    return { ok: false, error: 'Not a HAR file: no log.entries found.' }
  }
  const ctx = new Ctx(new Set(ALL))
  walk(ctx, scratch)
  return { ok: true, har, findings: ctx.findings }
}

export function redactHar(har: unknown, on: Set<Category>): { text: string; count: number } {
  const copy: unknown = JSON.parse(JSON.stringify(har))
  const ctx = new Ctx(on)
  walk(ctx, copy)
  return { text: JSON.stringify(copy, null, 2), count: ctx.count }
}
