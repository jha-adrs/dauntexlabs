'use client'

import { useMemo, useState } from 'react'
import { Field, Notice, CopyButton } from '@/components/ui/kit'

type DiffResult = {
  totalDays: number
  totalWeeks: number
  remainderDays: number
  years: number
  months: number
  days: number
}

function computeDiff(startStr: string, endStr: string): { result?: DiffResult; error?: string } {
  if (!startStr) return { error: 'Enter a start date.' }
  if (!endStr) return { error: 'Enter an end date.' }

  const start = new Date(startStr + 'T00:00:00')
  const end = new Date(endStr + 'T00:00:00')

  if (isNaN(start.getTime())) return { error: 'Invalid start date.' }
  if (isNaN(end.getTime())) return { error: 'Invalid end date.' }

  // Work with absolute (start <= end)
  const earlier = start <= end ? start : end
  const later = start <= end ? end : start

  const msPerDay = 86400000
  const totalDays = Math.round((later.getTime() - earlier.getTime()) / msPerDay)
  const totalWeeks = Math.floor(totalDays / 7)
  const remainderDays = totalDays % 7

  // Calendar-correct years/months/days breakdown
  let years = later.getFullYear() - earlier.getFullYear()
  let months = later.getMonth() - earlier.getMonth()
  let days = later.getDate() - earlier.getDate()

  if (days < 0) {
    months -= 1
    const prevMonth = new Date(later.getFullYear(), later.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  return { result: { totalDays, totalWeeks, remainderDays, years, months, days } }
}

function formatDate(str: string): string {
  if (!str) return ''
  const d = new Date(str + 'T00:00:00')
  if (isNaN(d.getTime())) return str
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function DateDifference() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const { result, error } = useMemo(() => computeDiff(start, end), [start, end])

  const summaryText = result
    ? `${result.totalDays} days (${result.years}y ${result.months}m ${result.days}d)`
    : ''

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Start date">
            <input
              type="date"
              className="inp"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              aria-label="Start date"
            />
          </Field>
          <Field label="End date">
            <input
              type="date"
              className="inp"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              aria-label="End date"
            />
          </Field>
        </div>

        {error && <Notice kind="error">{error}</Notice>}

        {result && (
          <section className="panel">
            <header className="panel-head">
              <span className="panel-title">difference</span>
              <span className="panel-actions">
                <CopyButton text={summaryText} />
              </span>
            </header>
            <div className="panel-body">
              {start && end && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--ink-400)',
                    fontFamily: 'var(--ff-mono)',
                    marginBottom: '1rem',
                  }}
                >
                  {formatDate(start <= end ? start : end)} → {formatDate(start <= end ? end : start)}
                </div>
              )}

              {/* Primary metric */}
              <div
                style={{
                  background: 'var(--ink-800)',
                  border: '1px solid var(--line)',
                  borderRadius: '0.375rem',
                  padding: '1.25rem',
                  textAlign: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <div
                  style={{
                    fontSize: '3rem',
                    fontFamily: 'var(--ff-mono)',
                    color: 'var(--acid)',
                    lineHeight: 1.1,
                  }}
                  aria-label={`${result.totalDays} total days`}
                >
                  {result.totalDays.toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--ink-400)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontFamily: 'var(--ff-mono)',
                    marginTop: '0.25rem',
                  }}
                >
                  Total days
                </div>
              </div>

              {/* Secondary metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <StatRow label="Total weeks" value={`${result.totalWeeks.toLocaleString()} wk + ${result.remainderDays} d`} />
                <StatRow label="Breakdown" value={`${result.years}y ${result.months}m ${result.days}d`} />
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--ink-900)',
        border: '1px solid var(--line)',
        borderRadius: '0.25rem',
        padding: '0.6rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
      }}
    >
      <span
        style={{
          fontSize: '0.65rem',
          color: 'var(--ink-400)',
          fontFamily: 'var(--ff-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--ff-mono)',
          color: 'var(--bone)',
          fontSize: '0.85rem',
        }}
      >
        {value}
      </span>
    </div>
  )
}
