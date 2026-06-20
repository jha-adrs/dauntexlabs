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

type Result =
  | { kind: 'percent-off' | 'amount-off'; finalPrice: number; saved: number; effectivePct: number }
  | { kind: 'find-pct'; discountPct: number; saved: number; finalPrice: number }

export default function DiscountCalculator() {
  const [mode, setMode] = useState<'percent-off' | 'amount-off' | 'find-pct'>('percent-off')
  const [original, setOriginal] = useState('')
  const [discountPct, setDiscountPct] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')
  const [finalPrice, setFinalPrice] = useState('')
  const [currency, setCurrency] = useState('USD')

  const { result, error } = useMemo<{ result: Result | null; error: string }>(() => {
    const originalNum = parseFloat(original)

    if (!original || isNaN(originalNum) || originalNum <= 0) {
      return {
        result: null,
        error: original ? 'Original price must be a valid positive number.' : '',
      }
    }

    if (mode === 'percent-off') {
      const pct = parseFloat(discountPct)
      if (!discountPct || isNaN(pct)) {
        return { result: null, error: discountPct ? 'Discount % must be a valid number.' : '' }
      }
      if (pct < 0 || pct > 100) {
        return { result: null, error: 'Discount % must be between 0 and 100.' }
      }
      const saved = originalNum * (pct / 100)
      const fp = originalNum - saved
      return {
        result: {
          kind: 'percent-off',
          finalPrice: Math.round(fp * 100) / 100,
          saved: Math.round(saved * 100) / 100,
          effectivePct: Math.round(pct * 100) / 100,
        },
        error: '',
      }
    }

    if (mode === 'amount-off') {
      const amt = parseFloat(discountAmount)
      if (!discountAmount || isNaN(amt)) {
        return {
          result: null,
          error: discountAmount ? 'Discount amount must be a valid number.' : '',
        }
      }
      if (amt < 0) {
        return { result: null, error: 'Discount amount must be non-negative.' }
      }
      if (amt > originalNum) {
        return { result: null, error: 'Discount amount cannot exceed the original price.' }
      }
      const fp = originalNum - amt
      const effectivePct = (amt / originalNum) * 100
      return {
        result: {
          kind: 'amount-off',
          finalPrice: Math.round(fp * 100) / 100,
          saved: Math.round(amt * 100) / 100,
          effectivePct: Math.round(effectivePct * 100) / 100,
        },
        error: '',
      }
    }

    // find-pct
    const fp = parseFloat(finalPrice)
    if (!finalPrice || isNaN(fp)) {
      return { result: null, error: finalPrice ? 'Final price must be a valid number.' : '' }
    }
    if (fp < 0) {
      return { result: null, error: 'Final price must be non-negative.' }
    }
    if (fp > originalNum) {
      return { result: null, error: 'Final price cannot exceed the original price.' }
    }
    const saved = originalNum - fp
    const pct = (saved / originalNum) * 100
    return {
      result: {
        kind: 'find-pct',
        discountPct: Math.round(pct * 100) / 100,
        saved: Math.round(saved * 100) / 100,
        finalPrice: Math.round(fp * 100) / 100,
      },
      error: '',
    }
  }, [mode, original, discountPct, discountAmount, finalPrice, currency])

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

  const bigValueStyle: React.CSSProperties = {
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
          onChange={(v) => setMode(v as 'percent-off' | 'amount-off' | 'find-pct')}
          options={[
            { value: 'percent-off', label: 'Percent off' },
            { value: 'amount-off', label: 'Amount off' },
            { value: 'find-pct', label: 'Find % off' },
          ]}
        />
        <Select value={currency} onChange={setCurrency} options={CURRENCIES} />
      </Toolbar>

      <IO>
        <Panel title="inputs">
          <Field label="Original price">
            <TextInput
              type="number"
              value={original}
              onChange={setOriginal}
              placeholder="e.g. 200"
            />
          </Field>

          {mode === 'percent-off' && (
            <Field label="Discount %" hint="e.g. 25 for 25% off">
              <TextInput
                type="number"
                value={discountPct}
                onChange={setDiscountPct}
                placeholder="e.g. 25"
              />
            </Field>
          )}

          {mode === 'amount-off' && (
            <Field label="Discount amount">
              <TextInput
                type="number"
                value={discountAmount}
                onChange={setDiscountAmount}
                placeholder="e.g. 50"
              />
            </Field>
          )}

          {mode === 'find-pct' && (
            <Field label="Final price (after discount)">
              <TextInput
                type="number"
                value={finalPrice}
                onChange={setFinalPrice}
                placeholder="e.g. 150"
              />
            </Field>
          )}

          {error && <Notice kind="error">{error}</Notice>}
        </Panel>

        <Panel title="results">
          {result ? (
            <div style={rowsWrap}>
              {result.kind === 'find-pct' ? (
                <>
                  <div style={statStyle}>
                    <span style={labelStyle}>Original price</span>
                    <span style={valueStyle}>{fmt(parseFloat(original), currency)}</span>
                  </div>
                  <div style={statStyle}>
                    <span style={labelStyle}>Amount saved</span>
                    <span style={valueStyle} data-testid="result-saved">
                      {fmt(result.saved, currency)}
                    </span>
                  </div>
                  <div style={statStyle}>
                    <span style={labelStyle}>Final price</span>
                    <span style={valueStyle} data-testid="result-final">
                      {fmt(result.finalPrice, currency)}
                    </span>
                  </div>
                  <div style={{ ...statStyle, borderBottom: 'none', background: 'var(--ink-800)' }}>
                    <span style={{ ...labelStyle, color: 'var(--bone)' }}>Discount %</span>
                    <span style={bigValueStyle} data-testid="result-discount-pct">
                      {fmtPct(result.discountPct)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div style={statStyle}>
                    <span style={labelStyle}>Original price</span>
                    <span style={valueStyle}>{fmt(parseFloat(original), currency)}</span>
                  </div>
                  <div style={statStyle}>
                    <span style={labelStyle}>
                      {result.kind === 'amount-off' ? 'Effective discount' : 'Discount'}
                    </span>
                    <span style={valueStyle} data-testid="result-effective-pct">
                      {fmtPct(result.effectivePct)}
                    </span>
                  </div>
                  <div style={statStyle}>
                    <span style={labelStyle}>Amount saved</span>
                    <span style={valueStyle} data-testid="result-saved">
                      {fmt(result.saved, currency)}
                    </span>
                  </div>
                  <div style={{ ...statStyle, borderBottom: 'none', background: 'var(--ink-800)' }}>
                    <span style={{ ...labelStyle, color: 'var(--bone)' }}>Final price</span>
                    <span style={bigValueStyle} data-testid="result-final">
                      {fmt(result.finalPrice, currency)}
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Notice kind="info">Enter values on the left to see results.</Notice>
          )}
        </Panel>
      </IO>
    </>
  )
}
