'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, Select, Segmented, Toolbar, IO, Panel, Notice, CopyButton } from '@/components/ui/kit'
import {
  conversionRate,
  visitsNeeded,
  conversionsNeeded,
  revenue,
  formatMoney,
  type Currency,
  type Result,
} from '@/lib/conversion-rate'

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'INR', label: 'INR (₹)' },
]

const MODE_OPTIONS = [
  { value: 'rate', label: 'Conversion rate' },
  { value: 'visits', label: 'Visits needed' },
  { value: 'conversions', label: 'Conversions needed' },
]

type Mode = 'rate' | 'visits' | 'conversions'

const CARD_STYLE: React.CSSProperties = {
  padding: '1rem',
  background: 'var(--surface-soft)',
  border: '1px solid var(--line)',
  borderRadius: '8px',
}

const LABEL_STYLE: React.CSSProperties = {
  color: 'var(--mute)',
  fontSize: '0.8rem',
  marginBottom: '0.25rem',
}

const VALUE_STYLE: React.CSSProperties = {
  color: 'var(--accent)',
  fontSize: '1.75rem',
  fontFamily: 'var(--font-mono)',
  fontWeight: 700,
}

const SUB_STYLE: React.CSSProperties = {
  color: 'var(--mute)',
  fontSize: '0.8rem',
  marginTop: '0.25rem',
}

function Card({ label, value, sub, small }: { label: string; value: string; sub?: string; small?: boolean }) {
  return (
    <div style={CARD_STYLE}>
      <div style={LABEL_STYLE}>{label}</div>
      <div style={small ? { ...VALUE_STYLE, fontSize: '1.25rem' } : VALUE_STYLE}>{value}</div>
      {sub && <div style={SUB_STYLE}>{sub}</div>}
    </div>
  )
}

export default function ConversionRateCalculator() {
  const [mode, setMode] = useState<Mode>('rate')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [conversions, setConversions] = useState('')
  const [visits, setVisits] = useState('')
  const [aov, setAov] = useState('')
  const [target, setTarget] = useState('')
  const [solverVisits, setSolverVisits] = useState('')
  const [solverRate, setSolverRate] = useState('')

  const rateResult = useMemo<Result<number> | null>(() => {
    if (!conversions || !visits) return null
    return conversionRate(parseFloat(conversions), parseFloat(visits))
  }, [conversions, visits])

  const money = useMemo(() => {
    const a = parseFloat(aov)
    if (!rateResult?.ok || !(a > 0)) return null
    return revenue(parseFloat(conversions), parseFloat(visits), a)
  }, [rateResult, aov, conversions, visits])

  const solverResult = useMemo<Result<number> | null>(() => {
    const amount = mode === 'visits' ? target : solverVisits
    // Wait until both of this mode's fields are typed (the rate field is shared between the two solvers).
    if (mode === 'rate' || !amount || !solverRate) return null
    const a = parseFloat(amount)
    const r = parseFloat(solverRate)
    return mode === 'visits' ? visitsNeeded(a, r) : conversionsNeeded(a, r)
  }, [mode, target, solverVisits, solverRate])

  let copyText = ''
  if (mode === 'rate' && rateResult?.ok) {
    copyText = `Conversion Rate: ${rateResult.value.toFixed(2)}%`
    if (money)
      copyText += `\nRevenue: ${formatMoney(money.revenue, currency)}\nRevenue per visitor: ${formatMoney(money.perVisitor, currency)}`
  } else if (mode !== 'rate' && solverResult?.ok) {
    copyText = `${solverResult.value.toLocaleString('en-US')} ${mode === 'visits' ? 'visits needed' : 'conversions needed'}`
  }

  const rateLabel = 'Conversion rate (%)'

  return (
    <>
      <Toolbar>
        <Segmented value={mode} onChange={(v) => setMode(v as Mode)} options={MODE_OPTIONS} />
      </Toolbar>

      <IO>
        <Panel title="inputs">
          {mode === 'rate' && (
            <>
              <Field label="Conversions" hint="Number of successful conversions (sales, sign-ups, etc.)">
                <TextInput type="number" value={conversions} onChange={setConversions} placeholder="e.g. 25" />
              </Field>
              <Field label="Total Visits" hint="Total number of sessions or visitors">
                <TextInput type="number" value={visits} onChange={setVisits} placeholder="e.g. 500" />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                <Field label="Average order value (optional)" hint="Adds revenue and revenue per visitor">
                  <TextInput type="number" value={aov} onChange={setAov} placeholder="e.g. 40" />
                </Field>
                <Field label="Currency">
                  <Select value={currency} onChange={(v) => setCurrency(v as Currency)} options={CURRENCY_OPTIONS} />
                </Field>
              </div>
            </>
          )}
          {mode === 'visits' && (
            <>
              <Field label="Target conversions" hint="How many conversions you want">
                <TextInput type="number" value={target} onChange={setTarget} placeholder="e.g. 50" />
              </Field>
              <Field label={rateLabel} hint="Your expected or historical conversion rate">
                <TextInput type="number" value={solverRate} onChange={setSolverRate} placeholder="e.g. 2.5" />
              </Field>
            </>
          )}
          {mode === 'conversions' && (
            <>
              <Field label="Visits" hint="Visits or sessions you expect">
                <TextInput type="number" value={solverVisits} onChange={setSolverVisits} placeholder="e.g. 2000" />
              </Field>
              <Field label={rateLabel} hint="Your expected or historical conversion rate">
                <TextInput type="number" value={solverRate} onChange={setSolverRate} placeholder="e.g. 2.5" />
              </Field>
            </>
          )}
        </Panel>

        <Panel title="results" actions={copyText ? <CopyButton text={copyText} /> : undefined}>
          {mode === 'rate' && (
            <>
              {!rateResult && (
                <Notice kind="info">Enter conversions and total visits to calculate conversion rate.</Notice>
              )}
              {rateResult && !rateResult.ok && <Notice kind="error">{rateResult.error}</Notice>}
              {rateResult?.ok && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Card label="Conversion rate" value={`${rateResult.value.toFixed(2)}%`} sub="of visitors converted" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Card label="Conversions" value={parseFloat(conversions).toLocaleString()} small />
                    <Card label="Total visits" value={parseFloat(visits).toLocaleString()} small />
                  </div>
                  {money && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Card label="Revenue" value={formatMoney(money.revenue, currency)} small />
                      <Card label="Revenue per visitor" value={formatMoney(money.perVisitor, currency)} small />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {mode !== 'rate' && (
            <>
              {!solverResult && (
                <Notice kind="info">
                  {mode === 'visits'
                    ? 'Enter target conversions and a conversion rate to see the visits you need.'
                    : 'Enter visits and a conversion rate to see how many conversions that rate gives, rounded up.'}
                </Notice>
              )}
              {solverResult && !solverResult.ok && <Notice kind="error">{solverResult.error}</Notice>}
              {solverResult?.ok && (
                <Card
                  label={mode === 'visits' ? 'Visits' : 'Conversions'}
                  value={solverResult.value.toLocaleString('en-US')}
                  sub={mode === 'visits' ? 'visits needed' : 'conversions needed'}
                />
              )}
            </>
          )}
        </Panel>
      </IO>
    </>
  )
}
