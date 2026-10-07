import { describe, it, expect } from 'vitest'
import { parseIcs, eventsToCsv, describeRrule, zonedToInstant, formatInZone } from '@/lib/ics'

// Vectors follow RFC 5545 (§3.1 folding, §3.3.5 DATE-TIME forms, §3.3.11 TEXT
// escapes, §3.3.10 RRULE). Offsets: Asia/Kolkata is UTC+05:30 all year (no
// DST); America/New_York is UTC−05:00 (EST) / UTC−04:00 (EDT), DST in 2026 runs
// 8 Mar – 1 Nov (US Energy Policy Act 2005: 2nd Sunday Mar – 1st Sunday Nov).

function cal(...lines: string[]) {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', ...lines, 'END:VCALENDAR'].join('\r\n')
}
function ok(text: string) {
  const r = parseIcs(text)
  if (!r.ok) throw new Error(r.error)
  return r
}

describe('zonedToInstant', () => {
  it('Asia/Kolkata 09:00 → 03:30Z', () => {
    expect(zonedToInstant(2026, 10, 7, 9, 0, 0, 'Asia/Kolkata').toISOString()).toBe('2026-10-07T03:30:00.000Z')
  })
  it('America/New_York in summer (EDT, −4)', () => {
    expect(zonedToInstant(2026, 7, 1, 9, 0, 0, 'America/New_York').toISOString()).toBe('2026-07-01T13:00:00.000Z')
  })
  it('America/New_York in winter (EST, −5)', () => {
    expect(zonedToInstant(2026, 1, 15, 9, 0, 0, 'America/New_York').toISOString()).toBe('2026-01-15T14:00:00.000Z')
  })
  it('America/New_York on the DST start day, after the switch', () => {
    // 2026-03-08 02:00 EST jumps to 03:00 EDT; 10:00 that day is EDT.
    expect(zonedToInstant(2026, 3, 8, 10, 0, 0, 'America/New_York').toISOString()).toBe('2026-03-08T14:00:00.000Z')
  })
})

describe('parseIcs', () => {
  it('reads an all-day DATE event (end exclusive per RFC 5545)', () => {
    const r = ok(cal('BEGIN:VEVENT', 'SUMMARY:Holiday', 'DTSTART;VALUE=DATE:20261007', 'DTEND;VALUE=DATE:20261008', 'END:VEVENT'))
    const e = r.events[0]
    expect(e.allDay).toBe(true)
    expect(e.start?.toISOString()).toBe('2026-10-07T00:00:00.000Z')
    expect(formatInZone(e, 'start', 'America/New_York')).toBe('2026-10-07')
    // displayed end is the inclusive last day
    expect(formatInZone(e, 'end', 'America/New_York')).toBe('2026-10-07')
  })

  it('converts TZID=Asia/Kolkata to the right UTC instant', () => {
    const r = ok(cal('BEGIN:VEVENT', 'SUMMARY:Standup', 'DTSTART;TZID=Asia/Kolkata:20261007T090000', 'DTEND;TZID=Asia/Kolkata:20261007T093000', 'END:VEVENT'))
    expect(r.events[0].start?.toISOString()).toBe('2026-10-07T03:30:00.000Z')
    expect(r.events[0].tzid).toBe('Asia/Kolkata')
    expect(formatInZone(r.events[0], 'start', 'America/New_York')).toBe('2026-10-06 23:30')
  })

  it('reads UTC DATE-TIME with Z', () => {
    const r = ok(cal('BEGIN:VEVENT', 'SUMMARY:Call', 'DTSTART:20261007T033000Z', 'DURATION:PT1H30M', 'END:VEVENT'))
    expect(r.events[0].start?.toISOString()).toBe('2026-10-07T03:30:00.000Z')
    expect(r.events[0].end?.toISOString()).toBe('2026-10-07T05:00:00.000Z')
    expect(formatInZone(r.events[0], 'start', 'Asia/Kolkata')).toBe('2026-10-07 09:00')
  })

  it('unfolds DESCRIPTION and unescapes \\, \\; \\n \\\\', () => {
    const r = ok(
      cal(
        'BEGIN:VEVENT',
        'DTSTART:20261007T033000Z',
        'SUMMARY:Lunch\\, then talk',
        'LOCATION:Room 1\\; floor 2',
        'DESCRIPTION:Bring notes\\nand a',
        '  laptop \\\\ charger',
        'END:VEVENT',
      ),
    )
    const e = r.events[0]
    expect(e.summary).toBe('Lunch, then talk')
    expect(e.location).toBe('Room 1; floor 2')
    expect(e.description).toBe('Bring notes\nand a laptop \\ charger')
  })

  it('ignores nested VALARM properties and keeps RRULE', () => {
    const r = ok(
      cal(
        'BEGIN:VEVENT',
        'SUMMARY:Gym',
        'DTSTART:20261007T033000Z',
        'RRULE:FREQ=WEEKLY;BYDAY=MO,WE',
        'BEGIN:VALARM',
        'DESCRIPTION:Reminder',
        'END:VALARM',
        'END:VEVENT',
      ),
    )
    expect(r.events[0].description).toBe('')
    expect(r.events[0].rrule).toBe('FREQ=WEEKLY;BYDAY=MO,WE')
  })

  it('skips an event without END:VEVENT', () => {
    const r = ok(
      cal('BEGIN:VEVENT', 'SUMMARY:A', 'DTSTART:20261007T033000Z', 'BEGIN:VEVENT', 'SUMMARY:B', 'DTSTART:20261008T033000Z', 'END:VEVENT'),
    )
    expect(r.events.map((e) => e.summary)).toEqual(['B'])
    expect(r.skipped).toBe(1)
  })

  it('treats an unknown TZID as floating wall-clock time', () => {
    const r = ok(cal('BEGIN:VEVENT', 'DTSTART;TZID=Not/AZone:20261007T090000', 'END:VEVENT'))
    expect(formatInZone(r.events[0], 'start', 'Asia/Kolkata')).toBe('2026-10-07 09:00')
  })

  it('errors on text that is not a calendar', () => {
    expect(parseIcs('nope').ok).toBe(false)
  })
})

describe('describeRrule', () => {
  it.each([
    ['FREQ=WEEKLY;BYDAY=MO,WE', 'Weekly on Monday, Wednesday'],
    ['FREQ=DAILY', 'Daily'],
    ['FREQ=DAILY;INTERVAL=2;COUNT=5', 'Every 2 days, 5 times'],
    ['FREQ=MONTHLY;BYDAY=-1FR', 'Monthly on the last Friday'],
    ['FREQ=MONTHLY;BYMONTHDAY=15', 'Monthly on day 15'],
    ['FREQ=YEARLY;UNTIL=20271231T000000Z', 'Yearly, until 2027-12-31'],
    ['FREQ=WEEKLY;INTERVAL=2;BYDAY=TU', 'Every 2 weeks on Tuesday'],
  ])('%s → %s', (rule, text) => {
    expect(describeRrule(rule)).toBe(text)
  })
})

describe('eventsToCsv', () => {
  it('writes a header and quotes fields per RFC 4180', () => {
    const r = ok(cal('BEGIN:VEVENT', 'SUMMARY:Lunch\\, then talk', 'DTSTART;TZID=Asia/Kolkata:20261007T090000', 'RRULE:FREQ=DAILY', 'END:VEVENT'))
    const csv = eventsToCsv(r.events, 'UTC')
    const [h, row] = csv.split('\r\n')
    expect(h).toBe('Summary,Start,End,All day,Location,Repeats,Description')
    expect(row).toBe('"Lunch, then talk",2026-10-07 03:30,,No,,Daily,')
  })
})
