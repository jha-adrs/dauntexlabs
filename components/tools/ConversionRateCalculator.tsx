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

export default function ConversionRateCalculator() {
  const [currency, setCurrency] = useState('USD')
  const [conversions, setConversions] = useState('')
  const [visits, setVisits] = useState('')

  const result = useMemo(() => {
    if (!conversions && !visits) return null
    const c = parseFloat(conversions)
    const v = parseFloat(visits)
    if (isNaN(c) || isNaN(v)) return { error: 'Enter valid numbers for conversions and visits.' }
    if (v <= 0) return { error: 'Visits must be greater than zero.' }
    if (c < 0) return { error: 'Conversions cannot be negative.' }
    if (c > v) return { error: 'Conversions cannot exceed total visits.' }
    const rate = (c / v) * 100
    return { rate }
  }, [conversions, visits])

  const copyText =
    result && !('error' in result) ? `Conversion Rate: ${result.rate.toFixed(2)}%` : ''

  return (
    <>
      <Toolbar>
        <Select value={currency} onChange={setCurrency} options={CURRENCY_OPTIONS} />
      </Toolbar>

      <IO>
        <Panel title="inputs">
          <Field label="Conversions" hint="Number of successful conversions (sales, sign-ups, etc.)">
            <TextInput
              type="number"
              value={conversions}
              onChange={setConversions}
              placeholder="e.g. 25"
            />
          </Field>
          <Field label="Total Visits" hint="Total number of sessions or visitors">
            <TextInput
              type="number"
              value={visits}
              onChange={setVisits}
              placeholder="e.g. 500"
            />
          </Field>
        </Panel>

        <Panel
          title="results"
          actions={copyText ? <CopyButton text={copyText} /> : undefined}
        >
          {!result && (
            <Notice kind="info">Enter conversions and total visits to calculate conversion rate.</Notice>
          )}
          {result && 'error' in result && (
            <Notice kind="error">{result.error}</Notice>
          )}
          {result && !('error' in result) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={CARD_STYLE}>
                <div style={LABEL_STYLE}>Conversion Rate</div>
                <div style={VALUE_STYLE}>{result.rate.toFixed(2)}%</div>
                <div style={SUB_STYLE}>of visitors converted</div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <div style={CARD_STYLE}>
                  <div style={LABEL_STYLE}>Conversions</div>
                  <div style={{ ...VALUE_STYLE, fontSize: '1.25rem' }}>
                    {parseFloat(conversions).toLocaleString()}
                  </div>
                </div>
                <div style={CARD_STYLE}>
                  <div style={LABEL_STYLE}>Total Visits</div>
                  <div style={{ ...VALUE_STYLE, fontSize: '1.25rem' }}>
                    {parseFloat(visits).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Panel>
      </IO>
    </>
  )
}
