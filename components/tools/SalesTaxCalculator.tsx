'use client'

import { useMemo, useState } from 'react'
import {
  Field,
  TextInput,
  Select,
  Segmented,
  Toolbar,
  IO,
  Panel,
  Notice,
} from '@/components/ui/kit'

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'JPY', label: 'JPY (¥)' },
]

function fmt(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

type Result = {
  net: number
  tax: number
  gross: number
}

export default function SalesTaxCalculator() {
  const [mode, setMode] = useState<'add' | 'extract'>('add')
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState('')
  const [currency, setCurrency] = useState('USD')

  const { result, error } = useMemo<{ result: Result | null; error: string }>(() => {
    const amountNum = parseFloat(amount)
    const rateNum = parseFloat(rate)

    if (!amount || isNaN(amountNum) || amountNum < 0) {
      return { result: null, error: amount ? 'Amount must be a valid non-negative number.' : '' }
    }
    if (!rate || isNaN(rateNum) || rateNum < 0) {
      return { result: null, error: rate ? 'Tax rate must be a valid non-negative number.' : '' }
    }
    if (rateNum >= 100 && mode === 'extract') {
      return { result: null, error: 'Tax rate must be less than 100% when extracting.' }
    }

    if (mode === 'add') {
      const tax = amountNum * (rateNum / 100)
      const gross = amountNum + tax
      return {
        result: {
          net: Math.round(amountNum * 100) / 100,
          tax: Math.round(tax * 100) / 100,
          gross: Math.round(gross * 100) / 100,
        },
        error: '',
      }
    } else {
      const divisor = 1 + rateNum / 100
      const net = amountNum / divisor
      const tax = amountNum - net
      return {
        result: {
          net: Math.round(net * 100) / 100,
          tax: Math.round(tax * 100) / 100,
          gross: Math.round(amountNum * 100) / 100,
        },
        error: '',
      }
    }
  }, [amount, rate, mode, currency])

  const statStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--line)',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--ff-mono)',
    fontSize: '0.75rem',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const valueStyle: React.CSSProperties = {
    fontFamily: 'var(--ff-mono)',
    fontSize: '1.1rem',
    color: 'var(--acid)',
    fontWeight: 600,
  }

  const highlightedValueStyle: React.CSSProperties = {
    ...valueStyle,
    fontSize: '1.35rem',
  }

  const rowsWrap: React.CSSProperties = {
    border: '1px solid var(--line)',
    borderRadius: '4px',
    overflow: 'hidden',
  }

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'add' | 'extract')}
          options={[
            { value: 'add', label: 'Add tax' },
            { value: 'extract', label: 'Extract tax' },
          ]}
        />
        <Select value={currency} onChange={setCurrency} options={CURRENCIES} />
      </Toolbar>

      <IO>
        <Panel title="inputs">
          <Field label={mode === 'add' ? 'Net amount (before tax)' : 'Gross amount (tax included)'}>
            <TextInput
              type="number"
              value={amount}
              onChange={setAmount}
              placeholder="e.g. 100"
            />
          </Field>

          <Field label="Tax rate %" hint="e.g. 20 for 20%">
            <TextInput
              type="number"
              value={rate}
              onChange={setRate}
              placeholder="e.g. 20"
            />
          </Field>

          {error && <Notice kind="error">{error}</Notice>}
        </Panel>

        <Panel title="results">
          {result ? (
            <div style={rowsWrap}>
              <div style={statStyle}>
                <span style={labelStyle}>Net (pre-tax)</span>
                <span style={valueStyle} data-testid="result-net">
                  {fmt(result.net, currency)}
                </span>
              </div>
              <div style={statStyle}>
                <span style={labelStyle}>Tax amount</span>
                <span style={valueStyle} data-testid="result-tax">
                  {fmt(result.tax, currency)}
                </span>
              </div>
              <div style={{ ...statStyle, borderBottom: 'none', background: 'var(--ink-800)' }}>
                <span style={{ ...labelStyle, color: 'var(--bone)' }}>Gross (with tax)</span>
                <span style={highlightedValueStyle} data-testid="result-gross">
                  {fmt(result.gross, currency)}
                </span>
              </div>
            </div>
          ) : (
            <Notice kind="info">Enter values on the left to see results.</Notice>
          )}
        </Panel>
      </IO>
    </>
  )
}
