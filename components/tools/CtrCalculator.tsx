'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, Select, Segmented, Toolbar, IO, Panel, Notice, CopyButton } from '@/components/ui/kit'

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

export default function CtrCalculator() {
  const [mode, setMode] = useState<'ctr' | 'solve'>('ctr')
  const [currency, setCurrency] = useState('USD')

  // CTR mode
  const [clicks, setClicks] = useState('')
  const [impressions, setImpressions] = useState('')

  // Solve mode (solve for clicks)
  const [targetCtr, setTargetCtr] = useState('')
  const [solveImpressions, setSolveImpressions] = useState('')

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
  void fmt // currency select present for future extension; not used in CTR math

  const ctrResult = useMemo(() => {
    if (!clicks && !impressions) return null
    const c = parseFloat(clicks)
    const i = parseFloat(impressions)
    if (isNaN(c) || isNaN(i)) return { error: 'Enter valid numbers for clicks and impressions.' }
    if (i <= 0) return { error: 'Impressions must be greater than zero.' }
    if (c < 0) return { error: 'Clicks cannot be negative.' }
    if (c > i) return { error: 'Clicks cannot exceed impressions.' }
    const ctr = (c / i) * 100
    return { ctr }
  }, [clicks, impressions])

  const solveResult = useMemo(() => {
    if (!targetCtr && !solveImpressions) return null
    const ctr = parseFloat(targetCtr)
    const imp = parseFloat(solveImpressions)
    if (isNaN(ctr) || isNaN(imp)) return { error: 'Enter valid numbers for target CTR and impressions.' }
    if (imp <= 0) return { error: 'Impressions must be greater than zero.' }
    if (ctr <= 0 || ctr > 100) return { error: 'Target CTR must be between 0 and 100.' }
    const neededClicks = (ctr / 100) * imp
    return { neededClicks }
  }, [targetCtr, solveImpressions])

  const copyText =
    mode === 'ctr' && ctrResult && !('error' in ctrResult)
      ? `CTR: ${ctrResult.ctr.toFixed(2)}%`
      : mode === 'solve' && solveResult && !('error' in solveResult)
        ? `Clicks needed: ${Math.ceil(solveResult.neededClicks)}`
        : ''

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'ctr' | 'solve')}
          options={[
            { value: 'ctr', label: 'Calculate CTR' },
            { value: 'solve', label: 'Solve for Clicks' },
          ]}
        />
        <Select value={currency} onChange={setCurrency} options={CURRENCY_OPTIONS} />
      </Toolbar>

      {mode === 'ctr' && (
        <IO>
          <Panel title="inputs">
            <Field label="Clicks" hint="Number of times the ad was clicked">
              <TextInput
                type="number"
                value={clicks}
                onChange={setClicks}
                placeholder="e.g. 50"
              />
            </Field>
            <Field label="Impressions" hint="Total number of times the ad was shown">
              <TextInput
                type="number"
                value={impressions}
                onChange={setImpressions}
                placeholder="e.g. 1000"
              />
            </Field>
          </Panel>

          <Panel
            title="results"
            actions={copyText ? <CopyButton text={copyText} /> : undefined}
          >
            {!ctrResult && (
              <Notice kind="info">Enter clicks and impressions to calculate CTR.</Notice>
            )}
            {ctrResult && 'error' in ctrResult && (
              <Notice kind="error">{ctrResult.error}</Notice>
            )}
            {ctrResult && !('error' in ctrResult) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={CARD_STYLE}>
                  <div style={LABEL_STYLE}>CTR</div>
                  <div style={VALUE_STYLE}>{ctrResult.ctr.toFixed(2)}%</div>
                  <div style={SUB_STYLE}>click-through rate</div>
                </div>
                <div style={{ ...CARD_STYLE, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'transparent', border: 'none', padding: 0 }}>
                  <div style={CARD_STYLE}>
                    <div style={LABEL_STYLE}>Clicks</div>
                    <div style={{ ...VALUE_STYLE, fontSize: '1.25rem' }}>{parseFloat(clicks).toLocaleString()}</div>
                  </div>
                  <div style={CARD_STYLE}>
                    <div style={LABEL_STYLE}>Impressions</div>
                    <div style={{ ...VALUE_STYLE, fontSize: '1.25rem' }}>{parseFloat(impressions).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </IO>
      )}

      {mode === 'solve' && (
        <IO>
          <Panel title="inputs">
            <Field label="Target CTR (%)" hint="Desired click-through rate percentage">
              <TextInput
                type="number"
                value={targetCtr}
                onChange={setTargetCtr}
                placeholder="e.g. 5"
              />
            </Field>
            <Field label="Impressions" hint="Expected number of ad impressions">
              <TextInput
                type="number"
                value={solveImpressions}
                onChange={setSolveImpressions}
                placeholder="e.g. 10000"
              />
            </Field>
          </Panel>

          <Panel
            title="results"
            actions={copyText ? <CopyButton text={copyText} /> : undefined}
          >
            {!solveResult && (
              <Notice kind="info">Enter target CTR and impressions to calculate required clicks.</Notice>
            )}
            {solveResult && 'error' in solveResult && (
              <Notice kind="error">{solveResult.error}</Notice>
            )}
            {solveResult && !('error' in solveResult) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={CARD_STYLE}>
                  <div style={LABEL_STYLE}>Clicks Needed</div>
                  <div style={VALUE_STYLE}>{Math.ceil(solveResult.neededClicks).toLocaleString()}</div>
                  <div style={SUB_STYLE}>to achieve {parseFloat(targetCtr).toFixed(2)}% CTR</div>
                </div>
              </div>
            )}
          </Panel>
        </IO>
      )}
    </>
  )
}
