import { describe, it, expect } from 'vitest'
import { decodeWords, parseEml, safeSrcdoc, SANDBOX_CSP } from '@/lib/eml'

const CRLF = '\r\n'
const META = `<meta http-equiv="Content-Security-Policy" content="${SANDBOX_CSP}">`

function ok(raw: string | Uint8Array) {
  const r = parseEml(raw)
  if (!r.ok) throw new Error(r.error)
  return r.email
}

// Wrap base64 at 76 columns as mail clients do.
const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64').replace(/.{76}/g, '$&\r\n')

describe('decodeWords (RFC 2047)', () => {
  it('decodes B-encoded UTF-8', () => {
    expect(decodeWords('=?UTF-8?B?4KS54KS/4KSo4KWN4KSm4KWA?=')).toBe('हिन्दी')
  })
  it('decodes Q-encoded ISO-8859-1 with underscores as spaces', () => {
    expect(decodeWords('=?ISO-8859-1?Q?Caf=E9_ok?=')).toBe('Café ok')
  })
  it('joins adjacent encoded words without the whitespace between them', () => {
    expect(decodeWords('=?UTF-8?Q?Caf=C3=A9?= =?UTF-8?Q?_ok?=')).toBe('Café ok')
    // a multi-byte character split across two words still decodes
    expect(decodeWords('=?UTF-8?B?4KS54KS/?=\r\n =?UTF-8?B?4KSo4KWN4KSm4KWA?=')).toBe('हिन्दी')
  })
  it('keeps plain text and the space between plain and encoded words', () => {
    expect(decodeWords('Re: =?UTF-8?Q?Caf=C3=A9?= menu')).toBe('Re: Café menu')
  })
  it('falls back to UTF-8 for an unknown charset label', () => {
    expect(decodeWords('=?x-made-up?Q?Caf=C3=A9?=')).toBe('Café')
  })
})

describe('parseEml', () => {
  it('decodes a single-part quoted-printable UTF-8 body with soft line breaks', () => {
    const raw = [
      'From: Asha <asha@example.com>',
      'To: Ravi <ravi@example.com>',
      'Subject: =?UTF-8?Q?Caf=C3=A9?=',
      'Date: Thu, 08 Oct 2026 09:00:00 +0530',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      'Meet at the caf=C3=A9 at nine, the one with the very long name that wraps=',
      ' over.',
    ].join(CRLF)
    const e = ok(raw)
    expect(e.subject).toBe('Café')
    expect(e.from).toBe('Asha <asha@example.com>')
    expect(e.to).toBe('Ravi <ravi@example.com>')
    expect(e.date).toBe('Thu, 08 Oct 2026 09:00:00 +0530')
    expect(e.text).toBe('Meet at the café at nine, the one with the very long name that wraps over.')
    expect(e.html).toBeNull()
    expect(e.attachments).toEqual([])
  })

  it('unfolds folded headers', () => {
    const raw = ['Subject: a long', '\tsubject line', 'X-Thing: one', '  two', '', 'body'].join(CRLF)
    const e = ok(raw)
    expect(e.subject).toBe('a long subject line')
    expect(e.headers.find((h) => h.name === 'X-Thing')?.value).toBe('one two')
  })

  it('parses multipart/alternative inside multipart/mixed with a base64 attachment', () => {
    const pdf = new Uint8Array(300).map((_, i) => (i * 37) & 0xff)
    const raw = [
      'From: a@example.com',
      'To: b@example.com',
      'Subject: Report',
      'MIME-Version: 1.0',
      'Content-Type: multipart/mixed;',
      ' boundary="outer-b"',
      '',
      'This is a multi-part message in MIME format.',
      '--outer-b',
      'Content-Type: multipart/alternative; boundary=inner-b',
      '',
      '--inner-b',
      'Content-Type: text/plain; charset="utf-8"',
      'Content-Transfer-Encoding: base64',
      '',
      b64(new TextEncoder().encode('Résumé attached.')),
      '--inner-b',
      'Content-Type: text/html; charset=utf-8',
      '',
      '<p>R&eacute;sum&eacute; <b>attached</b>.</p>',
      '--inner-b--',
      '',
      '--outer-b',
      'Content-Type: application/pdf',
      "Content-Disposition: attachment; filename*=UTF-8''r%C3%A9sum%C3%A9.pdf",
      'Content-Transfer-Encoding: base64',
      '',
      b64(pdf),
      '--outer-b--',
      '',
    ].join(CRLF)
    const e = ok(raw)
    expect(e.text).toBe('Résumé attached.')
    expect(e.html).toBe('<p>R&eacute;sum&eacute; <b>attached</b>.</p>')
    expect(e.attachments).toHaveLength(1)
    expect(e.attachments[0].filename).toBe('résumé.pdf')
    expect(e.attachments[0].mime).toBe('application/pdf')
    expect(e.attachments[0].bytes.length).toBe(300)
    expect(Array.from(e.attachments[0].bytes)).toEqual(Array.from(pdf))
  })

  it('decodes 8bit bodies from raw bytes with the declared charset', () => {
    const head = 'Subject: x\r\nContent-Type: text/plain; charset=iso-8859-1\r\nContent-Transfer-Encoding: 8bit\r\n\r\n'
    const bytes = new Uint8Array([...Array.from(new TextEncoder().encode(head)), 0x43, 0x61, 0x66, 0xe9])
    expect(ok(bytes).text).toBe('Café')
  })

  it('treats pasted text as UTF-8', () => {
    expect(ok('Subject: x\nContent-Type: text/plain; charset=utf-8\n\nCafé हिन्दी').text).toBe('Café हिन्दी')
  })

  it('still parses headers when the blank line before the body is missing', () => {
    const e = ok(['From: a@example.com', 'Subject: No gap', 'Hello there.', 'Second line.'].join(CRLF))
    expect(e.subject).toBe('No gap')
    expect(e.from).toBe('a@example.com')
    expect(e.text).toBe('Hello there.\r\nSecond line.')
  })

  it('joins RFC 2231 continuations and strips path separators from attachment names', () => {
    const raw = [
      'Subject: x',
      'Content-Type: multipart/mixed; boundary=b',
      '',
      '--b',
      'Content-Type: text/plain',
      '',
      'hi',
      '--b',
      'Content-Type: application/octet-stream; name="../../etc/passwd"',
      'Content-Transfer-Encoding: base64',
      '',
      'aGk=',
      '--b',
      'Content-Type: text/plain',
      'Content-Disposition: attachment;',
      " filename*0*=UTF-8''long%20na;",
      ' filename*1="me.txt"',
      '',
      'notes',
      '--b--',
    ].join(CRLF)
    const e = ok(raw)
    expect(e.text).toBe('hi')
    expect(e.attachments.map((a) => a.filename)).toEqual(['passwd', 'long name.txt'])
    expect(new TextDecoder().decode(e.attachments[1].bytes)).toBe('notes')
  })

  it('inlines cid: images from matching attachments as data: URLs', () => {
    const raw = [
      'Subject: x',
      'Content-Type: multipart/related; boundary=r',
      '',
      '--r',
      'Content-Type: text/html; charset=utf-8',
      '',
      '<img src="cid:logo@x"><img src="cid:missing@x">',
      '--r',
      'Content-Type: image/png',
      'Content-ID: <logo@x>',
      'Content-Transfer-Encoding: base64',
      '',
      'iVBORw0KGgo=',
      '--r--',
    ].join(CRLF)
    const e = ok(raw)
    expect(e.html).toBe('<img src="data:image/png;base64,iVBORw0KGgo="><img src="cid:missing@x">')
  })

  it('rejects input with no headers', () => {
    expect(parseEml('').ok).toBe(false)
    expect(parseEml('just some words\nand more').ok).toBe(false)
  })
})

describe('safeSrcdoc', () => {
  it('puts the CSP meta first and strips scripts', () => {
    const out = safeSrcdoc('<img src="https://tracker.example/p.gif"><script>x</script>')
    expect(out.startsWith(META)).toBe(true)
    expect(out).not.toMatch(/<script/i)
  })
  it('strips meta refresh, base and link tags', () => {
    const out = safeSrcdoc(
      '<head><meta http-equiv="refresh" content="0;url=https://x.example"><base href="https://x.example/">' +
        '<link rel="stylesheet" href="https://x.example/a.css"><SCRIPT src="https://x.example/a.js"></SCRIPT></head><p>hi</p>',
    )
    expect(out.startsWith(META)).toBe(true)
    expect(out).not.toMatch(/refresh|<base href|<link|<script/i)
    expect(out).toContain('<p>hi</p>')
  })
  it('blocks remote loads through the CSP itself', () => {
    expect(SANDBOX_CSP).toBe("default-src 'none'; img-src data:; style-src 'unsafe-inline'")
  })
})
