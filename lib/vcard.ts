// vCard (.vcf) parser + CSV export. Handles vCard 2.1 (bare TYPE params,
// QUOTED-PRINTABLE + CHARSET, soft line breaks), 3.0 (RFC 2426) and 4.0
// (RFC 6350, TEL;VALUE=uri:tel:…), multi-contact files, folding and a BOM.
// Pure logic: never throws to the UI.

import { toCsv } from './csv-write'
import { param, parseLine, splitUnescaped, unescapeText, unfold, type ContentLine } from './contentline'

export interface Phone {
  /** Lower-cased TYPE values minus noise (voice/pref…), comma-joined; '' if none. */
  type: string
  value: string
}

export interface Address {
  type: string
  street: string
  locality: string
  region: string
  postalCode: string
  country: string
}

export interface Contact {
  fn: string
  n: { family: string; given: string }
  emails: string[]
  phones: Phone[]
  org: string
  title: string
  adr: Address[]
  note: string
  bday: string
  url: string
}

export type VcardResult =
  | { ok: true; contacts: Contact[]; skipped: number }
  | { ok: false; error: string }

export type CsvPreset = 'generic' | 'google' | 'outlook'

/* ---- parsing -------------------------------------------------------- */

function decodeQuotedPrintable(value: string, charset: string): string {
  const bytes: number[] = []
  const enc = new TextEncoder()
  for (let i = 0; i < value.length; i++) {
    const hex = value.slice(i + 1, i + 3)
    if (value[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(hex)) {
      bytes.push(parseInt(hex, 16))
      i += 2
    } else {
      bytes.push(...enc.encode(value[i]))
    }
  }
  const data = new Uint8Array(bytes)
  try {
    return new TextDecoder(charset || 'utf-8').decode(data)
  } catch {
    return new TextDecoder('utf-8').decode(data)
  }
}

/** Raw value after transfer decoding (escapes still present). */
function rawValue(cl: ContentLine): string {
  const enc = (param(cl, 'ENCODING') ?? '').toUpperCase()
  if (enc === 'QUOTED-PRINTABLE') return decodeQuotedPrintable(cl.value, param(cl, 'CHARSET') ?? 'utf-8')
  if (enc === 'BASE64' || enc === 'B') return '' // binary (photos/keys) — not exported
  return cl.value
}

const TYPE_NOISE = new Set(['voice', 'pref', 'internet', 'x400', 'msg', 'text', 'dom', 'intl', 'postal', 'parcel'])

function typesOf(cl: ContentLine): string {
  return (cl.params.TYPE ?? [])
    .map((t) => t.toLowerCase())
    .filter((t) => !TYPE_NOISE.has(t))
    .join(',')
}

function buildContact(lines: ContentLine[]): Contact | null {
  const c: Contact = {
    fn: '',
    n: { family: '', given: '' },
    emails: [],
    phones: [],
    org: '',
    title: '',
    adr: [],
    note: '',
    bday: '',
    url: '',
  }
  const text = (cl: ContentLine) => unescapeText(rawValue(cl)).trim()
  const parts = (cl: ContentLine) => splitUnescaped(rawValue(cl), ';').map((p) => unescapeText(p).trim())

  for (const cl of lines) {
    switch (cl.name) {
      case 'FN':
        if (!c.fn) c.fn = text(cl)
        break
      case 'N': {
        const [family = '', given = ''] = parts(cl)
        c.n = { family, given }
        break
      }
      case 'EMAIL': {
        const v = text(cl).replace(/^mailto:/i, '')
        if (v) c.emails.push(v)
        break
      }
      case 'TEL': {
        const v = text(cl).replace(/^tel:/i, '')
        if (v) c.phones.push({ type: typesOf(cl), value: v })
        break
      }
      case 'ORG':
        if (!c.org) c.org = parts(cl).filter(Boolean).join(' - ')
        break
      case 'TITLE':
        if (!c.title) c.title = text(cl)
        break
      case 'ADR': {
        const [pobox = '', ext = '', street = '', locality = '', region = '', postalCode = '', country = ''] = parts(cl)
        const a = {
          type: typesOf(cl),
          street: [pobox, ext, street].filter(Boolean).join(', '),
          locality,
          region,
          postalCode,
          country,
        }
        if (a.street || a.locality || a.region || a.postalCode || a.country) c.adr.push(a)
        break
      }
      case 'NOTE':
        if (!c.note) c.note = text(cl)
        break
      case 'BDAY':
        if (!c.bday) c.bday = text(cl)
        break
      case 'URL':
        if (!c.url) c.url = text(cl)
        break
    }
  }
  if (!c.fn) c.fn = [c.n.given, c.n.family].filter(Boolean).join(' ')
  if (!c.fn && !c.emails.length && !c.phones.length && !c.org) return null
  return c
}

export function parseVcards(text: string): VcardResult {
  const contacts: Contact[] = []
  let skipped = 0
  let seen = false
  let cur: ContentLine[] | null = null
  for (const line of unfold(text, true)) {
    const cl = parseLine(line)
    if (!cl) continue
    const v = cl.value.trim().toUpperCase()
    if (cl.name === 'BEGIN' && v === 'VCARD') {
      if (cur) skipped++ // previous card never ended
      cur = []
      seen = true
    } else if (cl.name === 'END' && v === 'VCARD') {
      if (cur) {
        const c = buildContact(cur)
        if (c) contacts.push(c)
        else skipped++
      }
      cur = null
    } else if (cur) {
      cur.push(cl)
    }
  }
  if (cur) skipped++
  if (!seen) return { ok: false, error: 'No vCard found — the text should contain BEGIN:VCARD … END:VCARD.' }
  return { ok: true, contacts, skipped }
}

/* ---- CSV export ----------------------------------------------------- */

/** `19900115` → `1990-01-15`; strips a time part; leaves other forms as-is. */
function isoDate(bday: string): string {
  const d = bday.split('T')[0]
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(d)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : d
}

export function formatAddress(a: Address): string {
  return [a.street, a.locality, [a.region, a.postalCode].filter(Boolean).join(' '), a.country].filter(Boolean).join(', ')
}

/** Human phone label, matching Google Contacts' phone types. */
export function phoneLabel(type: string): string {
  const t = type.split(',')
  if (t.some((x) => x === 'cell' || x === 'mobile' || x === 'iphone')) return 'Mobile'
  if (t.includes('fax')) return t.includes('work') ? 'Work Fax' : t.includes('home') ? 'Home Fax' : 'Other Fax'
  if (t.includes('pager')) return 'Pager'
  if (t.includes('main')) return 'Main'
  if (t.includes('work')) return 'Work'
  if (t.includes('home')) return 'Home'
  return 'Other'
}

function adrLabel(type: string): string {
  const t = type.split(',')
  return t.includes('work') ? 'Work' : t.includes('home') ? 'Home' : 'Other'
}

function maxOf(contacts: Contact[], pick: (c: Contact) => unknown[]): number {
  return Math.max(1, ...contacts.map((c) => pick(c).length))
}

function genericCsv(contacts: Contact[]): string {
  const E = maxOf(contacts, (c) => c.emails)
  const P = maxOf(contacts, (c) => c.phones)
  const A = maxOf(contacts, (c) => c.adr)
  const range = (n: number) => Array.from({ length: n }, (_, i) => i)
  const header = [
    'Full name',
    'Given name',
    'Family name',
    ...range(E).map((i) => `Email ${i + 1}`),
    ...range(P).flatMap((i) => [`Phone ${i + 1}`, `Phone ${i + 1} type`]),
    'Organization',
    'Title',
    ...range(A).map((i) => `Address ${i + 1}`),
    'Birthday',
    'Website',
    'Note',
  ]
  const rows = contacts.map((c) => [
    c.fn,
    c.n.given,
    c.n.family,
    ...range(E).map((i) => c.emails[i] ?? ''),
    ...range(P).flatMap((i) => (c.phones[i] ? [c.phones[i].value, phoneLabel(c.phones[i].type)] : ['', ''])),
    c.org,
    c.title,
    ...range(A).map((i) => (c.adr[i] ? formatAddress(c.adr[i]) : '')),
    isoDate(c.bday),
    c.url,
    c.note,
  ])
  return toCsv([header, ...rows])
}

// Google Contacts: the classic Google CSV columns, still accepted by
// contacts.google.com → Import ("Name, Given Name, Family Name, E-mail 1 - Type,
// E-mail 1 - Value, Phone 1 - Type, Phone 1 - Value, Address 1 - Formatted,
// Organization 1 - Name, Organization 1 - Title, Website 1 - Value, Birthday,
// Notes"). Ref: Google Contacts help "Import contacts" + Google's own CSV
// export ("Google CSV"); numbered groups repeat as N grows.
function googleCsv(contacts: Contact[]): string {
  const E = maxOf(contacts, (c) => c.emails)
  const P = maxOf(contacts, (c) => c.phones)
  const A = maxOf(contacts, (c) => c.adr)
  const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1)
  const header = [
    'Name',
    'Given Name',
    'Family Name',
    'Birthday',
    'Notes',
    ...range(E).flatMap((i) => [`E-mail ${i} - Type`, `E-mail ${i} - Value`]),
    ...range(P).flatMap((i) => [`Phone ${i} - Type`, `Phone ${i} - Value`]),
    ...range(A).flatMap((i) => [
      `Address ${i} - Type`,
      `Address ${i} - Formatted`,
      `Address ${i} - Street`,
      `Address ${i} - City`,
      `Address ${i} - Region`,
      `Address ${i} - Postal Code`,
      `Address ${i} - Country`,
    ]),
    'Organization 1 - Name',
    'Organization 1 - Title',
    'Website 1 - Type',
    'Website 1 - Value',
  ]
  const rows = contacts.map((c) => [
    c.fn,
    c.n.given,
    c.n.family,
    isoDate(c.bday),
    c.note,
    ...range(E).flatMap((i) => (c.emails[i - 1] ? ['Other', c.emails[i - 1]] : ['', ''])),
    ...range(P).flatMap((i) => {
      const p = c.phones[i - 1]
      return p ? [phoneLabel(p.type), p.value] : ['', '']
    }),
    ...range(A).flatMap((i) => {
      const a = c.adr[i - 1]
      return a
        ? [adrLabel(a.type), formatAddress(a), a.street, a.locality, a.region, a.postalCode, a.country]
        : ['', '', '', '', '', '', '']
    }),
    c.org,
    c.title,
    c.url ? 'Homepage' : '',
    c.url,
  ])
  return toCsv([header, ...rows])
}

// Outlook: column names from Microsoft's "Create or edit .csv files to import
// into Outlook" template (support.microsoft.com, article 285a3b55-8d93-4ac8-
// 93df-43fffd13b2f1). Outlook has fixed slots (3 e-mails, one phone per kind,
// one Home + one Business address); anything that doesn't fit goes to Notes so
// no data is silently dropped.
const OUTLOOK_HEADER = [
  'First Name',
  'Last Name',
  'Company',
  'Job Title',
  'E-mail Address',
  'E-mail 2 Address',
  'E-mail 3 Address',
  'Mobile Phone',
  'Home Phone',
  'Business Phone',
  'Business Fax',
  'Home Fax',
  'Pager',
  'Other Phone',
  'Home Street',
  'Home City',
  'Home State',
  'Home Postal Code',
  'Home Country/Region',
  'Business Street',
  'Business City',
  'Business State',
  'Business Postal Code',
  'Business Country/Region',
  'Web Page',
  'Birthday',
  'Notes',
]

const OUTLOOK_PHONE_SLOT: Record<string, string> = {
  Mobile: 'Mobile Phone',
  Home: 'Home Phone',
  Work: 'Business Phone',
  Main: 'Business Phone',
  'Work Fax': 'Business Fax',
  'Other Fax': 'Business Fax',
  'Home Fax': 'Home Fax',
  Pager: 'Pager',
  Other: 'Other Phone',
}

function outlookCsv(contacts: Contact[]): string {
  const rows = contacts.map((c) => {
    const r: Record<string, string> = {}
    const extra: string[] = []
    const fill = (col: string, v: string) => {
      if (!r[col]) r[col] = v
      else return false
      return true
    }
    r['First Name'] = c.n.given || (c.n.family ? '' : c.fn)
    r['Last Name'] = c.n.family
    r['Company'] = c.org
    r['Job Title'] = c.title
    c.emails.forEach((e, i) => {
      const col = ['E-mail Address', 'E-mail 2 Address', 'E-mail 3 Address'][i]
      if (col) r[col] = e
      else extra.push(`E-mail: ${e}`)
    })
    for (const p of c.phones) {
      const label = phoneLabel(p.type)
      if (!fill(OUTLOOK_PHONE_SLOT[label], p.value) && !fill('Other Phone', p.value)) extra.push(`${label}: ${p.value}`)
    }
    for (const a of c.adr) {
      const kind = adrLabel(a.type) === 'Work' ? 'Business' : 'Home'
      if (r[`${kind} Street`] || r[`${kind} City`]) {
        extra.push(`Address: ${formatAddress(a)}`)
        continue
      }
      r[`${kind} Street`] = a.street
      r[`${kind} City`] = a.locality
      r[`${kind} State`] = a.region
      r[`${kind} Postal Code`] = a.postalCode
      r[`${kind} Country/Region`] = a.country
    }
    r['Web Page'] = c.url
    r['Birthday'] = isoDate(c.bday)
    r['Notes'] = [c.note, ...extra].filter(Boolean).join('\n')
    return OUTLOOK_HEADER.map((h) => r[h] ?? '')
  })
  return toCsv([OUTLOOK_HEADER, ...rows])
}

export function contactsToCsv(contacts: Contact[], preset: CsvPreset): string {
  if (preset === 'google') return googleCsv(contacts)
  if (preset === 'outlook') return outlookCsv(contacts)
  return genericCsv(contacts)
}
