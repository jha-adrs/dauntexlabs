/**
 * Convert a 5-field cron schedule into a systemd timer (OnCalendar=) plus matching
 * .timer and .service unit files. Calendar syntax per systemd.time(7):
 * "DayOfWeek Year-Month-Day Hour:Minute:Second", "*" = any, "a/b" = repeat from a
 * every b, "a..b" = range (optionally "/b"), weekday names Mon..Sun.
 */
import { FIELDS, describe, parseCron, type FieldSpec, type ParsedField } from './cron'

export type SystemdOptions = { name: string; command: string; persistent: boolean }

export type SystemdResult =
  | {
      ok: true
      /** One OnCalendar value per line (two lines when cron's day-of-month/day-of-week OR applies). */
      onCalendar: string
      timer: string
      service: string
      /** Plain-English meaning of the schedule. */
      description: string
      /** Extra explanation the user should see (e.g. OR semantics), if any. */
      note?: string
    }
  | { ok: false; error: string }

/** Cron macros → [systemd OnCalendar value, equivalent 5-field cron for description]. */
const MACROS: Record<string, [string, string]> = {
  '@yearly': ['yearly', '0 0 1 1 *'],
  '@annually': ['yearly', '0 0 1 1 *'],
  '@monthly': ['monthly', '0 0 1 * *'],
  // systemd "weekly" means Monday; cron @weekly means Sunday — so spell it out.
  '@weekly': ['Sun *-*-* 00:00:00', '0 0 * * 0'],
  '@daily': ['daily', '0 0 * * *'],
  '@midnight': ['daily', '0 0 * * *'],
  '@hourly': ['hourly', '0 * * * *'],
}

// systemd orders weekdays Mon..Sun; cron uses 0 = Sunday.
const SD_DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const pad = (n: number) => String(n).padStart(2, '0')

/** Render one numeric component (minute/hour/day/month). */
function component(f: ParsedField, spec: FieldSpec): string {
  const v = f.values
  if (f.isStar || v.length === spec.max - spec.min + 1) return '*'
  if (v.length === 1) return pad(v[0])

  // evenly spaced (step ≥ 2, at least 3 values) → "a/b" or "a..b/b"
  const step = v[1] - v[0]
  if (v.length >= 3 && step >= 2 && v.every((x, i) => i === 0 || x - v[i - 1] === step)) {
    const last = v[v.length - 1]
    return last + step > spec.max ? `${pad(v[0])}/${step}` : `${pad(v[0])}..${pad(last)}/${step}`
  }
  return runs(v, pad).join(',')
}

/** Group consecutive values; runs of 3+ become "a..b", shorter ones stay listed. */
function runs(v: number[], fmt: (n: number) => string): string[] {
  const out: string[] = []
  let i = 0
  while (i < v.length) {
    let j = i
    while (j + 1 < v.length && v[j + 1] === v[j] + 1) j++
    if (j - i >= 2) out.push(`${fmt(v[i])}..${fmt(v[j])}`)
    else for (let k = i; k <= j; k++) out.push(fmt(v[k]))
    i = j + 1
  }
  return out
}

function weekdays(f: ParsedField): string {
  // cron 0=Sun..6=Sat → systemd index 0=Mon..6=Sun
  const idx = [...new Set(f.values.map((d) => (d + 6) % 7))].sort((a, b) => a - b)
  return runs(idx, (i) => SD_DOW[i]).join(',')
}

const UNIT_NAME = /^[A-Za-z0-9:_.\\@-]+$/

/** ExecStart= does not run a shell; wrap commands that use shell syntax. */
function execStart(command: string): string {
  if (!/[|&;<>$`*?(){}~]/.test(command)) return command
  return `/bin/sh -c '${command.replace(/'/g, `'\\''`)}'`
}

export function cronToSystemd(expr: string, opts: SystemdOptions): SystemdResult {
  const raw = expr.trim()
  const name = opts.name.trim()
  const command = opts.command.trim()

  if (!name) return { ok: false, error: 'Enter a unit name.' }
  if (!UNIT_NAME.test(name)) {
    return { ok: false, error: 'Unit names may only use letters, digits and : _ . \\ @ -' }
  }
  if (!command) return { ok: false, error: 'Enter the command to run.' }

  let lines: string[]
  let cronExpr = raw
  let note: string | undefined

  if (raw.startsWith('@')) {
    const key = raw.toLowerCase()
    if (key === '@reboot') {
      return {
        ok: false,
        error:
          '@reboot has no calendar equivalent. In the [Timer] section use OnBootSec= instead (for example OnBootSec=1min) rather than OnCalendar=.',
      }
    }
    const macro = MACROS[key]
    if (!macro) return { ok: false, error: `Unknown cron shortcut "${raw}".` }
    lines = [macro[0]]
    cronExpr = macro[1]
  } else {
    let p
    try {
      p = parseCron(raw)
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
    const time = `${component(p.hour, FIELDS[1])}:${component(p.minute, FIELDS[0])}:00`
    const month = component(p.month, FIELDS[3])
    const dom = component(p.dom, FIELDS[2])
    const dowRestricted = !p.dow.isStar && p.dow.values.length < 7
    const dow = dowRestricted ? weekdays(p.dow) : ''

    if (dowRestricted && !p.dom.isStar) {
      // cron runs when EITHER day-of-month OR day-of-week matches; systemd ANDs them.
      lines = [`${dow} *-${month}-* ${time}`, `*-${month}-${dom} ${time}`]
      note =
        'Cron runs this job when either the day of the month or the weekday matches, so it needs two OnCalendar= lines.'
    } else {
      lines = [`${dow ? dow + ' ' : ''}*-${month}-${dom} ${time}`]
    }
  }

  let description = ''
  try {
    description = describe(parseCron(cronExpr))
  } catch {
    /* macros map to valid cron; parse errors already returned above */
  }

  const timer = [
    '[Unit]',
    `Description=Timer for ${name} (from cron: ${raw})`,
    '',
    '[Timer]',
    ...lines.map((l) => `OnCalendar=${l}`),
    `Persistent=${opts.persistent ? 'true' : 'false'}`,
    `Unit=${name}.service`,
    '',
    '[Install]',
    'WantedBy=timers.target',
    '',
  ].join('\n')

  const service = [
    '[Unit]',
    `Description=${name}`,
    '',
    '[Service]',
    'Type=oneshot',
    `ExecStart=${execStart(command)}`,
    '',
  ].join('\n')

  return { ok: true, onCalendar: lines.join('\n'), timer, service, description, note }
}
