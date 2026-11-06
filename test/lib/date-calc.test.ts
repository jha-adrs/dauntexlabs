import { describe, it, expect } from 'vitest'
import { addCalendar, addBusinessDays, parseHolidays, describeDate } from '@/lib/date-calc'

const v = (r: { ok: true; value: string } | { ok: false; error: string }) => {
  if (!r.ok) throw new Error(r.error)
  return r.value
}
const none = new Set<string>()

describe('addCalendar', () => {
  it('adds days across a month end', () => expect(v(addCalendar('2020-01-01', 30, 'days', 1))).toBe('2020-01-31'))
  it('adds weeks', () => expect(v(addCalendar('2020-01-01', 2, 'weeks', 1))).toBe('2020-01-15'))
  it('clamps Jan 31 + 1 month to leap Feb', () => expect(v(addCalendar('2020-01-31', 1, 'months', 1))).toBe('2020-02-29'))
  it('subtracts months across a year', () => expect(v(addCalendar('2020-03-31', 4, 'months', -1))).toBe('2019-11-30'))
  it('clamps Feb 29 + 1 year', () => expect(v(addCalendar('2020-02-29', 1, 'years', 1))).toBe('2021-02-28'))
  it('subtracts a day across a year', () => expect(v(addCalendar('2020-01-01', 1, 'days', -1))).toBe('2019-12-31'))
  it('crosses a US DST change without drifting', () => expect(v(addCalendar('2026-03-07', 1, 'days', 1))).toBe('2026-03-08'))
  it('keeps years 0–99 instead of mapping them to the 1900s', () => {
    expect(v(addCalendar('2026-01-01', 1950, 'years', -1))).toBe('0076-01-01')
    expect(v(addCalendar('2026-03-31', 1950 * 12 + 1, 'months', -1))).toBe('0076-02-29')
  })
  it('accepts a start date in years 0–99', () => expect(v(addCalendar('0076-01-01', 1, 'days', 1))).toBe('0076-01-02'))
  it('returns an out-of-range error instead of a NaN date', () => {
    const err = { ok: false, error: 'Result is out of range.' }
    expect(addCalendar('2026-01-01', 99999999, 'years', 1)).toEqual(err)
    expect(addCalendar('2026-01-01', 1e12, 'days', 1)).toEqual(err)
  })
  it('rejects an empty start', () => expect(addCalendar('', 1, 'days', 1)).toEqual({ ok: false, error: 'Enter a start date.' }))
  it('rejects a bad date', () => expect(addCalendar('2020-13-01', 1, 'days', 1).ok).toBe(false))
  it('rejects a negative amount', () =>
    expect(addCalendar('2020-01-01', -1, 'days', 1)).toEqual({ ok: false, error: 'Enter a valid non-negative amount.' }))
})

describe('addBusinessDays (2026-11-05 is a Thursday)', () => {
  it('Sat–Sun weekend', () => {
    expect(v(addBusinessDays('2026-11-05', 1, 1, 'sat-sun', none))).toBe('2026-11-06')
    expect(v(addBusinessDays('2026-11-05', 2, 1, 'sat-sun', none))).toBe('2026-11-09')
    expect(v(addBusinessDays('2026-11-05', 5, 1, 'sat-sun', none))).toBe('2026-11-12')
  })
  it('Fri–Sat weekend', () => expect(v(addBusinessDays('2026-11-05', 1, 1, 'fri-sat', none))).toBe('2026-11-08'))
  it('Sunday-only weekend', () => expect(v(addBusinessDays('2026-11-05', 2, 1, 'sun', none))).toBe('2026-11-07'))
  it('skips a holiday', () => expect(v(addBusinessDays('2026-11-05', 1, 1, 'sat-sun', new Set(['2026-11-06'])))).toBe('2026-11-09'))
  it('subtracts', () => expect(v(addBusinessDays('2026-11-09', 1, -1, 'sat-sun', none))).toBe('2026-11-06'))
  it('starting on a Saturday', () => expect(v(addBusinessDays('2026-11-07', 1, 1, 'sat-sun', none))).toBe('2026-11-09'))
  it('0 returns the start date', () => expect(v(addBusinessDays('2026-11-05', 0, 1, 'sat-sun', none))).toBe('2026-11-05'))
  it('rejects a fraction or an out-of-range count', () => {
    const err = { ok: false, error: 'Enter a whole number of business days from 0 to 10,000.' }
    expect(addBusinessDays('2026-11-05', 1.5, 1, 'sat-sun', none)).toEqual(err)
    expect(addBusinessDays('2026-11-05', 10001, 1, 'sat-sun', none)).toEqual(err)
    expect(addBusinessDays('2026-11-05', NaN, 1, 'sat-sun', none)).toEqual(err)
  })
})

describe('parseHolidays', () => {
  it('reads dates anywhere and reports lines without a valid date', () =>
    expect(parseHolidays('2026-01-26 Republic Day\n2026-08-15, 2026-10-02\nnot a date\n2026-02-30\n2026-01-26\n')).toEqual({
      dates: ['2026-01-26', '2026-08-15', '2026-10-02'],
      invalid: ['not a date', '2026-02-30'],
    }))
  it('empty text', () => expect(parseHolidays('  \n')).toEqual({ dates: [], invalid: [] }))
  it('reads every date on a line, not just the first', () =>
    expect(parseHolidays('2026-12-24 2026-12-25\n2026-01-26; 2026-01-27')).toEqual({
      dates: ['2026-12-24', '2026-12-25', '2026-01-26', '2026-01-27'],
      invalid: [],
    }))
  it('ignores digit runs longer than a date', () =>
    expect(parseHolidays('12026-01-266')).toEqual({ dates: [], invalid: ['12026-01-266'] }))
  it('reports a line whose second date is impossible', () =>
    expect(parseHolidays('2026-12-24 2026-02-30')).toEqual({ dates: ['2026-12-24'], invalid: ['2026-12-24 2026-02-30'] }))
})

describe('describeDate', () => {
  it('long form and weekday', () =>
    expect(describeDate('2026-11-05')).toEqual({ long: 'November 5, 2026', weekday: 'Thursday' }))
})
