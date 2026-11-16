import { describe, it, expect } from 'vitest'
import { parseChat, chatToCsv } from '@/lib/whatsapp'

// Synthetic fixtures built from the line shapes documented by whatstk, wc-parser and
// whatsapp-chat-parser. A real Android and iOS export still has to be run by hand before merge.
const LRM = '\u200e'
const NNBSP = '\u202f'

describe('parseChat — header shapes', () => {
  it('Android 12 h, month-first', () => {
    const r = parseChat('12/31/23, 10:15 PM - Alice: Hello')
    expect(r.messages).toEqual([{ date: '2023-12-31', time: '22:15:00', sender: 'Alice', message: 'Hello', type: 'text' }])
    expect(r.order).toBe('mdy')
    expect(r.ambiguous).toBe(false)
  })

  it('Android 24 h, 4-digit year, day-first', () => {
    const r = parseChat('31/12/2023, 22:15 - Bob: Hi')
    expect(r.messages[0]).toMatchObject({ date: '2023-12-31', time: '22:15:00', sender: 'Bob', message: 'Hi' })
    expect(r.order).toBe('dmy')
  })

  it('iOS bracketed with seconds', () => {
    const r = parseChat('[31/12/23, 10:15:32 PM] Alice: Hello')
    expect(r.messages[0]).toMatchObject({ date: '2023-12-31', time: '22:15:32', sender: 'Alice', message: 'Hello', type: 'text' })
  })

  it('iOS with a leading U+200E, U+202F before the meridiem and lowercase am/pm', () => {
    const r = parseChat(`${LRM}[31/12/23, 10:15:32${NNBSP}pm] Alice: Hello\n${LRM}[31/12/23, 12:05:00${NNBSP}Am] Bob: Late`)
    expect(r.messages.map((m) => [m.time, m.sender, m.message])).toEqual([
      ['22:15:32', 'Alice', 'Hello'],
      ['00:05:00', 'Bob', 'Late'],
    ])
  })

  it('dotted dates', () => {
    const r = parseChat('31.12.23, 22:15 - Bob: Hallo')
    expect(r.messages[0]).toMatchObject({ date: '2023-12-31', time: '22:15:00', sender: 'Bob', message: 'Hallo' })
  })

  it.each([
    '2023-12-31 22:15 - Bob: Hi',
    '2023/12/31 22:15 - Bob: Hi',
    '[2023-12-31, 22:15:32] Bob: Hi',
  ])('year-first dates: %s', (line) => {
    const r = parseChat(line)
    expect(r.messages[0]).toMatchObject({ date: '2023-12-31', sender: 'Bob', message: 'Hi', type: 'text' })
    expect(r.ambiguous).toBe(false)
  })

  it('year-first dates ignore a forced order', () => {
    expect(parseChat('2023-03-04 10:00 - A: x', 'mdy').messages[0].date).toBe('2023-03-04')
  })

  it('dotted times', () => {
    expect(parseChat('31/12/23, 22.15 - Bob: Ciao').messages[0]).toMatchObject({ time: '22:15:00', sender: 'Bob', message: 'Ciao' })
  })

  it.each([
    '99/99/23, 10:15 - Alice: x',
    '13/13/23, 10:15 - Alice: x',
    '1/2/23, 13:00 PM - Alice: x',
    '1/2/23, 10:60 - Alice: x',
    '2023-13-01 10:00 - Alice: x',
  ])('an out-of-range header is a continuation line: %s', (line) => {
    const r = parseChat(`31/12/2023, 22:15 - Bob: first\n${line}`)
    expect(r.messages).toHaveLength(1)
    expect(r.messages[0].message).toBe(`first\n${line}`)
  })

  it('12 PM stays noon', () => {
    expect(parseChat('1/2/23, 12:30 PM - A: x').messages[0].time).toBe('12:30:00')
  })
})

describe('parseChat — bodies', () => {
  it('appends non-header lines to the previous message with a newline', () => {
    const r = parseChat('31/12/2023, 22:15 - Bob: line one\nline two\n\nline four\n31/12/2023, 22:16 - Alice: next')
    expect(r.messages).toHaveLength(2)
    expect(r.messages[0].message).toBe('line one\nline two\n\nline four')
  })

  it('handles CRLF line ends', () => {
    const r = parseChat('31/12/2023, 22:15 - Bob: a\r\nb\r\n31/12/2023, 22:16 - Alice: c\r\n')
    expect(r.messages.map((m) => m.message)).toEqual(['a\nb', 'c'])
  })

  it('a header with no "Name: " part is a system line', () => {
    const r = parseChat('31/12/2023, 22:15 - Messages and calls are end-to-end encrypted. No one outside of this chat can read them.')
    expect(r.messages[0]).toMatchObject({ type: 'system', sender: '' })
    expect(r.messages[0].message).toMatch(/^Messages and calls/)
  })

  it('a time inside a system line is not taken as a sender', () => {
    const r = parseChat('31/12/2023, 22:15 - Alice changed the meeting to 10:30 tomorrow')
    expect(r.messages[0]).toMatchObject({ type: 'system', sender: '' })
  })

  it('an Android group rename containing ": " is a system line', () => {
    const r = parseChat('31/12/2023, 22:15 - Alice changed the group name from "Old" to "Trip: Goa 2024"')
    expect(r.messages[0]).toMatchObject({ type: 'system', sender: '' })
    expect(r.messages[0].message).toBe('Alice changed the group name from "Old" to "Trip: Goa 2024"')
  })

  it('an iOS notice starting with U+200E is a system line', () => {
    const r = parseChat(`[31/12/23, 10:15:32 PM] ${LRM}Alice changed the subject to \u201cTrip: Goa\u201d`)
    expect(r.messages[0]).toMatchObject({ type: 'system', sender: '' })
    expect(r.messages[0].message).toBe('Alice changed the subject to \u201cTrip: Goa\u201d')
  })

  it.each([
    '<Media omitted>',
    'image omitted',
    `${LRM}image omitted`,
    'IMG-20231231-WA0001.jpg (file attached)',
    '<attached: 00000012-PHOTO-2023-12-31-22-15-32.jpg>',
  ])('detects media: %s', (body) => {
    expect(parseChat(`31/12/2023, 22:15 - Bob: ${body}`).messages[0].type).toBe('media')
  })

  it('keeps phone-number senders intact', () => {
    const r = parseChat('31/12/2023, 22:15 - +91 98765 43210: Hi')
    expect(r.messages[0].sender).toBe('+91 98765 43210')
  })

  it('a file with no parsable header gives no messages and does not throw', () => {
    expect(parseChat('hello\nworld').messages).toEqual([])
    expect(parseChat('').messages).toEqual([])
  })

  it('ignores lines before the first header', () => {
    expect(parseChat('junk\n31/12/2023, 22:15 - Bob: Hi').messages).toHaveLength(1)
  })
})

describe('parseChat — day/month order', () => {
  const AMBIG = '03/04/23, 10:00 - A: x\n05/06/23, 11:00 - B: y'

  it('any first field > 12 → day-first', () => {
    const r = parseChat('03/04/23, 10:00 - A: x\n13/04/23, 10:00 - A: y')
    expect(r.order).toBe('dmy')
    expect(r.ambiguous).toBe(false)
    expect(r.messages[0].date).toBe('2023-04-03')
  })

  it('any second field > 12 → month-first', () => {
    const r = parseChat('03/04/23, 10:00 - A: x\n04/13/23, 10:00 - A: y')
    expect(r.order).toBe('mdy')
    expect(r.ambiguous).toBe(false)
    expect(r.messages[0].date).toBe('2023-03-04')
  })

  it('otherwise day-first and ambiguous', () => {
    const r = parseChat(AMBIG)
    expect(r.order).toBe('dmy')
    expect(r.ambiguous).toBe(true)
    expect(r.messages[0].date).toBe('2023-04-03')
  })

  it('an explicit order overrides the guess and keeps ambiguous', () => {
    const r = parseChat(AMBIG, 'mdy')
    expect(r.order).toBe('mdy')
    expect(r.ambiguous).toBe(true)
    expect(r.messages[0].date).toBe('2023-03-04')
  })
})

describe('chatToCsv', () => {
  it('writes the header row, CRLF ends, intact phone senders and neutralised formulas', () => {
    const r = parseChat('31/12/2023, 22:15 - +91 98765 43210: =HYPERLINK("x")\n31/12/2023, 22:16 - Bob: a, b\nc')
    const csv = chatToCsv(r.messages)
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('Date,Time,Sender,Message,Type')
    expect(lines[1]).toBe(`2023-12-31,22:15:00,+91 98765 43210,"'=HYPERLINK(""x"")",text`)
    expect(csv).toContain('"a, b\nc"')
    expect(csv.endsWith('\r\n')).toBe(true)
  })
})
