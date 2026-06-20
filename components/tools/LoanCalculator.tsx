'use client'

import { useMemo, useState } from 'react'
import {
  Field,
  TextInput,
  Select,
  Segmented,
  Toolbar,
  Panel,
  Notice,
  CopyButton,
} from '@/components/ui/kit'

type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY'

const CURRENCY_OPTS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'JPY', label: 'JPY (¥)' },
]

const LOCALE_MAP: Record<Currency, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  INR: 'en-IN',
  JPY: 'ja-JP',
}

function fmt(value: number, currency: Currency) {
  const decimals = currency === 'JPY' ? 0 : 2
  return new Intl.NumberFormat(LOCALE_MAP[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

type AmortRow = {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

function computeAmortization(P: number, annualRate: number, months: number): AmortRow[] {
  const r = annualRate / 100 / 12
  const rows: AmortRow[] = []
  let balance = P

  for (let m = 1; m <= months; m++) {
    const interestPmt = balance * r
    const M = r === 0 ? P / months : (P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
    const principalPmt = M - interestPmt
    balance = Math.max(0, balance - principalPmt)
    rows.push({
      month: m,
      payment: M,
      principal: principalPmt,
      interest: interestPmt,
      balance,
    })
  }
  return rows
}

export default function LoanCalculator() {
  const [principal, setPrincipal] = useState('10000')
  const [rate, setRate] = useState('5')
  const [termValue, setTermValue] = useState('1')
  const [termUnit, setTermUnit] = useState('years')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [showFull, setShowFull] = useState(false)

  const result = useMemo(() => {
    const P = parseFloat(principal)
    const annualRate = parseFloat(rate)
    const tv = parseFloat(termValue)

    if (!principal || !rate || !termValue) return null
    if (isNaN(P) || P <= 0) return { error: 'Principal must be a positive number.' }
    if (isNaN(annualRate) || annualRate < 0) return { error: 'Interest rate must be 0 or greater.' }
    if (isNaN(tv) || tv <= 0) return { error: 'Term must be a positive number.' }

    const months = termUnit === 'years' ? Math.round(tv * 12) : Math.round(tv)
    if (months < 1) return { error: 'Term must be at least 1 month.' }

    const r = annualRate / 100 / 12
    const M =
      r === 0
        ? P / months
        : (P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)

    const totalPaid = M * months
    const totalInterest = totalPaid - P
    const schedule = computeAmortization(P, annualRate, months)

    return { M, totalPaid, totalInterest, months, schedule, error: null }
  }, [principal, rate, termValue, termUnit])

  const summaryText =
    result && !result.error
      ? `Monthly Payment: ${fmt(result.M!, currency)}\nTotal Paid: ${fmt(result.totalPaid!, currency)}\nTotal Interest: ${fmt(result.totalInterest!, currency)}`
      : ''

  const displayRows =
    result && !result.error
      ? showFull
        ? result.schedule!
        : result.schedule!.slice(0, 12)
      : []

  return (
    <>
      <Toolbar>
        <Field label="Currency">
          <Select
            value={currency}
            onChange={(v) => setCurrency(v as Currency)}
            options={CURRENCY_OPTS}
          />
        </Field>
      </Toolbar>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <Field label="Loan Amount">
          <TextInput
            type="number"
            value={principal}
            onChange={setPrincipal}
            placeholder="e.g. 10000"
          />
        </Field>
        <Field label="Annual Interest Rate (%)">
          <TextInput
            type="number"
            value={rate}
            onChange={setRate}
            placeholder="e.g. 5"
          />
        </Field>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <Field label="Loan Term">
          <TextInput
            type="number"
            value={termValue}
            onChange={setTermValue}
            placeholder="e.g. 1"
          />
        </Field>
        <Segmented
          value={termUnit}
          onChange={setTermUnit}
          options={[
            { value: 'years', label: 'Years' },
            { value: 'months', label: 'Months' },
          ]}
        />
      </div>

      {result?.error && <Notice kind="error">{result.error}</Notice>}

      {result && !result.error && (
        <>
          <Panel
            title="summary"
            actions={<CopyButton text={summaryText} />}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                padding: '0.5rem 0',
              }}
            >
              {[
                { label: 'Monthly Payment', value: fmt(result.M!, currency) },
                { label: 'Total Paid', value: fmt(result.totalPaid!, currency) },
                { label: 'Total Interest', value: fmt(result.totalInterest!, currency) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: 'var(--ink-850)',
                    border: '1px solid var(--line)',
                    borderRadius: '4px',
                    padding: '0.75rem 1rem',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      color: 'var(--mute)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.35rem',
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.1rem',
                      color: 'var(--acid)',
                      fontWeight: 600,
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={`amortization schedule — ${result.months} months`}>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line-strong)' }}>
                    {['Month', 'Payment', 'Principal', 'Interest', 'Balance'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.4rem 0.6rem',
                          textAlign: 'right',
                          color: 'var(--mute)',
                          fontWeight: 400,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          fontSize: '0.65rem',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => (
                    <tr
                      key={row.month}
                      style={{ borderBottom: '1px solid var(--line)' }}
                    >
                      <td style={{ padding: '0.35rem 0.6rem', textAlign: 'right', color: 'var(--mute-2)' }}>
                        {row.month}
                      </td>
                      <td style={{ padding: '0.35rem 0.6rem', textAlign: 'right', color: 'var(--bone)' }}>
                        {fmt(row.payment, currency)}
                      </td>
                      <td style={{ padding: '0.35rem 0.6rem', textAlign: 'right', color: 'var(--bone)' }}>
                        {fmt(row.principal, currency)}
                      </td>
                      <td style={{ padding: '0.35rem 0.6rem', textAlign: 'right', color: 'var(--bone)' }}>
                        {fmt(row.interest, currency)}
                      </td>
                      <td style={{ padding: '0.35rem 0.6rem', textAlign: 'right', color: 'var(--acid)' }}>
                        {fmt(row.balance, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.schedule!.length > 12 && (
              <button
                onClick={() => setShowFull((v) => !v)}
                style={{
                  marginTop: '0.75rem',
                  background: 'none',
                  border: '1px solid var(--line)',
                  color: 'var(--mute)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  padding: '0.3rem 0.8rem',
                  cursor: 'pointer',
                  borderRadius: '3px',
                }}
              >
                {showFull
                  ? 'Show first 12 rows'
                  : `Show all ${result.schedule!.length} months`}
              </button>
            )}
          </Panel>
        </>
      )}
    </>
  )
}
