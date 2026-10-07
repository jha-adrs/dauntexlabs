/**
 * Pure 5-field cron parsing, description and next-run helpers.
 * Shared by CronExplainer and CronToSystemdTimer. parseCron/parseField throw on bad input.
 */

/* ── field specs ─────────────────────────────────────────────────────────── */

export type FieldSpec = {
  name: string
  min: number
  max: number
}

export const FIELDS: FieldSpec[] = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day-of-month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12 },
  { name: 'day-of-week', min: 0, max: 6 }, // 0 = Sunday
]

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const DOW_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

/* ── parsing ─────────────────────────────────────────────────────────────── */

export type ParsedField = {
  /** Sorted, de-duplicated list of allowed values for this field. */
  values: number[]
  /** True when the field is "*" (unrestricted) — needed for dom/dow OR logic. */
  isStar: boolean
}

export function parseField(raw: string, spec: FieldSpec): ParsedField {
  const trimmed = raw.trim()
  if (trimmed === '') throw new Error(`Empty ${spec.name} field.`)

  // "*" alone is unrestricted (matches every value). "*/n" is a step and IS a
  // restriction — it must not be treated as "*" (matters for dom/dow OR logic).
  const isStar = trimmed === '*'
  const set = new Set<number>()

  for (const part of trimmed.split(',')) {
    const piece = part.trim()
    if (piece === '') throw new Error(`Empty value in ${spec.name} field.`)

    // step expression: <range-or-star>/<n>
    let stepBase = piece
    let step = 1
    const slash = piece.indexOf('/')
    if (slash !== -1) {
      stepBase = piece.slice(0, slash)
      const stepStr = piece.slice(slash + 1)
      step = Number(stepStr)
      if (!/^\d+$/.test(stepStr) || step < 1) {
        throw new Error(`Invalid step "${stepStr}" in ${spec.name} field.`)
      }
    }

    let lo: number
    let hi: number
    if (stepBase === '*') {
      lo = spec.min
      hi = spec.max
    } else if (stepBase.includes('-')) {
      const [a, b] = stepBase.split('-')
      lo = Number(a)
      hi = Number(b)
      if (!/^\d+$/.test(a) || !/^\d+$/.test(b)) {
        throw new Error(`Invalid range "${stepBase}" in ${spec.name} field.`)
      }
      if (lo > hi) throw new Error(`Range start greater than end in ${spec.name} field.`)
    } else {
      if (!/^\d+$/.test(stepBase)) {
        throw new Error(`Invalid value "${stepBase}" in ${spec.name} field.`)
      }
      lo = Number(stepBase)
      hi = lo
    }

    if (lo < spec.min || hi > spec.max) {
      throw new Error(
        `Value out of range in ${spec.name} field (allowed ${spec.min}-${spec.max}).`,
      )
    }

    for (let v = lo; v <= hi; v += step) set.add(v)
  }

  if (set.size === 0) throw new Error(`No values in ${spec.name} field.`)
  return { values: [...set].sort((a, b) => a - b), isStar }
}

export type ParsedCron = {
  minute: ParsedField
  hour: ParsedField
  dom: ParsedField
  month: ParsedField
  dow: ParsedField
}

export function parseCron(expr: string): ParsedCron {
  const fields = expr.trim().split(/\s+/)
  if (expr.trim() === '') throw new Error('Enter a cron expression.')
  if (fields.length !== 5) {
    throw new Error(
      `Expected 5 fields (minute hour day-of-month month day-of-week), got ${fields.length}.`,
    )
  }
  return {
    minute: parseField(fields[0], FIELDS[0]),
    hour: parseField(fields[1], FIELDS[1]),
    dom: parseField(fields[2], FIELDS[2]),
    month: parseField(fields[3], FIELDS[3]),
    dow: parseField(fields[4], FIELDS[4]),
  }
}

/* ── plain-English description ───────────────────────────────────────────── */

export function listToText(values: number[], single: string, plural: string): string {
  if (values.length === 1) return `${single} ${values[0]}`
  return `${plural} ${values.join(', ')}`
}

/** Detect an evenly-spaced step starting at the field minimum (a slash-n form). */
export function detectStep(values: number[], spec: FieldSpec): number | null {
  if (values.length < 2) return null
  if (values[0] !== spec.min) return null
  const step = values[1] - values[0]
  if (step < 2) return null
  for (let i = 1; i < values.length; i++) {
    if (values[i] - values[i - 1] !== step) return null
  }
  // must cover to the top of the range (so it's truly "every n")
  if (values[values.length - 1] + step <= spec.max) return null
  return step
}

export function describe(p: ParsedCron): string {
  const parts: string[] = []

  // time-of-day portion
  const minStep = detectStep(p.minute.values, FIELDS[0])
  const hourStep = detectStep(p.hour.values, FIELDS[1])

  if (p.minute.isStar && p.hour.isStar) {
    parts.push('Every minute')
  } else if (minStep && p.hour.isStar) {
    parts.push(`Every ${minStep} minutes`)
  } else if (p.minute.values.length === 1 && p.hour.values.length === 1) {
    const hh = String(p.hour.values[0]).padStart(2, '0')
    const mm = String(p.minute.values[0]).padStart(2, '0')
    parts.push(`At ${hh}:${mm}`)
  } else {
    const segs: string[] = []
    if (p.minute.isStar) segs.push('every minute')
    else if (minStep) segs.push(`every ${minStep} minutes`)
    else segs.push(`at ${listToText(p.minute.values, 'minute', 'minutes')}`)

    if (hourStep) segs.push(`every ${hourStep} hours`)
    else if (!p.hour.isStar) segs.push(`past ${listToText(p.hour.values, 'hour', 'hours')}`)
    parts.push(segs.join(', '))
  }

  // day-of-month
  if (!p.dom.isStar) {
    parts.push(`on day-of-month ${p.dom.values.join(', ')}`)
  }

  // month
  if (!p.month.isStar) {
    parts.push(`in ${p.month.values.map((m) => MONTH_NAMES[m - 1]).join(', ')}`)
  }

  // day-of-week
  if (!p.dow.isStar) {
    parts.push(`on ${p.dow.values.map((d) => DOW_NAMES[d % 7]).join(', ')}`)
  }

  return parts.join(' ') + '.'
}

/* ── next run computation ────────────────────────────────────────────────── */

export const MAX_MINUTES = 5 * 366 * 24 * 60 // ~5 years cap to avoid infinite loops

export function matches(p: ParsedCron, d: Date): boolean {
  if (!p.minute.values.includes(d.getMinutes())) return false
  if (!p.hour.values.includes(d.getHours())) return false
  if (!p.month.values.includes(d.getMonth() + 1)) return false

  const domMatch = p.dom.values.includes(d.getDate())
  const dowMatch = p.dow.values.includes(d.getDay())

  // cron OR semantics: when both dom and dow are restricted, match either.
  if (!p.dom.isStar && !p.dow.isStar) return domMatch || dowMatch
  if (!p.dom.isStar) return domMatch
  if (!p.dow.isStar) return dowMatch
  return true // both are "*"
}

export function nextRuns(p: ParsedCron, from: Date, count: number): Date[] {
  const out: Date[] = []
  // start at the next whole minute
  const cur = new Date(from.getTime())
  cur.setSeconds(0, 0)
  cur.setMinutes(cur.getMinutes() + 1)

  for (let i = 0; i < MAX_MINUTES && out.length < count; i++) {
    if (matches(p, cur)) out.push(new Date(cur.getTime()))
    cur.setMinutes(cur.getMinutes() + 1)
  }
  return out
}

