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

function fmtPct(value: number) {
  return value.toFixed(2) + '%'
}

type Result = {
  price: number
  profit: number
  marginPct: number
  markupPct: number
}

export default function MarginCalculator() {
  const [mode, setMode] = useState<'price' | 'margin'>('price')
  const [cost, setCost] = useState('')
  const [selling, setSelling] = useState('')
  const [desiredMargin, setDesiredMargin] = useState('')
  const [currency, setCurrency] = useState('USD')

  const { result, error } = useMemo<{ result: Result | null; error: string }>(() => {
    const costNum = parseFloat(cost)
    if (!cost || isNaN(costNum) || costNum < 0) {
      return { result: null, error: cost ? 'Cost must be a valid non-negative number.' : '' }
    }

    if (mode === 'price') {
      const priceNum = parseFloat(selling)
      if (!selling || isNaN(priceNum)) {
        return { result: null, error: selling ? 'Selling price must be a valid number.' : '' }
      }
      if (priceNum <= 0) {
        return { result: null, error: 'Selling price must be greater than zero.' }
      }
      const profit = priceNum - costNum
      const marginPct = (profit / priceNum) * 100
      const markupPct = costNum > 0 ? (profit / costNum) * 100 : 0
      return {
        result: {
          price: priceNum,
          profit: Math.round(profit * 100) / 100,
          marginPct: Math.round(marginPct * 100) / 100,
          markupPct: Math.round(markupPct * 100) / 100,
        },
        error: '',
      }
    } else {
      const marginNum = parseFloat(desiredMargin)
      if (!desiredMargin || isNaN(marginNum)) {
        return { result: null, error: desiredMargin ? 'Desired margin must be a valid number.' : '' }
      }
      if (marginNum <= 0 || marginNum >= 100) {
        return { result: null, error: 'Desired margin must be between 0% and 100% (exclusive).' }
      }
      const price = costNum / (1 - marginNum / 100)
      const profit = price - costNum
      const markupPct = costNum > 0 ? (profit / costNum) * 100 : 0
      return {
        result: {
          price: Math.round(price * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          marginPct: Math.round(marginNum * 100) / 100,
          markupPct: Math.round(markupPct * 100) / 100,
        },
        error: '',
      }
    }
  }, [cost, selling, desiredMargin, mode, currency])

  const resultStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  }

  const statStyle: React.CSSProperties = {
    background: 'var(--ink-800)',
    border: '1px solid var(--line)',
    borderRadius: '4px',
    padding: '0.75rem 1rem',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--ff-mono)',
    fontSize: '0.7rem',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '0.25rem',
  }

  const valueStyle: React.CSSProperties = {
    fontFamily: 'var(--ff-mono)',
    fontSize: '1.25rem',
    color: 'var(--acid)',
    fontWeight: 600,
  }

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'price' | 'margin')}
          options={[
            { value: 'price', label: 'Cost + Price' },
            { value: 'margin', label: 'Cost + Margin %' },
          ]}
        />
        <Select value={currency} onChange={setCurrency} options={CURRENCIES} />
      </Toolbar>

      <IO>
        <Panel title="inputs">
          <Field label="Cost price">
            <TextInput
              type="number"
              value={cost}
              onChange={setCost}
              placeholder="e.g. 80"
            />
          </Field>

          {mode === 'price' ? (
            <Field label="Selling price">
              <TextInput
                type="number"
                value={selling}
                onChange={setSelling}
                placeholder="e.g. 100"
              />
            </Field>
          ) : (
            <Field label="Desired margin %" hint="Enter a value between 0 and 100">
              <TextInput
                type="number"
                value={desiredMargin}
                onChange={setDesiredMargin}
                placeholder="e.g. 20"
              />
            </Field>
          )}

          {error && <Notice kind="error">{error}</Notice>}
        </Panel>

        <Panel title="results">
          {result ? (
            <div style={resultStyle}>
              <div style={statStyle}>
                <span style={labelStyle}>Selling Price</span>
                <span style={valueStyle} data-testid="result-price">
                  {fmt(result.price, currency)}
                </span>
              </div>
              <div style={statStyle}>
                <span style={labelStyle}>Profit</span>
                <span style={valueStyle} data-testid="result-profit">
                  {fmt(result.profit, currency)}
                </span>
              </div>
              <div style={statStyle}>
                <span style={labelStyle}>Margin %</span>
                <span style={valueStyle} data-testid="result-margin">
                  {fmtPct(result.marginPct)}
                </span>
              </div>
              <div style={statStyle}>
                <span style={labelStyle}>Markup %</span>
                <span style={valueStyle} data-testid="result-markup">
                  {fmtPct(result.markupPct)}
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
