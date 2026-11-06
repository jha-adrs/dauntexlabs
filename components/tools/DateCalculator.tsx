'use client'

import { useMemo, useState } from 'react'
import { Button, Field, Select, Segmented, TextArea, TextInput, Toolbar, Notice, CopyButton } from '@/components/ui/kit'
import {
  addBusinessDays,
  addCalendar,
  describeDate,
  parseHolidays,
  type Result,
  type Unit,
  type Weekend,
} from '@/lib/date-calc'

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

const MODE_OPTIONS = [
  { value: 'calendar', label: 'Calendar' },
  { value: 'business', label: 'Business days' },
]

const WEEKEND_OPTIONS = [
  { value: 'sat-sun', label: 'Saturday and Sunday' },
  { value: 'fri-sat', label: 'Friday and Saturday' },
  { value: 'sun', label: 'Sunday only' },
]

/** Today's date on the user's own calendar (not UTC), as YYYY-MM-DD. */
function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function DateCalculator() {
  const [start, setStart] = useState('')
  const [op, setOp] = useState<'add' | 'subtract'>('add')
  const [mode, setMode] = useState<'calendar' | 'business'>('calendar')
  const [amount, setAmount] = useState('1')
  const [unit, setUnit] = useState<Unit>('days')
  const [businessDays, setBusinessDays] = useState('')
  const [weekend, setWeekend] = useState<Weekend>('sat-sun')
  const [holidayText, setHolidayText] = useState('')

  const sign = op === 'add' ? 1 : -1
  const holidays = useMemo(() => parseHolidays(holidayText), [holidayText])

  const outcome = useMemo<Result<string> | null>(() => {
    if (mode === 'calendar') return addCalendar(start, parseInt(amount, 10), unit, sign)
    if (start && businessDays.trim() === '') return null
    return addBusinessDays(start, Number(businessDays), sign, weekend, new Set(holidays.dates))
  }, [mode, start, amount, unit, sign, businessDays, weekend, holidays])

  const result = outcome?.ok ? { dateStr: outcome.value, ...describeDate(outcome.value) } : null
  const error = outcome && !outcome.ok ? outcome.error : null
  const copyText = result ? `${result.dateStr} (${result.weekday})` : ''
  const holidayCount = holidays.dates.length

  return (
    <>
      <Toolbar>
        <Segmented value={op} onChange={(v) => setOp(v as 'add' | 'subtract')} options={OP_OPTIONS} />
        <Segmented value={mode} onChange={(v) => setMode(v as 'calendar' | 'business')} options={MODE_OPTIONS} />
      </Toolbar>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', alignItems: 'end' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
            <Field label="Start date">
              <input
                type="date"
                className="inp"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                aria-label="Start date"
              />
            </Field>
            <Button onClick={() => setStart(localToday())}>Today</Button>
          </div>
          {mode === 'calendar' ? (
            <>
              <Field label="Amount">
                <TextInput type="number" value={amount} onChange={setAmount} placeholder="1" />
              </Field>
              <Field label="Unit">
                <Select value={unit} onChange={(v) => setUnit(v as Unit)} options={UNIT_OPTIONS} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Business days">
                <TextInput type="number" value={businessDays} onChange={setBusinessDays} placeholder="e.g. 10" />
              </Field>
              <Field label="Weekend">
                <Select value={weekend} onChange={(v) => setWeekend(v as Weekend)} options={WEEKEND_OPTIONS} />
              </Field>
            </>
          )}
        </div>

        {mode === 'business' && (
          <div>
            <Field label="Holidays (optional)">
              <TextArea
                value={holidayText}
                onChange={setHolidayText}
                rows={4}
                placeholder="One date per line, e.g. 2026-01-26 Republic Day"
              />
            </Field>
            {holidayText.trim() && (
              <div style={{ color: 'var(--mute)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                <div>{`${holidayCount} ${holidayCount === 1 ? 'holiday' : 'holidays'} read`}</div>
                {holidays.invalid.length > 0 && (
                  <div style={{ color: 'var(--warn)' }}>{`Could not read: ${holidays.invalid.join(', ')}`}</div>
                )}
              </div>
            )}
          </div>
        )}

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
                  background: 'var(--surface-soft)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '2rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', lineHeight: 1.2 }}>
                  {result.dateStr}
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--fg)', marginTop: '0.4rem' }}>{result.long}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--mute)', marginTop: '0.5rem' }}>{result.weekday}</div>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
