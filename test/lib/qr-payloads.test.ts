import { describe, it, expect } from 'vitest'
import { buildPayload, UPI_ID } from '@/lib/qr/payloads'

function ok(r: ReturnType<typeof buildPayload>): string {
  if (!r.ok) throw new Error(`expected ok, got error: ${r.error}`)
  return r.text
}

describe('buildPayload — wifi', () => {
  it('escapes \\ ; , : " in SSID and password (ZXing spec)', () => {
    const r = buildPayload('wifi', { ssid: 'My;Net', password: 'p:a,s"s\\', security: 'WPA', hidden: 'false' })
    expect(ok(r)).toBe('WIFI:T:WPA;S:My\\;Net;P:p\\:a\\,s\\"s\\\\;H:false;;')
  })
  it('omits the password for open networks', () => {
    expect(ok(buildPayload('wifi', { ssid: 'x', password: 'ignored', security: 'nopass' }))).toBe('WIFI:T:nopass;S:x;;')
  })
  it('marks hidden networks', () => {
    expect(ok(buildPayload('wifi', { ssid: 'x', password: 'pw', security: 'WPA', hidden: 'true' }))).toBe('WIFI:T:WPA;S:x;P:pw;H:true;;')
  })
  it('requires an SSID', () => {
    expect(buildPayload('wifi', { ssid: '', password: 'x', security: 'WPA' }).ok).toBe(false)
  })
})

describe('buildPayload — upi', () => {
  it('builds an encoded upi://pay link with a 2-decimal amount', () => {
    expect(ok(buildPayload('upi', { pa: 'shop@okhdfc', pn: 'A & B', am: '150.5', tn: 'Tea' }))).toBe(
      'upi://pay?pa=shop%40okhdfc&pn=A%20%26%20B&am=150.50&cu=INR&tn=Tea',
    )
  })
  it('omits am when the amount is empty', () => {
    const t = ok(buildPayload('upi', { pa: 'shop@okhdfc', pn: 'Shop', am: '', tn: '' }))
    expect(t).not.toContain('am=')
    expect(t).toBe('upi://pay?pa=shop%40okhdfc&pn=Shop&cu=INR')
  })
  it('rejects a bad UPI ID', () => {
    expect(buildPayload('upi', { pa: 'bad' }).ok).toBe(false)
    expect(UPI_ID.test('name.1-x@ybl')).toBe(true)
    expect(UPI_ID.test('a@b')).toBe(false)
  })
  it.each(['-1', '1.234', 'abc', '0'])('rejects amount %s', (am) => {
    expect(buildPayload('upi', { pa: 'shop@okhdfc', am }).ok).toBe(false)
  })
  it('caps amounts at ₹1,00,000', () => {
    const r = buildPayload('upi', { pa: 'shop@okhdfc', am: '100001' })
    expect(r).toEqual({ ok: false, error: expect.stringContaining('UPI amounts are capped at ₹1,00,000') })
    expect(buildPayload('upi', { pa: 'shop@okhdfc', am: '100000' }).ok).toBe(true)
  })
})

describe('buildPayload — contacts', () => {
  it('builds a vCard 3.0 with CRLF line endings', () => {
    const t = ok(buildPayload('vcard', { name: 'Asha Rao', phone: '+91 98450 00000', email: 'a@x.in', org: 'X' }))
    expect(t.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')).toBe(true)
    expect(t).toContain('N:Rao;Asha;;;')
    expect(t).toContain('FN:Asha Rao')
    expect(t).toContain('TEL;TYPE=CELL:+91 98450 00000')
    expect(t).toContain('EMAIL:a@x.in')
    expect(t).toContain('ORG:X')
    expect(t.endsWith('END:VCARD')).toBe(true)
  })
  it('escapes ; and , in vCard values', () => {
    const t = ok(buildPayload('vcard', { name: 'Asha', org: 'A;B, C' }))
    expect(t).toContain('ORG:A\\;B\\, C')
  })
  it('requires a name for a vCard', () => {
    expect(buildPayload('vcard', { name: ' ' }).ok).toBe(false)
  })
  it('builds a MeCard with escaping', () => {
    expect(ok(buildPayload('mecard', { name: 'Rao,Asha', phone: '1' }))).toBe('MECARD:N:Rao\\,Asha;TEL:1;;')
  })
})

describe('buildPayload — messaging', () => {
  it('email', () => {
    expect(ok(buildPayload('email', { to: 'a@x.in', subject: 'Hi there', body: 'x' }))).toBe(
      'mailto:a@x.in?subject=Hi%20there&body=x',
    )
  })
  it('sms', () => {
    expect(ok(buildPayload('sms', { phone: '+911234', message: 'hello' }))).toBe('SMSTO:+911234:hello')
  })
  it('phone', () => {
    expect(ok(buildPayload('phone', { phone: '+911234' }))).toBe('tel:+911234')
    expect(buildPayload('phone', { phone: '' }).ok).toBe(false)
  })
  it('whatsapp strips formatting from the number', () => {
    expect(ok(buildPayload('whatsapp', { phone: '+91 98450-00000', text: 'hi' }))).toBe(
      'https://wa.me/919845000000?text=hi',
    )
  })
})

describe('buildPayload — geo, event, url, text', () => {
  it('geo', () => {
    expect(ok(buildPayload('geo', { lat: '12.97', lon: '77.59' }))).toBe('geo:12.97,77.59')
    expect(buildPayload('geo', { lat: '91', lon: '0' }).ok).toBe(false)
    expect(buildPayload('geo', { lat: '0', lon: '181' }).ok).toBe(false)
  })
  it('event', () => {
    const t = ok(buildPayload('event', { title: 'Demo', start: '2026-10-08T09:00', end: '2026-10-08T10:00' }))
    expect(t).toContain('BEGIN:VEVENT')
    expect(t).toContain('SUMMARY:Demo')
    expect(t).toContain('DTSTART:20261008T090000')
    expect(t).toContain('DTEND:20261008T100000')
    expect(t).toContain('END:VEVENT')
  })
  it('event end before start is an error', () => {
    expect(buildPayload('event', { title: 'Demo', start: '2026-10-08T10:00', end: '2026-10-08T09:00' }).ok).toBe(false)
  })
  it('url adds https:// when no scheme is given', () => {
    expect(ok(buildPayload('url', { url: 'example.com' }))).toBe('https://example.com')
    expect(ok(buildPayload('url', { url: 'http://a.b/c?d' }))).toBe('http://a.b/c?d')
    expect(buildPayload('url', { url: '' }).ok).toBe(false)
  })
  it('text must not be empty', () => {
    expect(buildPayload('text', { text: '' }).ok).toBe(false)
    expect(ok(buildPayload('text', { text: 'hello' }))).toBe('hello')
  })
})
