import { describe, it, expect } from 'vitest'
import { parseVcards, contactsToCsv, type Contact } from '@/lib/vcard'

// Vectors follow vCard 2.1 (versit spec, QUOTED-PRINTABLE + CHARSET params),
// RFC 2426 (vCard 3.0) and RFC 6350 (vCard 4.0, TEL;VALUE=uri, line folding §3.2).

function ok(text: string) {
  const r = parseVcards(text)
  if (!r.ok) throw new Error(r.error)
  return r
}

describe('parseVcards', () => {
  it('decodes vCard 2.1 QUOTED-PRINTABLE UTF-8 (=C3=A9 → é)', () => {
    const r = ok(
      [
        'BEGIN:VCARD',
        'VERSION:2.1',
        'N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Ren=C3=A9;Andr=C3=A9;;;',
        'FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Andr=C3=A9 Ren=C3=A9',
        'TEL;CELL:+15551234567',
        'END:VCARD',
      ].join('\r\n'),
    )
    expect(r.contacts).toHaveLength(1)
    expect(r.contacts[0].fn).toBe('André René')
    expect(r.contacts[0].n).toEqual({ family: 'René', given: 'André' })
    expect(r.contacts[0].phones).toEqual([{ type: 'cell', value: '+15551234567' }])
  })

  it('joins QUOTED-PRINTABLE soft line breaks', () => {
    const r = ok(
      [
        'BEGIN:VCARD',
        'VERSION:2.1',
        'FN:Q P',
        'NOTE;ENCODING=QUOTED-PRINTABLE:first line=0D=0Asecond =',
        'part',
        'END:VCARD',
      ].join('\r\n'),
    )
    expect(r.contacts[0].note).toBe('first line\r\nsecond part')
  })

  it('unfolds folded lines (CRLF + space) and strips a BOM', () => {
    const r = ok(
      '﻿' +
        [
          'BEGIN:VCARD',
          'VERSION:3.0',
          'FN:Jane',
          '  Doe',
          'NOTE:This is a long',
          '\t note',
          'END:VCARD',
        ].join('\r\n'),
    )
    expect(r.contacts[0].fn).toBe('Jane Doe')
    expect(r.contacts[0].note).toBe('This is a long note')
  })

  it('reads vCard 3.0 multiple TEL;TYPE=CELL, emails, org, adr, escapes', () => {
    const r = ok(
      [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:Doe;Jane;;;',
        'FN:Jane Doe',
        'TEL;TYPE=CELL:+1 555 0100',
        'TEL;TYPE=CELL,VOICE:+1 555 0101',
        'TEL;TYPE=WORK:+1 555 0102',
        'EMAIL;TYPE=INTERNET,HOME:jane@example.com',
        'item1.EMAIL;TYPE=INTERNET:jd@work.example',
        'ORG:Acme\\, Inc.;R&D',
        'TITLE:Engineer',
        'ADR;TYPE=HOME:;;1 Main St;Springfield;IL;62701;USA',
        'NOTE:Line one\\nLine two',
        'BDAY:1990-01-15',
        'URL:https://example.com',
        'END:VCARD',
      ].join('\n'),
    )
    const c = r.contacts[0]
    expect(c.phones).toEqual([
      { type: 'cell', value: '+1 555 0100' },
      { type: 'cell', value: '+1 555 0101' },
      { type: 'work', value: '+1 555 0102' },
    ])
    expect(c.emails).toEqual(['jane@example.com', 'jd@work.example'])
    expect(c.org).toBe('Acme, Inc. - R&D')
    expect(c.title).toBe('Engineer')
    expect(c.adr).toEqual([
      {
        type: 'home',
        street: '1 Main St',
        locality: 'Springfield',
        region: 'IL',
        postalCode: '62701',
        country: 'USA',
      },
    ])
    expect(c.note).toBe('Line one\nLine two')
    expect(c.bday).toBe('1990-01-15')
    expect(c.url).toBe('https://example.com')
  })

  it('reads vCard 4.0 TEL;VALUE=uri:tel:+1…', () => {
    const r = ok(
      [
        'BEGIN:VCARD',
        'VERSION:4.0',
        'FN:Uri Person',
        'TEL;VALUE=uri;TYPE="voice,cell":tel:+1-555-555-5555',
        'TEL;VALUE=uri:tel:+1-555-000-0000',
        'END:VCARD',
      ].join('\r\n'),
    )
    expect(r.contacts[0].phones).toEqual([
      { type: 'cell', value: '+1-555-555-5555' },
      { type: '', value: '+1-555-000-0000' },
    ])
  })

  it('handles multiple contacts and skips one broken card', () => {
    const r = ok(
      [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:One',
        'END:VCARD',
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:Broken (no END)',
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:Two',
        'END:VCARD',
      ].join('\r\n'),
    )
    expect(r.contacts.map((c) => c.fn)).toEqual(['One', 'Two'])
    expect(r.skipped).toBe(1)
  })

  it('builds fn from N when FN is missing', () => {
    const r = ok('BEGIN:VCARD\nVERSION:2.1\nN:Smith;John\nEND:VCARD')
    expect(r.contacts[0].fn).toBe('John Smith')
  })

  it('returns an error when there is no vCard', () => {
    const r = parseVcards('hello world')
    expect(r.ok).toBe(false)
  })
})

describe('contactsToCsv', () => {
  const jane: Contact = {
    fn: 'Jane Doe',
    n: { family: 'Doe', given: 'Jane' },
    emails: ['jane@example.com', 'jd@work.example'],
    phones: [
      { type: 'cell', value: '+1 555 0100' },
      { type: 'work', value: '+1 555 0102' },
    ],
    org: 'Acme, Inc.',
    title: 'Engineer',
    adr: [{ type: 'home', street: '1 Main St', locality: 'Springfield', region: 'IL', postalCode: '62701', country: 'USA' }],
    note: 'Says "hi"\nLine two',
    bday: '19900115',
    url: 'https://example.com',
  }

  function rows(csv: string) {
    return csv.split('\r\n')
  }

  it('generic preset quotes commas, quotes and newlines (RFC 4180)', () => {
    const csv = contactsToCsv([jane], 'generic')
    const [header] = rows(csv)
    expect(header.startsWith('Full name,Given name,Family name,Email 1,Email 2,Phone 1,Phone 1 type,Phone 2,Phone 2 type')).toBe(true)
    expect(csv).toContain('"Acme, Inc."')
    expect(csv).toContain('"Says ""hi""\nLine two"')
    expect(csv).toContain('1990-01-15')
  })

  it('google preset uses Google Contacts column names', () => {
    const csv = contactsToCsv([jane], 'google')
    const header = rows(csv)[0].split(',')
    for (const h of [
      'Name',
      'Given Name',
      'Family Name',
      'E-mail 1 - Type',
      'E-mail 1 - Value',
      'E-mail 2 - Value',
      'Phone 1 - Type',
      'Phone 1 - Value',
      'Organization 1 - Name',
      'Organization 1 - Title',
      'Address 1 - Formatted',
      'Birthday',
      'Notes',
    ]) {
      expect(header).toContain(h)
    }
    expect(csv).toContain('Mobile,+1 555 0100')
    expect(csv).toContain('Work,+1 555 0102')
  })

  it('outlook preset maps phones by type into Outlook columns', () => {
    // No commas / quotes in values, so a plain split lines columns up.
    const plain = { ...jane, org: 'Acme', note: 'n' }
    const [h, r] = rows(contactsToCsv([plain], 'outlook'))
    const header = h.split(',')
    const row = r.split(',')
    const val = (col: string) => row[header.indexOf(col)]
    expect(val('First Name')).toBe('Jane')
    expect(val('Last Name')).toBe('Doe')
    expect(val('E-mail Address')).toBe('jane@example.com')
    expect(val('E-mail 2 Address')).toBe('jd@work.example')
    expect(val('Mobile Phone')).toBe('+1 555 0100')
    expect(val('Business Phone')).toBe('+1 555 0102')
    expect(val('Company')).toBe('Acme')
    expect(val('Job Title')).toBe('Engineer')
    expect(val('Home Street')).toBe('1 Main St')
    expect(val('Home City')).toBe('Springfield')
  })
})
