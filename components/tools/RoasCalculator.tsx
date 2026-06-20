'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, Select, Toolbar, IO, Panel, Notice, CopyButton } from '@/components/ui/kit'

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'INR', label: 'INR (₹)' },
]

const CARD_STYLE: React.CSSProperties = {
  padding: '1rem',
  background: 'var(--ink-800)',
  border: '1px solid var(--line)',
  borderRadius: '4px',
}

const LABEL_STYLE: React.CSSProperties = {
  color: 'var(--muted)',
  fontSize: '0.75rem',
  fontFamily: 'var(--ff-mono)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.25rem',
}

const VALUE_STYLE: React.CSSProperties = {
  color: 'var(--acid)',
  fontSize: '1.75rem',
  fontFamily: 'var(--ff-mono)',
  fontWeight: 700,
}

const SUB_STYLE: React.CSSProperties = {
  color: 'var(--muted)',
  fontSize: '0.75rem',
  marginTop: '0.25rem',
}

export default function RoasCalculator() {
  const [currency, setCurrency] = useState('USD')
  const [revenue, setRevenue] = useState('')
  const [adSpend, setAdSpend] = useState('')

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  const result = useMemo(() => {
    if (!revenue && !adSpend) return null
    const rev = parseFloat(revenue)
    const spend = parseFloat(adSpend)
    if (isNaN(rev) || isNaN(spend)) return { error: 'Enter valid numbers for revenue and ad spend.' }
    if (spend <= 0) return { error: 'Ad spend must be greater than zero.' }
    if (rev < 0) return { error: 'Revenue cannot be negative.' }
    const roas = rev / spend
    const roasPct = roas * 100
    const netProfit = rev - spend
    return { roas, roasPct, netProfit }
  }, [revenue, adSpend])

  const copyParts: string[] = []
  if (result && !('error' in result)) {
    copyParts.push(`ROAS: ${result.roas.toFixed(2)}x (${result.roasPct.toFixed(2)}%)`)
    copyParts.push(`Net Profit: ${fmt(result.netProfit)}`)
  }
  const copyText = copyParts.join(' | ')

  return (
    <>
      <Toolbar>
        <Select value={currency} onChange={setCurrency} options={CURRENCY_OPTIONS} />
      </Toolbar>

      <IO>
        <Panel title="inputs">
          <Field label="Revenue" hint="Total revenue generated from the ad campaign">
            <TextInput
              type="number"
              value={revenue}
              onChange={setRevenue}
              placeholder="e.g. 5000"
            />
          </Field>
          <Field label="Ad Spend" hint="Total amount spent on the ad campaign">
            <TextInput
              type="number"
              value={adSpend}
              onChange={setAdSpend}
              placeholder="e.g. 1000"
            />
          </Field>
        </Panel>

        <Panel
          title="results"
          actions={copyText ? <CopyButton text={copyText} /> : undefined}
        >
          {!result && (
            <Notice kind="info">Enter revenue and ad spend to calculate ROAS.</Notice>
          )}
          {result && 'error' in result && (
            <Notice kind="error">{result.error}</Notice>
          )}
          {result && !('error' in result) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <div style={CARD_STYLE}>
                  <div style={LABEL_STYLE}>ROAS</div>
                  <div style={VALUE_STYLE}>{result.roas.toFixed(2)}x</div>
                  <div style={SUB_STYLE}>return on ad spend</div>
                </div>
                <div style={CARD_STYLE}>
                  <div style={LABEL_STYLE}>ROAS %</div>
                  <div style={VALUE_STYLE}>{result.roasPct.toFixed(2)}%</div>
                  <div style={SUB_STYLE}>as percentage</div>
                </div>
              </div>
              <div style={CARD_STYLE}>
                <div style={LABEL_STYLE}>Net Profit / Loss</div>
                <div
                  style={{
                    ...VALUE_STYLE,
                    color: result.netProfit >= 0 ? 'var(--acid)' : '#f87171',
                  }}
                >
                  {fmt(result.netProfit)}
                </div>
                <div style={SUB_STYLE}>
                  {result.netProfit >= 0 ? 'revenue minus spend' : 'loss'}
                </div>
              </div>
            </div>
          )}
        </Panel>
      </IO>
    </>
  )
}
