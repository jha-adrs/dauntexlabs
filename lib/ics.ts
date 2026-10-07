// iCalendar (.ics, RFC 5545) event reader + CSV export. Handles folding,
// TEXT escapes, all-day DATE values, UTC (`Z`), TZID (resolved with the
// browser's own Intl time-zone data — no tz database is bundled), DURATION,
// nested VALARM blocks, and describes RRULE in words (not expanded).
// Pure logic: never throws to the UI.

import { toCsv } from './csv-write'
import { param, parseLine, unescapeText, unfold, type ContentLine } from './contentline'

export interface IcsEvent {
  summary: string
  /** UTC instant. For all-day and floating events it holds the wall-clock
   *  date/time in its UTC fields (use `formatInZone`, which knows this). */
  start: Date | null
  end: Date | null
  allDay: boolean
  /** Wall-clock time with no usable zone (no TZID, or a TZID Intl doesn't know). */
  floating?: boolean
  location: string
  description: string
  rrule?: string
  tzid?: string
}

export type IcsResult = { ok: true; events: IcsEvent[]; skipped: number } | { ok: false; error: string }

/* ---- time zones (Intl offset lookup) -------------------------------- */

const dtfCache = new Map<string, Intl.DateTimeFormat>()

function dtf(timeZone: string): Intl.DateTimeFormat {
  let f = dtfCache.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    dtfCache.set(timeZone, f)
  }
  return f
}

function wallParts(t: number, timeZone: string) {
  const p: Record<string, string> = {}
  for (const x of dtf(timeZone).formatToParts(new Date(t))) p[x.type] = x.value
  return { y: p.year, mo: p.month, d: p.day, h: p.hour === '24' ? '00' : p.hour, mi: p.minute, s: p.second }
}

/** Offset of `timeZone` from UTC at instant `t`, in ms (e.g. +5:30 → 19800000). */
function offsetMs(timeZone: string, t: number): number {
  const w = wallParts(t, timeZone)
  const asUtc = Date.UTC(+w.y, +w.mo - 1, +w.d, +w.h, +w.mi, +w.s)
  return asUtc - Math.floor(t / 1000) * 1000
}

export function isValidTimeZone(tz: string): boolean {
  try {
    dtf(tz)
    return true
  } catch {
    return false
  }
}

/** Wall-clock time in an IANA zone → UTC instant (month is 1-based). */
export function zonedToInstant(y: number, mo: number, d: number, h: number, mi: number, s: number, timeZone: string): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s)
  const off1 = offsetMs(timeZone, guess - offsetMs(timeZone, guess))
  let t = guess - off1
  const off2 = offsetMs(timeZone, t)
  if (off2 !== off1) t = guess - off2
  return new Date(t)
}

/** TZID → an IANA zone Intl knows, or null. Accepts `/vendor/…/Area/City` prefixes. */
function resolveTzid(tzid: string): string | null {
  if (isValidTimeZone(tzid)) return tzid
  const m = /([A-Za-z_]+\/[A-Za-z_+-]+(?:\/[A-Za-z_+-]+)?)$/.exec(tzid)
  return m && isValidTimeZone(m[1]) ? m[1] : null
}

/* ---- parsing -------------------------------------------------------- */

type When = { date: Date; allDay: boolean; floating: boolean; tzid?: string }

function parseWhen(cl: ContentLine): When | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(cl.value.trim())
  if (!m) return null
  const [y, mo, d, h = '0', mi = '0', s = '0'] = m.slice(1, 7)
  const wall = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)
  if (m[4] === undefined) return { date: new Date(wall), allDay: true, floating: false }
  if (m[7]) return { date: new Date(wall), allDay: false, floating: false }
  const tzid = param(cl, 'TZID')
  const zone = tzid ? resolveTzid(tzid) : null
  if (zone) return { date: zonedToInstant(+y, +mo, +d, +h, +mi, +s, zone), allDay: false, floating: false, tzid: zone }
  return { date: new Date(wall), allDay: false, floating: true, tzid }
}

function durationMs(v: string): number | null {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(v.trim())
  if (!m) return null
  const [, sign, w = '0', d = '0', h = '0', mi = '0', s = '0'] = m
  const ms = ((+w * 7 + +d) * 86400 + +h * 3600 + +mi * 60 + +s) * 1000
  return sign === '-' ? -ms : ms
}

function buildEvent(lines: ContentLine[]): IcsEvent {
  const e: IcsEvent = { summary: '', start: null, end: null, allDay: false, location: '', description: '' }
  let dur: number | null = null
  for (const cl of lines) {
    switch (cl.name) {
      case 'SUMMARY':
        e.summary = unescapeText(cl.value).trim()
        break
      case 'LOCATION':
        e.location = unescapeText(cl.value).trim()
        break
      case 'DESCRIPTION':
        e.description = unescapeText(cl.value).trim()
        break
      case 'RRULE':
        e.rrule = cl.value.trim()
        break
      case 'DTSTART': {
        const w = parseWhen(cl)
        if (w) {
          e.start = w.date
          e.allDay = w.allDay
          if (w.floating) e.floating = true
          if (w.tzid) e.tzid = w.tzid
        }
        break
      }
      case 'DTEND':
      case 'DUE':
        e.end = parseWhen(cl)?.date ?? null
        break
      case 'DURATION':
        dur = durationMs(cl.value)
        break
    }
  }
  if (!e.end && e.start && dur !== null) e.end = new Date(e.start.getTime() + dur)
  return e
}

export function parseIcs(text: string): IcsResult {
  const events: IcsEvent[] = []
  let skipped = 0
  let seen = false
  let cur: ContentLine[] | null = null
  let depth = 0
  for (const line of unfold(text)) {
    const cl = parseLine(line)
    if (!cl) continue
    const v = cl.value.trim().toUpperCase()
    if (cl.name === 'BEGIN' && (v === 'VCALENDAR' || v === 'VEVENT')) seen = true
    if (cl.name === 'BEGIN' && v === 'VEVENT') {
      if (cur) skipped++ // previous event never ended
      cur = []
      depth = 0
    } else if (cl.name === 'END' && v === 'VEVENT') {
      if (cur) events.push(buildEvent(cur))
      cur = null
    } else if (cur) {
      if (cl.name === 'BEGIN') depth++
      else if (cl.name === 'END') depth = Math.max(0, depth - 1)
      else if (depth === 0) cur.push(cl)
    }
  }
  if (cur) skipped++
  if (!seen) return { ok: false, error: 'No calendar found — the text should contain BEGIN:VCALENDAR / BEGIN:VEVENT.' }
  return { ok: true, events, skipped }
}

/* ---- display -------------------------------------------------------- */

function fmt(t: number, timeZone: string, withTime: boolean): string {
  const w = wallParts(t, timeZone)
  return withTime ? `${w.y}-${w.mo}-${w.d} ${w.h}:${w.mi}` : `${w.y}-${w.mo}-${w.d}`
}

/**
 * `YYYY-MM-DD HH:mm` in `timeZone`; all-day → `YYYY-MM-DD` (unchanged by zone,
 * end shown inclusive since RFC 5545 DTEND is exclusive); floating → as written.
 */
export function formatInZone(e: IcsEvent, which: 'start' | 'end', timeZone: string): string {
  const d = e[which]
  if (!d) return ''
  if (e.allDay) {
    let t = d.getTime()
    if (which === 'end' && e.start && t > e.start.getTime()) t -= 86400000
    return fmt(t, 'UTC', false)
  }
  return fmt(d.getTime(), e.floating ? 'UTC' : timeZone, true)
}

const DAY: Record<string, string> = {
  MO: 'Monday',
  TU: 'Tuesday',
  WE: 'Wednesday',
  TH: 'Thursday',
  FR: 'Friday',
  SA: 'Saturday',
  SU: 'Sunday',
}
const ORD: Record<string, string> = {
  '1': 'first',
  '2': 'second',
  '3': 'third',
  '4': 'fourth',
  '5': 'fifth',
  '-1': 'last',
  '-2': 'second-to-last',
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const UNIT: Record<string, [string, string]> = {
  SECONDLY: ['second', 'Every second'],
  MINUTELY: ['minute', 'Every minute'],
  HOURLY: ['hour', 'Hourly'],
  DAILY: ['day', 'Daily'],
  WEEKLY: ['week', 'Weekly'],
  MONTHLY: ['month', 'Monthly'],
  YEARLY: ['year', 'Yearly'],
}

/** RRULE → plain English, e.g. `FREQ=WEEKLY;BYDAY=MO,WE` → "Weekly on Monday, Wednesday". */
export function describeRrule(rrule: string): string {
  const p: Record<string, string> = {}
  for (const kv of rrule.replace(/^RRULE:/i, '').split(';')) {
    const [k, v] = kv.split('=')
    if (k && v) p[k.toUpperCase()] = v.toUpperCase()
  }
  const unit = UNIT[p.FREQ]
  if (!unit) return rrule
  const n = parseInt(p.INTERVAL ?? '1', 10)
  let out = n > 1 ? `Every ${n} ${unit[0]}s` : unit[1]
  if (p.BYMONTH) {
    out += ` in ${p.BYMONTH.split(',').map((m) => MONTHS[+m - 1] ?? m).join(', ')}`
  }
  if (p.BYDAY) {
    const days = p.BYDAY.split(',').map((x) => {
      const m = /^([+-]?\d+)?([A-Z]{2})$/.exec(x)
      if (!m) return x
      const day = DAY[m[2]] ?? m[2]
      if (!m[1]) return day
      const ord = ORD[m[1].replace(/^\+/, '')] ?? `#${m[1]}`
      return `the ${ord} ${day}`
    })
    out += ` on ${days.join(', ')}`
  }
  if (p.BYMONTHDAY) {
    out += ` on ${p.BYMONTHDAY.split(',').map((d) => (d === '-1' ? 'the last day' : `day ${d}`)).join(', ')}`
  }
  if (p.COUNT) out += p.COUNT === '1' ? ', once' : `, ${p.COUNT} times`
  if (p.UNTIL) {
    const m = /^(\d{4})(\d{2})(\d{2})/.exec(p.UNTIL)
    if (m) out += `, until ${m[1]}-${m[2]}-${m[3]}`
  }
  return out
}

/* ---- CSV export ----------------------------------------------------- */

export function eventsToCsv(events: IcsEvent[], timeZone: string): string {
  const header = ['Summary', 'Start', 'End', 'All day', 'Location', 'Repeats', 'Description']
  const rows = events.map((e) => [
    e.summary,
    formatInZone(e, 'start', timeZone),
    formatInZone(e, 'end', timeZone),
    e.allDay ? 'Yes' : 'No',
    e.location,
    e.rrule ? describeRrule(e.rrule) : '',
    e.description,
  ])
  return toCsv([header, ...rows])
}
