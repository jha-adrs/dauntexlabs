import { describe, it, expect } from 'vitest'
import { analyzeHar, maskSecret, redactHar, type Category } from '@/lib/har'

const JWT_AUTH = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhdXRoIn0.authSig_123'
const JWT_BODY = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJib2R5In0.bodySig_456'
const JWT_REDIRECT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJyZWRpciJ9.redirSig_789'
const JWT_HEADER = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoZHIifQ.hdrSig_000'
const JWT_B64 = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJiNjQifQ.b64Sig_111'

const S = {
  reqCookie: 'reqCookieSecretValue1',
  reqCookieArr: 'reqCookieArraySecret2',
  resCookie: 'resCookieSecretValue3',
  apiKey: 'apiKeySecretValue4444',
  accessToken: 'accessTokenSecret5555',
  password: 'passwordSecret666666',
  refresh: 'refreshTokenSecret7777',
  code: 'oauthCodeSecret88888',
  idToken: 'fragmentIdToken99999',
  csrf: 'csrfTokenSecretAAAAA',
  xAuth: 'xAuthTokenSecretBBBBB',
  basic: 'Basic dXNlcjpwYXNzd29yZA==',
}

function fixture() {
  return {
    log: {
      version: '1.2',
      creator: { name: 'test', version: '1' },
      entries: [
        {
          startedDateTime: '2026-10-08T00:00:00Z',
          request: {
            method: 'POST',
            url: `https://api.example.com/v1/items?access_token=${S.accessToken}&page=2#id_token=${S.idToken}`,
            headers: [
              { name: 'Cookie', value: `sid=${S.reqCookie}; theme=dark` },
              { name: 'Authorization', value: `Bearer ${JWT_AUTH}` },
              { name: 'X-Api-Key', value: S.apiKey },
              { name: 'x-auth-token', value: S.xAuth },
              { name: 'proxy-authorization', value: S.basic },
              { name: 'X-CSRF-Token', value: S.csrf },
              { name: 'Referer', value: `https://app.example.com/callback?code=${S.code}&state=ok` },
              { name: 'Accept', value: 'application/json' },
            ],
            cookies: [{ name: 'sid', value: S.reqCookieArr }],
            queryString: [
              { name: 'access_token', value: S.accessToken },
              { name: 'page', value: '2' },
            ],
            postData: {
              mimeType: 'application/x-www-form-urlencoded',
              params: [
                { name: 'username', value: 'bob' },
                { name: 'password', value: S.password },
              ],
              text: `username=bob&password=${S.password}`,
            },
          },
          response: {
            status: 302,
            headers: [
              { name: 'Set-Cookie', value: `sid=${S.resCookie}; Path=/; HttpOnly` },
              { name: 'X-Trace', value: JWT_HEADER },
              { name: 'Content-Type', value: 'application/json' },
            ],
            cookies: [{ name: 'sid', value: S.resCookie, path: '/' }],
            content: {
              mimeType: 'application/json',
              text: JSON.stringify({ user: 'bob', id_token: JWT_BODY, note: `see ${JWT_BODY}` }),
            },
            redirectURL: `https://app.example.com/next/${JWT_REDIRECT}`,
          },
        },
        {
          startedDateTime: '2026-10-08T00:00:01Z',
          request: {
            method: 'POST',
            url: 'https://api.example.com/v1/refresh',
            headers: [],
            cookies: [],
            queryString: [],
            postData: { mimeType: 'application/json', text: JSON.stringify({ refresh_token: S.refresh, keep: 'visible-value' }) },
          },
          response: {
            status: 200,
            headers: [],
            cookies: [],
            content: { mimeType: 'application/octet-stream', encoding: 'base64', text: btoa(`prefix ${JWT_B64} suffix`) },
            redirectURL: '',
          },
        },
      ],
    },
  }
}

const ALL: Category[] = ['cookies', 'auth', 'query', 'jwt', 'bodies']
const SECRETS = [...Object.values(S), JWT_AUTH, JWT_BODY, JWT_REDIRECT, JWT_HEADER]

function load() {
  const r = analyzeHar(JSON.stringify(fixture()))
  if (!r.ok) throw new Error(r.error)
  return r
}

describe('maskSecret', () => {
  it('masks short values entirely', () => {
    expect(maskSecret('abc')).toBe('••••')
    expect(maskSecret('1234567')).toBe('••••')
  })
  it('shows the first 3 chars and the length', () => {
    expect(maskSecret('abcdefghij')).toBe('abc… (10 chars)')
  })
  it('never returns the full value', () => {
    for (const v of ['12345678', SECRETS[0], JWT_AUTH]) expect(maskSecret(v)).not.toContain(v)
  })
})

describe('analyzeHar', () => {
  it('rejects invalid JSON', () => {
    const r = analyzeHar('{nope')
    expect(r.ok).toBe(false)
  })
  it('rejects JSON without log.entries', () => {
    expect(analyzeHar('{}').ok).toBe(false)
    expect(analyzeHar('{"log":{}}').ok).toBe(false)
    expect(analyzeHar('[]').ok).toBe(false)
  })
  it('finds every category and masks previews', () => {
    const { findings } = load()
    const cats = new Set(findings.map((f) => f.category))
    for (const c of ALL) expect(cats.has(c), c).toBe(true)
    for (const f of findings) for (const s of SECRETS) expect(f.preview).not.toContain(s)
  })
  it('names the header, cookie and parameter', () => {
    const { findings } = load()
    const names = findings.map((f) => `${f.category}:${f.name}`)
    expect(names).toEqual(expect.arrayContaining(['cookies:Cookie', 'cookies:Set-Cookie', 'cookies:sid', 'auth:Authorization', 'auth:X-Api-Key', 'query:access_token', 'query:password', 'query:refresh_token']))
  })
})

describe('redactHar', () => {
  it('removes every secret with all categories on, and counts exactly the findings', () => {
    const { har, findings } = load()
    const { text, count } = redactHar(har, new Set(ALL))
    for (const s of SECRETS) expect(text, s).not.toContain(s)
    expect(text).not.toMatch(/eyJ[\w-]+\.[\w-]+\./)
    expect(text).toContain('page=2')
    expect(text).toContain('api.example.com')
    expect(count).toBe(findings.length)
    expect(() => JSON.parse(text)).not.toThrow()
  })

  it('without bodies: removes secrets, keeps bodies, counts the non-body findings', () => {
    const { har, findings } = load()
    const { text, count } = redactHar(har, new Set<Category>(['cookies', 'auth', 'query', 'jwt']))
    for (const s of SECRETS) expect(text, s).not.toContain(s)
    expect(count).toBe(findings.filter((f) => f.category !== 'bodies').length)
    const out = JSON.parse(text)
    const e0 = out.log.entries[0]
    const e1 = out.log.entries[1]
    expect(e0.request.url).toBe('https://api.example.com/v1/items?access_token=REDACTED&page=2#id_token=REDACTED')
    expect(e0.request.postData.text).toBe('username=bob&password=REDACTED')
    expect(e0.request.postData.params[0].value).toBe('bob')
    expect(e0.request.postData.params[1].value).toBe('[REDACTED]')
    expect(e0.request.cookies[0].value).toBe('[REDACTED]')
    expect(e0.request.headers.find((h: { name: string }) => h.name === 'Cookie').value).toBe('sid=[REDACTED]; theme=[REDACTED]')
    expect(e0.request.headers.find((h: { name: string }) => h.name === 'Accept').value).toBe('application/json')
    expect(e0.response.headers[0].value).toBe('sid=[REDACTED]; Path=/; HttpOnly')
    expect(e0.response.redirectURL).toBe('https://app.example.com/next/REDACTED')
    expect(JSON.parse(e0.response.content.text).user).toBe('bob')
    const refreshBody = JSON.parse(e1.request.postData.text)
    expect(refreshBody).toEqual({ refresh_token: '[REDACTED]', keep: 'visible-value' })
    // base64 bodies are decoded, scrubbed and re-encoded
    expect(e1.response.content.encoding).toBe('base64')
    expect(atob(e1.response.content.text)).toBe('prefix [REDACTED] suffix')
  })

  it('with bodies on, drops request and response bodies', () => {
    const { har } = load()
    const out = JSON.parse(redactHar(har, new Set<Category>(['bodies'])).text)
    const e0 = out.log.entries[0]
    expect(e0.request.postData.text).toBe('')
    expect(e0.request.postData.params).toEqual([])
    expect(e0.response.content.text).toBeUndefined()
    expect(out.log.entries[1].response.content.text).toBeUndefined()
  })

  it('with only cookies on, leaves JWTs and auth headers', () => {
    const { har } = load()
    const { text } = redactHar(har, new Set<Category>(['cookies']))
    for (const s of [S.reqCookie, S.reqCookieArr, S.resCookie]) expect(text).not.toContain(s)
    expect(text).toContain(JWT_BODY)
    expect(text).toContain(JWT_AUTH)
    expect(text).toContain(S.apiKey)
  })

  it('matches header names case-insensitively', () => {
    const { har } = load()
    const out = JSON.parse(redactHar(har, new Set<Category>(['auth'])).text)
    const h = Object.fromEntries(out.log.entries[0].request.headers.map((x: { name: string; value: string }) => [x.name, x.value]))
    expect(h['x-auth-token']).toBe('[REDACTED]')
    expect(h['proxy-authorization']).toBe('[REDACTED]')
    expect(h['Authorization']).toBe('[REDACTED]')
    expect(h['X-CSRF-Token']).toBe('[REDACTED]')
  })

  it('still scrubs a JWT inside an auth header when only jwt is on', () => {
    const { har } = load()
    const { text } = redactHar(har, new Set<Category>(['jwt']))
    expect(text).not.toContain(JWT_AUTH)
    expect(text).toContain('Bearer [REDACTED]')
    expect(text).toContain(S.basic)
    expect(text).not.toContain(JWT_HEADER)
    expect(text).not.toContain(JWT_REDIRECT)
  })

  it('does not modify the analysed HAR (can redact repeatedly)', () => {
    const { har } = load()
    redactHar(har, new Set(ALL))
    const again = redactHar(har, new Set<Category>()).text
    expect(again).toContain(S.reqCookie)
    expect(redactHar(har, new Set<Category>()).count).toBe(0)
  })

  it('handles JSON bodies that are not valid JSON via key matching', () => {
    const har = { log: { entries: [{ request: { url: 'https://x.test/', postData: { mimeType: 'application/json', text: '{"api_key": "brokenSecretValue", "a": 1' } } }] } }
    const { text } = redactHar(har, new Set<Category>(['query']))
    expect(text).not.toContain('brokenSecretValue')
  })

  it('scrubs JWTs in unknown fields (e.g. websocket messages)', () => {
    const har = { log: { entries: [{ request: { url: 'https://x.test/' }, _webSocketMessages: [{ data: `{"t":"${JWT_BODY}"}` }] }] } }
    const { text, count } = redactHar(har, new Set<Category>(['jwt']))
    expect(text).not.toContain(JWT_BODY)
    expect(count).toBe(1)
  })
})

describe('review fixes', () => {
  const ALL_BUT_BODIES = new Set<Category>(['cookies', 'auth', 'query', 'jwt'])
  const one = (entry: Record<string, unknown>) => JSON.stringify({ log: { version: '1.2', entries: [entry] } })
  const req = (headers: { name: string; value: string }[]) => ({
    request: { method: 'GET', url: 'https://a.example/api', headers, cookies: [], queryString: [] },
    response: { status: 200, headers: [], cookies: [], content: { size: 0, mimeType: 'text/plain', text: '' } },
  })

  it('redacts tokens in the HTTP/2 :path pseudo-header and leaves :authority alone', () => {
    const r = analyzeHar(one(req([{ name: ':path', value: '/api?access_token=SECRETPATH123&page=2' }, { name: ':authority', value: 'a.example' }])))
    if (!r.ok) throw new Error(r.error)
    const out = redactHar(r.har, ALL_BUT_BODIES).text
    expect(out).not.toContain('SECRETPATH123')
    expect(out).toContain('page=2')
    expect(out).toContain('"a.example"')
  })

  it('scrubs WebSocket messages, and drops them with bodies', () => {
    const entry = { ...req([]), _webSocketMessages: [{ type: 'send', time: 1, opcode: 1, data: '{"password":"SECRETWS123","token":"SECRETWS456","n":1}' }] }
    const r = analyzeHar(one(entry))
    if (!r.ok) throw new Error(r.error)
    const out = redactHar(r.har, ALL_BUT_BODIES).text
    expect(out).not.toContain('SECRETWS123')
    expect(out).not.toContain('SECRETWS456')
    const dropped = redactHar(r.har, new Set<Category>(['bodies'])).text
    expect(dropped).not.toContain('SECRETWS123')
  })
})
