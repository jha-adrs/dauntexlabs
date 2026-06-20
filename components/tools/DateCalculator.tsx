'use client'

import { useMemo, useState } from 'react'
import { Field, Select, Segmented, Toolbar, Notice, CopyButton } from '@/components/ui/kit'
import { TextInput } from '@/components/ui/kit'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const UNIT_OPTIONS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
]

const OP_OPTIONS = [
  { value: 'add', label: 'Add' },
  { value: 'subtract', label: 'Subtract' },
]

function addDate(
  startStr: string,
  op: 'add' | 'subtract',
  amount: number,
  unit: string,
): { result?: { dateStr: string; formatted: string; weekday: string }; error?: string } {
  if (!startStr) return { error: 'Enter a start date.' }
  if (isNaN(amount) || amount < 0) return { error: 'Enter a valid non-negative amount.' }

  const start = new Date(startStr + 'T00:00:00')
  if (isNaN(start.getTime())) return { error: 'Invalid start date.' }

  const sign = op === 'add' ? 1 : -1
  let result: Date

  if (unit === 'days') {
    result = new Date(start)
    result.setDate(result.getDate() + sign * amount)
  } else if (unit === 'weeks') {
    result = new Date(start)
    result.setDate(result.getDate() + sign * amount * 7)
  } else if (unit === 'months') {
    // End-of-month clamp: e.g. Jan 31 + 1 month → Feb 28/29
    // Use UTC-based arithmetic to avoid DST surprises
    const rawMonth = start.getMonth() + sign * amount
    const targetYear = start.getFullYear() + Math.floor(rawMonth / 12)
    const targetMonth = ((rawMonth % 12) + 12) % 12
    // Days in target month
    const daysInTarget = new Date(targetYear, targetMonth + 1, 0).getDate()
    const targetDay = Math.min(start.getDate(), daysInTarget)
    result = new Date(targetYear, targetMonth, targetDay)
  } else {
    // years — build from scratch to avoid JS month overflow on Feb 29
    const targetYear = start.getFullYear() + sign * amount
    const targetMonth = start.getMonth()
    const daysInTarget = new Date(targetYear, targetMonth + 1, 0).getDate()
    const targetDay = Math.min(start.getDate(), daysInTarget)
    result = new Date(targetYear, targetMonth, targetDay)
  }

  const y = result.getFullYear()
  const m = String(result.getMonth() + 1).padStart(2, '0')
  const d = String(result.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${d}`
  const formatted = result.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const weekday = WEEKDAYS[result.getDay()]

  return { result: { dateStr, formatted, weekday } }
}

export default function DateCalculator() {
  const [start, setStart] = useState('')
  const [op, setOp] = useState<'add' | 'subtract'>('add')
  const [amount, setAmount] = useState('1')
  const [unit, setUnit] = useState('days')

  const numAmount = parseInt(amount, 10)

  const { result, error } = useMemo(
    () => addDate(start, op, numAmount, unit),
    [start, op, numAmount, unit],
  )

  const copyText = result ? `${result.dateStr} (${result.weekday})` : ''

  return (
    <>
      <Toolbar>
        <Segmented
          value={op}
          onChange={(v) => setOp(v as 'add' | 'subtract')}
          options={OP_OPTIONS}
        />
      </Toolbar>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', alignItems: 'end' }}>
          <Field label="Start date">
            <input
              type="date"
              className="inp"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              aria-label="Start date"
            />
          </Field>
          <Field label="Amount">
            <TextInput
              type="number"
              value={amount}
              onChange={setAmount}
              placeholder="1"
            />
          </Field>
          <Field label="Unit">
            <Select value={unit} onChange={setUnit} options={UNIT_OPTIONS} />
          </Field>
        </div>

        {error && <Notice kind="error">{error}</Notice>}

        {result && (
          <section className="panel">
            <header className="panel-head">
              <span className="panel-title">result date</span>
              <span className="panel-actions">
                <CopyButton text={copyText} />
              </span>
            </header>
            <div className="panel-body">
              <div
                style={{
                  background: 'var(--ink-800)',
                  border: '1px solid var(--line)',
                  borderRadius: '0.375rem',
                  padding: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '2rem',
                    fontFamily: 'var(--ff-mono)',
                    color: 'var(--acid)',
                    lineHeight: 1.2,
                  }}
                >
                  {result.dateStr}
                </div>
                <div
                  style={{
                    fontSize: '1rem',
                    color: 'var(--bone)',
                    marginTop: '0.4rem',
                  }}
                >
                  {result.formatted}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--ink-400)',
                    fontFamily: 'var(--ff-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginTop: '0.5rem',
                  }}
                >
                  {result.weekday}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
