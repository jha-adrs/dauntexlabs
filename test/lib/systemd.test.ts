import { describe, it, expect } from 'vitest'
import { cronToSystemd } from '@/lib/systemd'

// Expected OnCalendar values follow systemd.time(7) "Calendar Events":
//   format "DayOfWeek Year-Month-Day Hour:Minute:Second"; "*" matches any value;
//   "a/b" = a, a+b, a+2b… ; "a..b" = range; weekday ranges like "Mon..Fri";
//   shorthands hourly = *-*-* *:00:00, daily = *-*-* 00:00:00,
//   monthly = *-*-01 00:00:00, yearly = *-01-01 00:00:00, weekly = Mon *-*-* 00:00:00.
const opts = { name: 'my-job', command: '/usr/local/bin/backup.sh', persistent: true }

function cal(expr: string): string {
  const r = cronToSystemd(expr, opts)
  if (!r.ok) throw new Error(r.error)
  return r.onCalendar
}

describe('cronToSystemd — OnCalendar', () => {
  it.each([
    ['*/15 * * * *', '*-*-* *:00/15:00'],
    ['0 9 * * 1-5', 'Mon..Fri *-*-* 09:00:00'],
    ['30 4 1 * *', '*-*-01 04:30:00'],
    ['0 0 * * 0', 'Sun *-*-* 00:00:00'],
    ['5 0 * 8 *', '*-08-* 00:05:00'],
    ['0 0 1,15 * *', '*-*-01,15 00:00:00'],
    ['0 22 * * 1-5', 'Mon..Fri *-*-* 22:00:00'],
    ['0 */2 * * *', '*-*-* 00/2:00:00'],
    ['* * * * *', '*-*-* *:*:00'],
    ['0-30/15 0 * * *', '*-*-* 00:00..30/15:00'],
    ['0 8 * * 0,6', 'Sat,Sun *-*-* 08:00:00'],
    ['0 8 * * 0-2', 'Mon,Tue,Sun *-*-* 08:00:00'],
  ])('%s → %s', (expr, expected) => {
    expect(cal(expr)).toBe(expected)
  })

  it.each([
    ['@daily', 'daily'],
    ['@midnight', 'daily'],
    ['@hourly', 'hourly'],
    ['@monthly', 'monthly'],
    ['@yearly', 'yearly'],
    ['@annually', 'yearly'],
    // cron @weekly is Sunday midnight; systemd "weekly" is Monday — so spell it out.
    ['@weekly', 'Sun *-*-* 00:00:00'],
  ])('macro %s → %s', (expr, expected) => {
    expect(cal(expr)).toBe(expected)
  })

  it('splits dom + dow restrictions into two OnCalendar lines (cron OR semantics)', () => {
    const r = cronToSystemd('0 9 1 * 1', opts)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.onCalendar).toBe('Mon *-*-* 09:00:00\n*-*-01 09:00:00')
    expect(r.note).toMatch(/either/i)
    expect(r.timer).toContain('OnCalendar=Mon *-*-* 09:00:00\nOnCalendar=*-*-01 09:00:00')
  })

  it('errors on out-of-range values', () => {
    const r = cronToSystemd('61 * * * *', opts)
    expect(r.ok).toBe(false)
  })

  it('explains @reboot should use OnBootSec=', () => {
    const r = cronToSystemd('@reboot', opts)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/OnBootSec=/)
  })

  it('rejects an unknown macro and an invalid unit name', () => {
    expect(cronToSystemd('@sometimes', opts).ok).toBe(false)
    expect(cronToSystemd('0 * * * *', { ...opts, name: 'bad name/x' }).ok).toBe(false)
  })
})

describe('cronToSystemd — unit files', () => {
  it('builds timer and service files', () => {
    const r = cronToSystemd('0 9 * * 1-5', opts)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.timer).toContain('[Timer]\nOnCalendar=Mon..Fri *-*-* 09:00:00\nPersistent=true\nUnit=my-job.service')
    expect(r.timer).toContain('[Install]\nWantedBy=timers.target')
    expect(r.service).toContain('[Service]\nType=oneshot\nExecStart=/usr/local/bin/backup.sh')
    expect(r.description).toMatch(/At 09:00/)
  })

  it('writes Persistent=false when off', () => {
    const r = cronToSystemd('@daily', { ...opts, persistent: false })
    expect(r.ok && r.timer).toContain('Persistent=false')
  })

  it('wraps shell syntax in /bin/sh -c', () => {
    const r = cronToSystemd('@daily', { ...opts, command: "cd /srv && echo 'hi' > out.txt" })
    expect(r.ok && r.service).toContain(`ExecStart=/bin/sh -c 'cd /srv && echo '\\''hi'\\'' > out.txt'`)
  })

  it('requires a command', () => {
    expect(cronToSystemd('@daily', { ...opts, command: '  ' }).ok).toBe(false)
  })
})
