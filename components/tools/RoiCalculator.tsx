'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, Segmented, Toolbar, IO, Panel, Notice } from '@/components/ui/kit'

export default function RoiCalculator() {
  const [mode, setMode] = useState<'roi' | 'cagr'>('roi')

  // ROI inputs
  const [amountInvested, setAmountInvested] = useState('')
  const [finalValue, setFinalValue] = useState('')

  // CAGR inputs
  const [beginValue, setBeginValue] = useState('')
  const [endValue, setEndValue] = useState('')
  const [years, setYears] = useState('')

  const roiResult = useMemo(() => {
    if (!amountInvested && !finalValue) return null

    const invested = parseFloat(amountInvested)
    const final = parseFloat(finalValue)

    if (isNaN(invested) || isNaN(final)) {
      return { error: 'Enter valid numbers for both fields.' }
    }
    if (invested <= 0) {
      return { error: 'Amount invested must be greater than zero.' }
    }

    const netProfit = final - invested
    const roi = (netProfit / invested) * 100

    return { netProfit, roi }
  }, [amountInvested, finalValue])

  const cagrResult = useMemo(() => {
    if (!beginValue && !endValue && !years) return null

    const begin = parseFloat(beginValue)
    const end = parseFloat(endValue)
    const yrs = parseFloat(years)

    if (isNaN(begin) || isNaN(end) || isNaN(yrs)) {
      return { error: 'Enter valid numbers for all three fields.' }
    }
    if (begin <= 0) {
      return { error: 'Beginning value must be greater than zero.' }
    }
    if (end < 0) {
      return { error: 'Ending value cannot be negative.' }
    }
    if (yrs <= 0) {
      return { error: 'Number of years must be greater than zero.' }
    }

    const cagr = (Math.pow(end / begin, 1 / yrs) - 1) * 100

    return { cagr }
  }, [beginValue, endValue, years])

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'roi' | 'cagr')}
          options={[
            { value: 'roi', label: 'ROI' },
            { value: 'cagr', label: 'CAGR' },
          ]}
        />
      </Toolbar>

      {mode === 'roi' && (
        <IO>
          <Panel title="inputs">
            <Field label="Amount Invested" hint="Initial capital invested">
              <TextInput
                type="number"
                value={amountInvested}
                onChange={setAmountInvested}
                placeholder="e.g. 1000"
              />
            </Field>
            <Field label="Final Value" hint="Value at the end of the investment period">
              <TextInput
                type="number"
                value={finalValue}
                onChange={setFinalValue}
                placeholder="e.g. 1500"
              />
            </Field>
          </Panel>

          <Panel title="results">
            {!roiResult && (
              <Notice kind="info">Enter the amount invested and final value to calculate ROI.</Notice>
            )}
            {roiResult && 'error' in roiResult && (
              <Notice kind="error">{roiResult.error}</Notice>
            )}
            {roiResult && !('error' in roiResult) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}>
                  <div style={{
                    padding: '1rem',
                    background: 'var(--ink-800)',
                    border: '1px solid var(--line)',
                    borderRadius: '4px',
                  }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--ff-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                      ROI
                    </div>
                    <div style={{ color: 'var(--acid)', fontSize: '1.75rem', fontFamily: 'var(--ff-mono)', fontWeight: 700 }}>
                      {roiResult.roi.toFixed(2)}%
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>return on investment</div>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: 'var(--ink-800)',
                    border: '1px solid var(--line)',
                    borderRadius: '4px',
                  }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--ff-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                      Net Profit / Loss
                    </div>
                    <div style={{
                      color: roiResult.netProfit >= 0 ? 'var(--acid)' : '#f87171',
                      fontSize: '1.75rem',
                      fontFamily: 'var(--ff-mono)',
                      fontWeight: 700,
                    }}>
                      {fmt(roiResult.netProfit)}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {roiResult.netProfit >= 0 ? 'gain' : 'loss'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </IO>
      )}

      {mode === 'cagr' && (
        <IO>
          <Panel title="inputs">
            <Field label="Beginning Value" hint="Starting value of the investment">
              <TextInput
                type="number"
                value={beginValue}
                onChange={setBeginValue}
                placeholder="e.g. 1000"
              />
            </Field>
            <Field label="Ending Value" hint="Final value of the investment">
              <TextInput
                type="number"
                value={endValue}
                onChange={setEndValue}
                placeholder="e.g. 2000"
              />
            </Field>
            <Field label="Number of Years" hint="Investment period in years">
              <TextInput
                type="number"
                value={years}
                onChange={setYears}
                placeholder="e.g. 3"
              />
            </Field>
          </Panel>

          <Panel title="results">
            {!cagrResult && (
              <Notice kind="info">Enter beginning value, ending value, and number of years to calculate CAGR.</Notice>
            )}
            {cagrResult && 'error' in cagrResult && (
              <Notice kind="error">{cagrResult.error}</Notice>
            )}
            {cagrResult && !('error' in cagrResult) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  padding: '1rem',
                  background: 'var(--ink-800)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                  maxWidth: '240px',
                }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--ff-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    CAGR
                  </div>
                  <div style={{ color: 'var(--acid)', fontSize: '1.75rem', fontFamily: 'var(--ff-mono)', fontWeight: 700 }}>
                    {cagrResult.cagr.toFixed(2)}%
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>compound annual growth rate</div>
                </div>
              </div>
            )}
          </Panel>
        </IO>
      )}
    </>
  )
}
