'use client'

import { useState, useMemo } from 'react'
import {
  Button,
  CopyButton,
  Field,
  TextInput,
  Select,
  Segmented,
  Toolbar,
  Panel,
  Notice,
} from '@/components/ui/kit'

/* ── relative time ──────────────────────────────────────────────────────── */

function relativeTime(ms: number): string {
  const nowMs = Date.now()
  const diff = nowMs - ms
  const abs = Math.abs(diff)
  const past = diff >= 0

  const MINUTE = 60_000
  const HOUR = 3_600_000
  const DAY = 86_400_000
  const WEEK = 7 * DAY
  const MONTH = 30 * DAY
  const YEAR = 365 * DAY

  let label: string
  if (abs < 5_000) {
    label = 'just now'
    return label
  } else if (abs < MINUTE) {
    const s = Math.round(abs / 1000)
    label = `${s} second${s !== 1 ? 's' : ''}`
  } else if (abs < HOUR) {
    const m = Math.round(abs / MINUTE)
    label = `${m} minute${m !== 1 ? 's' : ''}`
  } else if (abs < DAY) {
    const h = Math.round(abs / HOUR)
    label = `${h} hour${h !== 1 ? 's' : ''}`
  } else if (abs < WEEK) {
    const d = Math.round(abs / DAY)
    label = `${d} day${d !== 1 ? 's' : ''}`
  } else if (abs < MONTH) {
    const w = Math.round(abs / WEEK)
    label = `${w} week${w !== 1 ? 's' : ''}`
  } else if (abs < YEAR) {
    const mo = Math.round(abs / MONTH)
    label = `${mo} month${mo !== 1 ? 's' : ''}`
  } else {
    const y = Math.round(abs / YEAR)
    label = `${y} year${y !== 1 ? 's' : ''}`
  }

  return past ? `${label} ago` : `in ${label}`
}

/* ── unit auto-detect ───────────────────────────────────────────────────── */

function detectUnit(raw: string): 's' | 'ms' {
  const trimmed = raw.trim().replace(/[^0-9]/g, '')
  return trimmed.length >= 13 ? 'ms' : 's'
}

function toMilliseconds(value: number, unit: string): number {
  if (unit === 'auto') {
    return String(Math.round(Math.abs(value))).replace(/[^0-9]/g, '').length >= 13
      ? value
      : value * 1000
  }
  return unit === 'ms' ? value : value * 1000
}

/* ── output row ─────────────────────────────────────────────────────────── */

function OutputRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem 0.75rem',
        borderRadius: 4,
        background: 'var(--ink-850)',
        border: '1px solid var(--line)',
        minHeight: '2.4rem',
      }}
    >
      <span
        style={{
          width: '7rem',
          flexShrink: 0,
          color: 'var(--mute)',
          fontSize: '0.78rem',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
      <code
        style={{
          flex: 1,
          color: 'var(--bone)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.88rem',
          wordBreak: 'break-all',
          minWidth: 0,
        }}
      >
        {value}
      </code>
      <div style={{ flexShrink: 0 }}>
        <CopyButton text={value} />
      </div>
    </div>
  )
}

/* ── result types ────────────────────────────────────────────────────────── */

type UnixResult =
  | { ok: true; utc: string; local: string; iso: string; rfc: string; relative: string }
  | { ok: false; error: string }

type DateResult =
  | { ok: true; seconds: string; milliseconds: string }
  | { ok: false; error: string }

/* ── Unix → Date panel ──────────────────────────────────────────────────── */

function UnixToDate() {
  const [input, setInput] = useState('')
  const [unit, setUnit] = useState('auto')

  const result = useMemo((): UnixResult | null => {
    if (!input.trim()) return null
    const n = parseFloat(input.trim())
    if (isNaN(n)) return { ok: false, error: 'Not a valid number.' }
    const ms = toMilliseconds(n, unit)
    const d = new Date(ms)
    if (isNaN(d.getTime())) return { ok: false, error: 'Timestamp out of range.' }
    return {
      ok: true,
      utc: d.toUTCString(),
      local: d.toLocaleString(),
      iso: d.toISOString(),
      rfc: d.toDateString() + ' ' + d.toTimeString(),
      relative: relativeTime(ms),
    }
  }, [input, unit])

  function fillNow() {
    setUnit('ms')
    setInput(String(Date.now()))
  }

  return (
    <Panel title="Unix → Date">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <Field label="Unix timestamp">
            <TextInput value={input} onChange={setInput} placeholder="e.g. 1700000000 or 1700000000000" />
          </Field>
          <Field label="Unit">
            <Select
              value={unit}
              onChange={setUnit}
              options={[
                { value: 'auto', label: `Auto-detect${input ? ` (${detectUnit(input)})` : ''}` },
                { value: 's', label: 'Seconds' },
                { value: 'ms', label: 'Milliseconds' },
              ]}
            />
          </Field>
          <Button variant="ghost" onClick={fillNow}>
            Now
          </Button>
        </div>

        {result && !result.ok && <Notice kind="error">{result.error}</Notice>}

        {result?.ok && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <OutputRow label="UTC" value={result.utc} />
            <OutputRow label="Local" value={result.local} />
            <OutputRow label="ISO 8601" value={result.iso} />
            <OutputRow label="RFC 2822" value={result.rfc} />
            <OutputRow label="Relative" value={result.relative} />
          </div>
        )}

        {!input && (
          <span style={{ color: 'var(--mute)', fontSize: '0.82rem' }}>
            Enter a Unix timestamp above or click Now.
          </span>
        )}
      </div>
    </Panel>
  )
}

/* ── Date → Unix panel ──────────────────────────────────────────────────── */

function DateToUnix() {
  const [input, setInput] = useState('')

  const result = useMemo((): DateResult | null => {
    if (!input.trim()) return null
    const d = new Date(input.trim())
    if (isNaN(d.getTime())) return { ok: false, error: 'Cannot parse this date string. Try ISO 8601 format, e.g. 2024-11-14T12:00:00Z' }
    const ms = d.getTime()
    const s = Math.floor(ms / 1000)
    return { ok: true, seconds: String(s), milliseconds: String(ms) }
  }, [input])

  function fillNow() {
    setInput(new Date().toISOString())
  }

  return (
    <Panel title="Date → Unix">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <Field label="Date / ISO string">
            <TextInput
              value={input}
              onChange={setInput}
              placeholder="e.g. 2024-11-14T12:00:00Z or Nov 14 2024"
            />
          </Field>
          <Button variant="ghost" onClick={fillNow}>
            Now
          </Button>
        </div>

        {result && !result.ok && <Notice kind="error">{result.error}</Notice>}

        {result?.ok && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <OutputRow label="Seconds" value={result.seconds} />
            <OutputRow label="Milliseconds" value={result.milliseconds} />
          </div>
        )}

        {!input && (
          <span style={{ color: 'var(--mute)', fontSize: '0.82rem' }}>
            Enter a date string above or click Now.
          </span>
        )}
      </div>
    </Panel>
  )
}

/* ── component ──────────────────────────────────────────────────────────── */

export default function TimestampConverter() {
  const [mode, setMode] = useState('unix-to-date')

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'unix-to-date', label: 'Unix → Date' },
            { value: 'date-to-unix', label: 'Date → Unix' },
          ]}
        />
      </Toolbar>

      <div style={{ marginTop: 16 }}>
        {mode === 'unix-to-date' ? <UnixToDate /> : <DateToUnix />}
      </div>
    </>
  )
}
