// Content-type → QR payload strings. Pure functions, no I/O.
// Formats follow what phone scanners (ZXing, iOS, Google Lens) recognise.

export type QrType =
  | 'url' | 'text' | 'wifi' | 'vcard' | 'mecard' | 'email' | 'sms' | 'phone' | 'whatsapp' | 'geo' | 'event' | 'upi'
export type Result = { ok: true; text: string } | { ok: false; error: string }

/** NPCI-style virtual payment address: handle@bank. */
export const UPI_ID = /^[\w.-]{2,256}@[a-zA-Z]{2,64}$/

const UPI_MAX = 100000

const ok = (text: string): Result => ({ ok: true, text })
const fail = (error: string): Result => ({ ok: false, error })
const get = (f: Record<string, string>, k: string) => (f[k] ?? '').trim()

/** Wi-Fi / MeCard escaping (ZXing): backslash-escape \ ; , : " */
const escMe = (s: string) => s.replace(/([\\;,:"])/g, '\\$1')
/** vCard / iCalendar text escaping (RFC 6350 / 5545). */
const escV = (s: string) => s.replace(/([\\;,])/g, '\\$1').replace(/\r?\n/g, '\\n')

function wifi(f: Record<string, string>): Result {
  const ssid = f.ssid ?? ''
  if (!ssid) return fail('Enter the network name (SSID).')
  const sec = f.security === 'WEP' || f.security === 'nopass' ? f.security : 'WPA'
  let s = `WIFI:T:${sec};S:${escMe(ssid)};`
  if (sec !== 'nopass') {
    if (!f.password) return fail('Enter the Wi-Fi password, or choose "No password".')
    s += `P:${escMe(f.password)};`
  }
  if (f.hidden) s += `H:${f.hidden === 'true' ? 'true' : 'false'};`
  return ok(s + ';')
}

function upi(f: Record<string, string>): Result {
  const pa = get(f, 'pa')
  if (!UPI_ID.test(pa)) return fail('Enter a valid UPI ID, like name@bank.')
  const parts = [`pa=${encodeURIComponent(pa)}`]
  const pn = get(f, 'pn')
  if (pn) parts.push(`pn=${encodeURIComponent(pn)}`)
  const am = get(f, 'am')
  if (am) {
    if (!/^\d+(\.\d{1,2})?$/.test(am) || Number(am) <= 0) return fail('Enter an amount in rupees, with at most 2 decimals.')
    if (Number(am) > UPI_MAX) return fail('UPI amounts are capped at ₹1,00,000 for this kind of payment.')
    parts.push(`am=${Number(am).toFixed(2)}`)
  }
  parts.push('cu=INR')
  const tn = get(f, 'tn')
  if (tn) parts.push(`tn=${encodeURIComponent(tn)}`)
  return ok(`upi://pay?${parts.join('&')}`)
}

function vcard(f: Record<string, string>): Result {
  const name = get(f, 'name')
  if (!name) return fail('Enter a name.')
  const words = name.split(/\s+/)
  const family = words.length > 1 ? words.pop()! : ''
  const given = words.join(' ')
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${escV(family)};${escV(given)};;;`, `FN:${escV(name)}`]
  const org = get(f, 'org')
  if (org) lines.push(`ORG:${escV(org)}`)
  const phone = get(f, 'phone')
  if (phone) lines.push(`TEL;TYPE=CELL:${escV(phone)}`)
  const email = get(f, 'email')
  if (email) lines.push(`EMAIL:${escV(email)}`)
  const url = get(f, 'url')
  if (url) lines.push(`URL:${escV(url)}`)
  lines.push('END:VCARD')
  return ok(lines.join('\r\n'))
}

function mecard(f: Record<string, string>): Result {
  const name = get(f, 'name')
  if (!name) return fail('Enter a name.')
  let s = `MECARD:N:${escMe(name)};`
  const phone = get(f, 'phone')
  if (phone) s += `TEL:${escMe(phone)};`
  const email = get(f, 'email')
  if (email) s += `EMAIL:${escMe(email)};`
  return ok(s + ';')
}

function email(f: Record<string, string>): Result {
  const to = get(f, 'to')
  if (!/^[^\s@]+@[^\s@]+$/.test(to)) return fail('Enter an email address.')
  const q: string[] = []
  const subject = get(f, 'subject')
  if (subject) q.push(`subject=${encodeURIComponent(subject)}`)
  const body = f.body ?? ''
  if (body.trim()) q.push(`body=${encodeURIComponent(body)}`)
  return ok(`mailto:${to}${q.length ? `?${q.join('&')}` : ''}`)
}

const cleanPhone = (p: string) => p.replace(/[\s().-]/g, '')

function phoneNumber(f: Record<string, string>): string | null {
  const p = cleanPhone(get(f, 'phone'))
  return /^\+?\d{3,15}$/.test(p) ? p : null
}

function geo(f: Record<string, string>): Result {
  const lat = get(f, 'lat')
  const lon = get(f, 'lon')
  const num = /^-?\d+(\.\d+)?$/
  if (!num.test(lat) || Math.abs(Number(lat)) > 90) return fail('Latitude must be a number between -90 and 90.')
  if (!num.test(lon) || Math.abs(Number(lon)) > 180) return fail('Longitude must be a number between -180 and 180.')
  return ok(`geo:${lat},${lon}`)
}

/** `2026-10-08T09:00` (datetime-local) → `20261008T090000` (floating local time). */
function icsTime(v: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(v)
  return m ? `${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}${m[6] ?? '00'}` : null
}

function event(f: Record<string, string>): Result {
  const title = get(f, 'title')
  if (!title) return fail('Enter an event title.')
  const start = icsTime(get(f, 'start'))
  if (!start) return fail('Enter a start date and time.')
  const end = icsTime(get(f, 'end'))
  if (get(f, 'end') && !end) return fail('Enter a valid end date and time.')
  if (end && end < start) return fail('The event ends before it starts.')
  const lines = ['BEGIN:VEVENT', `SUMMARY:${escV(title)}`, `DTSTART:${start}`]
  if (end) lines.push(`DTEND:${end}`)
  const location = get(f, 'location')
  if (location) lines.push(`LOCATION:${escV(location)}`)
  lines.push('END:VEVENT')
  return ok(lines.join('\r\n'))
}

export function buildPayload(type: QrType, f: Record<string, string>): Result {
  switch (type) {
    case 'url': {
      const u = get(f, 'url')
      if (!u) return fail('Enter a link.')
      if (/\s/.test(u)) return fail('A link cannot contain spaces.')
      return ok(/^[a-z][a-z0-9+.-]*:\/\//i.test(u) ? u : `https://${u}`)
    }
    case 'text':
      return (f.text ?? '').trim() ? ok(f.text) : fail('Enter some text.')
    case 'wifi':
      return wifi(f)
    case 'vcard':
      return vcard(f)
    case 'mecard':
      return mecard(f)
    case 'email':
      return email(f)
    case 'sms': {
      const p = phoneNumber(f)
      return p ? ok(`SMSTO:${p}:${f.message ?? ''}`) : fail('Enter a phone number.')
    }
    case 'phone': {
      const p = phoneNumber(f)
      return p ? ok(`tel:${p}`) : fail('Enter a phone number.')
    }
    case 'whatsapp': {
      const digits = get(f, 'phone').replace(/\D/g, '')
      if (digits.length < 8 || digits.length > 15) return fail('Enter the number with country code, like +91 98450 00000.')
      const text = f.text ?? ''
      return ok(`https://wa.me/${digits}${text.trim() ? `?text=${encodeURIComponent(text)}` : ''}`)
    }
    case 'geo':
      return geo(f)
    case 'event':
      return event(f)
    case 'upi':
      return upi(f)
    default:
      return fail('Unknown content type.')
  }
}
