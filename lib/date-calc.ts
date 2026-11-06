// Pure date maths for components/tools/DateCalculator.tsx. Everything runs in UTC so the
// result never depends on the browser's time zone or a DST change.

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }
export type Unit = 'days' | 'weeks' | 'months' | 'years'
export type Weekend = 'sat-sun' | 'fri-sat' | 'sun'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKEND_DAYS: Record<Weekend, number[]> = { 'sat-sun': [6, 0], 'fri-sat': [5, 6], sun: [0] }
const MAX_BUSINESS_DAYS = 10_000
const MAX_WALK = 100_000

/** Parses YYYY-MM-DD to a UTC Date; null when it does not round-trip (e.g. 2026-02-30). */
function parseIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = utcDate(y, mo - 1, d)
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null
  return date
}

function toIso(d: Date): string {
  const y = String(d.getUTCFullYear()).padStart(4, '0')
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Date.UTC maps years 0–99 to 1900–1999; setUTCFullYear does not. */
function utcDate(year: number, month: number, day: number): Date {
  const d = new Date(0)
  d.setUTCFullYear(year, month, day)
  return d
}

function daysInMonth(year: number, month: number): number {
  return utcDate(year, month + 1, 0).getUTCDate()
}

const OUT_OF_RANGE = { ok: false as const, error: 'Result is out of range.' }

export function addCalendar(startIso: string, amount: number, unit: Unit, sign: 1 | -1): Result<string> {
  if (!startIso) return { ok: false, error: 'Enter a start date.' }
  if (!Number.isFinite(amount) || amount < 0) return { ok: false, error: 'Enter a valid non-negative amount.' }
  const start = parseIso(startIso)
  if (!start) return { ok: false, error: 'Invalid start date.' }

  if (unit === 'days' || unit === 'weeks') {
    const out = new Date(start)
    out.setUTCDate(out.getUTCDate() + sign * amount * (unit === 'weeks' ? 7 : 1))
    return Number.isNaN(out.getTime()) ? OUT_OF_RANGE : { ok: true, value: toIso(out) }
  }
  // Months/years clamp to the end of a shorter target month: Jan 31 + 1 month → Feb 28/29.
  const rawMonth = start.getUTCMonth() + sign * amount * (unit === 'years' ? 12 : 1)
  const year = start.getUTCFullYear() + Math.floor(rawMonth / 12)
  const month = ((rawMonth % 12) + 12) % 12
  const day = Math.min(start.getUTCDate(), daysInMonth(year, month))
  const out = utcDate(year, month, day)
  return Number.isNaN(out.getTime()) ? OUT_OF_RANGE : { ok: true, value: toIso(out) }
}

/** Walks working days from the start (the start itself is not counted). */
export function addBusinessDays(
  startIso: string,
  n: number,
  sign: 1 | -1,
  weekend: Weekend,
  holidays: Set<string>,
): Result<string> {
  if (!startIso) return { ok: false, error: 'Enter a start date.' }
  const start = parseIso(startIso)
  if (!start) return { ok: false, error: 'Invalid start date.' }
  if (!Number.isInteger(n) || n < 0 || n > MAX_BUSINESS_DAYS)
    return { ok: false, error: 'Enter a whole number of business days from 0 to 10,000.' }
  const off = WEEKEND_DAYS[weekend]
  const cur = new Date(start)
  let left = n
  for (let steps = 0; left > 0; steps++) {
    if (steps >= MAX_WALK) return { ok: false, error: 'Too many holidays: no working day found.' }
    cur.setUTCDate(cur.getUTCDate() + sign)
    if (!off.includes(cur.getUTCDay()) && !holidays.has(toIso(cur))) left--
  }
  return { ok: true, value: toIso(cur) }
}

/** Reads every YYYY-MM-DD from pasted text (one per line or comma-separated). */
export function parseHolidays(text: string): { dates: string[]; invalid: string[] } {
  const dates: string[] = []
  const invalid: string[] = []
  for (const raw of text.split(/[\n,]/)) {
    const piece = raw.trim()
    if (!piece) continue
    const found = [...piece.matchAll(/(?<!\d)\d{4}-\d{2}-\d{2}(?!\d)/g)].map((m) => m[0])
    const valid = found.filter((s) => parseIso(s))
    if (found.length === 0 || valid.length < found.length) invalid.push(piece)
    for (const s of valid) if (!dates.includes(s)) dates.push(s)
  }
  return { dates, invalid }
}

export function describeDate(iso: string): { long: string; weekday: string } {
  const d = parseIso(iso) ?? new Date(NaN)
  return {
    long: d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
    weekday: WEEKDAYS[d.getUTCDay()] ?? '',
  }
}
