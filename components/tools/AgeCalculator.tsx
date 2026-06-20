'use client'

import { useMemo, useState } from 'react'
import { Field, Notice, CopyButton } from '@/components/ui/kit'

function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type AgeResult = {
  years: number
  months: number
  days: number
  totalDays: number
  totalWeeks: number
  totalMonths: number
}

function computeAge(dobStr: string, asOfStr: string): { result?: AgeResult; error?: string } {
  if (!dobStr) return { error: 'Enter a date of birth.' }
  if (!asOfStr) return { error: 'Enter an "age at" date.' }

  const dob = new Date(dobStr + 'T00:00:00')
  const asOf = new Date(asOfStr + 'T00:00:00')

  if (isNaN(dob.getTime())) return { error: 'Invalid date of birth.' }
  if (isNaN(asOf.getTime())) return { error: 'Invalid "age at" date.' }
  if (dob > asOf) return { error: 'Date of birth must be on or before the "age at" date.' }

  // Total days (UTC to avoid DST)
  const msPerDay = 86400000
  const totalDays = Math.round((asOf.getTime() - dob.getTime()) / msPerDay)
  const totalWeeks = Math.floor(totalDays / 7)

  // Calendar-correct years/months/days with borrow logic
  let years = asOf.getFullYear() - dob.getFullYear()
  let months = asOf.getMonth() - dob.getMonth()
  let days = asOf.getDate() - dob.getDate()

  if (days < 0) {
    months -= 1
    // Days in the month before asOf
    const prevMonth = new Date(asOf.getFullYear(), asOf.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  // Total full months elapsed
  const totalMonths = years * 12 + months

  return { result: { years, months, days, totalDays, totalWeeks, totalMonths } }
}

export default function AgeCalculator() {
  const [dob, setDob] = useState('')
  const [asOf, setAsOf] = useState(todayStr())

  const { result, error } = useMemo(() => computeAge(dob, asOf), [dob, asOf])

  const summaryText = result
    ? `${result.years} years, ${result.months} months, ${result.days} days`
    : ''

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Date of birth">
            <input
              type="date"
              className="inp"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              aria-label="Date of birth"
            />
          </Field>
          <Field label="Age at date">
            <input
              type="date"
              className="inp"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              aria-label="Age at date"
            />
          </Field>
        </div>

        {error && <Notice kind="error">{error}</Notice>}

        {result && (
          <section className="panel">
            <header className="panel-head">
              <span className="panel-title">age result</span>
              <span className="panel-actions">
                <CopyButton text={summaryText} />
              </span>
            </header>
            <div className="panel-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                }}
              >
                {(
                  [
                    ['Years', result.years],
                    ['Months', result.months],
                    ['Days', result.days],
                  ] as [string, number][]
                ).map(([label, val]) => (
                  <div
                    key={label}
                    style={{
                      background: 'var(--ink-800)',
                      border: '1px solid var(--line)',
                      borderRadius: '0.375rem',
                      padding: '1rem 0.75rem',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '2rem',
                        fontFamily: 'var(--ff-mono)',
                        color: 'var(--acid)',
                        lineHeight: 1.1,
                      }}
                    >
                      {val}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--ink-400)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginTop: '0.25rem',
                        fontFamily: 'var(--ff-mono)',
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                }}
              >
                {(
                  [
                    ['Total days', result.totalDays],
                    ['Total weeks', result.totalWeeks],
                    ['Total months', result.totalMonths],
                  ] as [string, number][]
                ).map(([label, val]) => (
                  <div
                    key={label}
                    style={{
                      background: 'var(--ink-900)',
                      border: '1px solid var(--line)',
                      borderRadius: '0.25rem',
                      padding: '0.6rem 0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.7rem',
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
                      {val.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
