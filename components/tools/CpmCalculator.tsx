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

export default function CpmCalculator() {
  const [currency, setCurrency] = useState('USD')
  const [spend, setSpend] = useState('')
  const [impressions, setImpressions] = useState('')
  const [clicks, setClicks] = useState('')
  const [conversions, setConversions] = useState('')

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  const result = useMemo(() => {
    const s = parseFloat(spend)
    const imp = parseFloat(impressions)
    const clk = parseFloat(clicks)
    const conv = parseFloat(conversions)

    if (!spend) return null
    if (isNaN(s) || s <= 0) return { error: 'Ad spend must be a positive number.' }

    const out: {
      cpm?: number
      cpc?: number
      cpa?: number
      error?: string
    } = {}

    // CPM: needs impressions
    if (impressions) {
      if (isNaN(imp) || imp <= 0) {
        out.error = 'Impressions must be a positive number.'
        return out
      }
      out.cpm = (s / imp) * 1000
    }

    // CPC: needs clicks
    if (clicks) {
      if (isNaN(clk) || clk <= 0) {
        out.error = 'Clicks must be a positive number.'
        return out
      }
      out.cpc = s / clk
    }

    // CPA: needs conversions
    if (conversions) {
      if (isNaN(conv) || conv <= 0) {
        out.error = 'Conversions must be a positive number.'
        return out
      }
      out.cpa = s / conv
    }

    if (out.cpm === undefined && out.cpc === undefined && out.cpa === undefined) {
      return { error: 'Enter at least one of: impressions, clicks, or conversions.' }
    }

    return out
  }, [spend, impressions, clicks, conversions])

  const copyParts: string[] = []
  if (result && !('error' in result)) {
    if (result.cpm !== undefined) copyParts.push(`CPM: ${fmt(result.cpm)}`)
    if (result.cpc !== undefined) copyParts.push(`CPC: ${fmt(result.cpc)}`)
    if (result.cpa !== undefined) copyParts.push(`CPA: ${fmt(result.cpa)}`)
  }
  const copyText = copyParts.join(' | ')

  return (
    <>
      <Toolbar>
        <Select value={currency} onChange={setCurrency} options={CURRENCY_OPTIONS} />
      </Toolbar>

      <IO>
        <Panel title="inputs">
          <Field label="Ad Spend" hint="Total amount spent on the campaign">
            <TextInput
              type="number"
              value={spend}
              onChange={setSpend}
              placeholder="e.g. 200"
            />
          </Field>
          <Field label="Impressions" hint="Total ad impressions — used for CPM">
            <TextInput
              type="number"
              value={impressions}
              onChange={setImpressions}
              placeholder="e.g. 50000"
            />
          </Field>
          <Field label="Clicks" hint="Total clicks — used for CPC">
            <TextInput
              type="number"
              value={clicks}
              onChange={setClicks}
              placeholder="e.g. 100"
            />
          </Field>
          <Field label="Conversions" hint="Total conversions — used for CPA">
            <TextInput
              type="number"
              value={conversions}
              onChange={setConversions}
              placeholder="e.g. 20"
            />
          </Field>
        </Panel>

        <Panel
          title="results"
          actions={copyText ? <CopyButton text={copyText} /> : undefined}
        >
          {!result && (
            <Notice kind="info">
              Enter ad spend plus at least one of impressions, clicks, or conversions.
            </Notice>
          )}
          {result && 'error' in result && result.error && (
            <Notice kind="error">{result.error}</Notice>
          )}
          {result && !('error' in result) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {result.cpm !== undefined && (
                <div style={CARD_STYLE}>
                  <div style={LABEL_STYLE}>CPM</div>
                  <div style={VALUE_STYLE}>{fmt(result.cpm)}</div>
                  <div style={SUB_STYLE}>cost per 1,000 impressions</div>
                </div>
              )}
              {result.cpc !== undefined && (
                <div style={CARD_STYLE}>
                  <div style={LABEL_STYLE}>CPC</div>
                  <div style={VALUE_STYLE}>{fmt(result.cpc)}</div>
                  <div style={SUB_STYLE}>cost per click</div>
                </div>
              )}
              {result.cpa !== undefined && (
                <div style={CARD_STYLE}>
                  <div style={LABEL_STYLE}>CPA</div>
                  <div style={VALUE_STYLE}>{fmt(result.cpa)}</div>
                  <div style={SUB_STYLE}>cost per acquisition / conversion</div>
                </div>
              )}
            </div>
          )}
        </Panel>
      </IO>
    </>
  )
}
