'use client'

import { useMemo, useState } from 'react'
import { Button, Select, Panel, Notice, Field } from '@/components/ui/kit'

/* ---- zone list ---------------------------------------------------- */

const FALLBACK_ZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Pacific/Honolulu',
]

function getSupportedZones(): string[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zones: string[] = (Intl as any).supportedValuesOf('timeZone')
    return zones
  } catch {
    return FALLBACK_ZONES
  }
}

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getFullYear() +
    '-' +
    pad(d.getMonth() + 1) +
    '-' +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    ':' +
    pad(d.getMinutes())
  )
}

/**
 * Given a "wall clock" datetime string like "2025-06-08T14:30" and a source
 * timezone name, produce the absolute UTC instant that corresponds to that
 * local time in the source zone.
 *
 * Strategy: use Intl.DateTimeFormat to find what UTC offset the source zone
 * observes at the approximate moment, then adjust.
 */
function wallClockToDate(localStr: string, sourceZone: string): Date | null {
  // parse the naive datetime from the input string
  const m = localStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return null
  const [, Y, Mo, D, H, Mi] = m.map(Number)

  // Build a UTC candidate assuming the naive datetime IS UTC, then figure out the
  // offset the source zone has at that time, and subtract it.
  const utcCandidate = Date.UTC(Y, Mo - 1, D, H, Mi)

  // Format the UTC candidate in the source zone to find current offset
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: sourceZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date(utcCandidate))

    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0')
    const zYear = get('year')
    const zMonth = get('month') - 1
    const zDay = get('day')
    let zHour = get('hour')
    const zMin = get('minute')

    // Intl hour12:false can return 24 for midnight
    if (zHour === 24) zHour = 0

    const zoneLocalMs = Date.UTC(zYear, zMonth, zDay, zHour, zMin)
    const offsetMs = utcCandidate - zoneLocalMs // offset of zone at that instant

    // True UTC for the intended wall-clock time
    return new Date(utcCandidate + offsetMs)
  } catch {
    return null
  }
}

function formatInZone(date: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      dateStyle: 'medium',
      timeStyle: 'long',
    } as Intl.DateTimeFormatOptions).format(date)
  } catch {
    return '—'
  }
}

/* ---- component ---------------------------------------------------- */

export default function TimezoneConverter() {
  const zones = useMemo(getSupportedZones, [])
  const zoneOptions = useMemo(() => zones.map((z) => ({ value: z, label: z })), [zones])

  const nowStr = toDatetimeLocalValue(new Date())
  const [datetime, setDatetime] = useState(nowStr)
  const [sourceZone, setSourceZone] = useState('UTC')
  const [targetZones, setTargetZones] = useState<string[]>([
    'America/New_York',
    'Europe/London',
    'Asia/Kolkata',
    'Asia/Tokyo',
  ])

  function setNow() {
    setDatetime(toDatetimeLocalValue(new Date()))
  }

  function addTarget() {
    setTargetZones((prev) => [...prev, 'UTC'])
  }

  function removeTarget(idx: number) {
    setTargetZones((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateTarget(idx: number, val: string) {
    setTargetZones((prev) => prev.map((z, i) => (i === idx ? val : z)))
  }

  const { instant, parseError } = useMemo(() => {
    if (!datetime.trim()) return { instant: null, parseError: '' }
    const d = wallClockToDate(datetime, sourceZone)
    if (!d || isNaN(d.getTime())) {
      return { instant: null, parseError: 'Could not parse date/time — check the format (YYYY-MM-DDTHH:MM).' }
    }
    return { instant: d, parseError: '' }
  }, [datetime, sourceZone])

  const conversions = useMemo(() => {
    if (!instant) return []
    return targetZones.map((tz) => ({
      tz,
      formatted: formatInZone(instant, tz),
    }))
  }, [instant, targetZones])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Panel title="source time">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Date & time" hint="wall-clock time in the source timezone below">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                style={{
                  flex: 1,
                  background: 'var(--ink-850)',
                  border: '1px solid var(--line)',
                  color: 'var(--bone)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  padding: '7px 10px',
                  outline: 'none',
                  colorScheme: 'dark',
                }}
              />
              <Button onClick={setNow} variant="ghost">now</Button>
            </div>
          </Field>
          <Field label="Source timezone">
            <Select value={sourceZone} onChange={setSourceZone} options={zoneOptions} />
          </Field>
        </div>
      </Panel>

      {parseError && <Notice kind="error">{parseError}</Notice>}

      {/* source formatted */}
      {instant && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--mute)',
            padding: '6px 0',
          }}
        >
          Interpreting as:{' '}
          <span style={{ color: 'var(--bone)' }}>{formatInZone(instant, sourceZone)}</span>
        </div>
      )}

      {/* target zones */}
      <Panel
        title="target timezones"
        actions={
          <Button onClick={addTarget} variant="ghost">+ add zone</Button>
        }
      >
        {targetZones.length === 0 && (
          <Notice kind="info">No target timezones. Click "+ add zone" to add one.</Notice>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {targetZones.map((tz, idx) => {
            const conv = conversions[idx]
            return (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto',
                  gap: 10,
                  alignItems: 'center',
                  borderBottom: '1px solid var(--line)',
                  paddingBottom: 12,
                }}
              >
                <Select
                  value={tz}
                  onChange={(v) => updateTarget(idx, v)}
                  options={zoneOptions}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    color: instant ? 'var(--acid)' : 'var(--mute)',
                  }}
                >
                  {conv?.formatted ?? '—'}
                </span>
                <button
                  onClick={() => removeTarget(idx)}
                  title="Remove"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--mute)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '0 4px',
                  }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
