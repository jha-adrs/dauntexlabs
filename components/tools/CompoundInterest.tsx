'use client'

import { useMemo, useState } from 'react'
import {
  Field,
  TextInput,
  Select,
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

const COMPOUND_OPTS = [
  { value: '1', label: 'Annually (1×/yr)' },
  { value: '2', label: 'Semiannually (2×/yr)' },
  { value: '4', label: 'Quarterly (4×/yr)' },
  { value: '12', label: 'Monthly (12×/yr)' },
  { value: '365', label: 'Daily (365×/yr)' },
]

function fmt(value: number, currency: Currency) {
  const decimals = currency === 'JPY' ? 0 : 2
  return new Intl.NumberFormat(LOCALE_MAP[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export default function CompoundInterest() {
  const [principal, setPrincipal] = useState('1000')
  const [rate, setRate] = useState('5')
  const [compounds, setCompounds] = useState('1')
  const [years, setYears] = useState('10')
  const [contribution, setContribution] = useState('0')
  const [currency, setCurrency] = useState<Currency>('USD')

  const result = useMemo(() => {
    const P = parseFloat(principal)
    const r = parseFloat(rate)
    const n = parseFloat(compounds)
    const t = parseFloat(years)
    const c = parseFloat(contribution || '0')

    if (!principal || !rate || !years) return null
    if (isNaN(P) || P < 0) return { error: 'Principal must be 0 or greater.' }
    if (isNaN(r) || r < 0) return { error: 'Rate must be 0 or greater.' }
    if (isNaN(n) || n <= 0) return { error: 'Compounding frequency must be positive.' }
    if (isNaN(t) || t <= 0) return { error: 'Years must be a positive number.' }
    if (isNaN(c) || c < 0) return { error: 'Monthly contribution must be 0 or greater.' }

    // A = P(1 + r/n)^(n*t)
    const rDecimal = r / 100
    const principalFV = P * Math.pow(1 + rDecimal / n, n * t)

    // Future value of monthly contributions (annuity)
    // FV_annuity = c * [((1 + r_monthly)^totalMonths - 1) / r_monthly]
    let contributionFV = 0
    if (c > 0) {
      const totalMonths = t * 12
      const rMonthly = rDecimal / 12
      if (rMonthly === 0) {
        contributionFV = c * totalMonths
      } else {
        contributionFV = c * ((Math.pow(1 + rMonthly, totalMonths) - 1) / rMonthly)
      }
    }

    const finalBalance = principalFV + contributionFV
    const totalContributions = P + c * t * 12
    const totalInterest = finalBalance - totalContributions

    return { finalBalance, totalContributions, totalInterest, error: null }
  }, [principal, rate, compounds, years, contribution])

  const summaryText =
    result && !result.error
      ? `Final Balance: ${fmt(result.finalBalance!, currency)}\nTotal Contributions: ${fmt(result.totalContributions!, currency)}\nTotal Interest Earned: ${fmt(result.totalInterest!, currency)}`
      : ''

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

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}
      >
        <Field label="Principal (initial deposit)">
          <TextInput
            type="number"
            value={principal}
            onChange={setPrincipal}
            placeholder="e.g. 1000"
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
        <Field label="Compounding Frequency">
          <Select value={compounds} onChange={setCompounds} options={COMPOUND_OPTS} />
        </Field>
        <Field label="Time (years)">
          <TextInput
            type="number"
            value={years}
            onChange={setYears}
            placeholder="e.g. 10"
          />
        </Field>
        <Field label="Monthly Contribution (optional)">
          <TextInput
            type="number"
            value={contribution}
            onChange={setContribution}
            placeholder="e.g. 100"
          />
        </Field>
      </div>

      {result?.error && <Notice kind="error">{result.error}</Notice>}

      {result && !result.error && (
        <Panel title="results" actions={<CopyButton text={summaryText} />}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              padding: '0.5rem 0',
            }}
          >
            {[
              { label: 'Final Balance', value: fmt(result.finalBalance!, currency), accent: true },
              { label: 'Total Contributions', value: fmt(result.totalContributions!, currency), accent: false },
              { label: 'Interest Earned', value: fmt(result.totalInterest!, currency), accent: false },
            ].map(({ label, value, accent }) => (
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
                    color: accent ? 'var(--acid)' : 'var(--bone)',
                    fontWeight: 600,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  )
}
