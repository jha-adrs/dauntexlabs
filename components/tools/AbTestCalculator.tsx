'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, Notice, IO, Panel } from '@/components/ui/kit'

/**
 * Abramowitz & Stegun 7.1.26 approximation of the error function (erf),
 * accurate to ~1.5e-7. Used to build a standard-normal CDF without any
 * dependency, so the two-proportion z-test runs fully client-side.
 */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * ax)
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-ax * ax)
  return sign * y
}

/** Standard-normal cumulative distribution function. */
function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2))
}

function parseNum(v: string): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

function fmtPct(x: number): string {
  return `${(x * 100).toFixed(2)}%`
}

export default function AbTestCalculator() {
  const [aVisitors, setAVisitors] = useState('1000')
  const [aConversions, setAConversions] = useState('100')
  const [bVisitors, setBVisitors] = useState('1000')
  const [bConversions, setBConversions] = useState('150')

  const result = useMemo(() => {
    const nA = parseNum(aVisitors)
    const cA = parseNum(aConversions)
    const nB = parseNum(bVisitors)
    const cB = parseNum(bConversions)

    if ([nA, cA, nB, cB].some((v) => Number.isNaN(v))) {
      return { error: 'Enter numeric values for every field.' }
    }
    if ([nA, cA, nB, cB].some((v) => v < 0)) {
      return { error: 'Values cannot be negative.' }
    }
    if (nA <= 0 || nB <= 0) {
      return { error: 'Each variant needs at least one visitor.' }
    }
    if (cA > nA || cB > nB) {
      return { error: 'Conversions cannot exceed visitors.' }
    }

    const rateA = cA / nA
    const rateB = cB / nB
    const uplift = rateA === 0 ? NaN : (rateB - rateA) / rateA

    const pooled = (cA + cB) / (nA + nB)
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / nA + 1 / nB))

    let z = NaN
    let pValue = NaN
    if (se > 0) {
      z = (rateB - rateA) / se
      // two-tailed p-value
      pValue = 2 * (1 - normalCdf(Math.abs(z)))
    }

    const sig95 = Number.isFinite(pValue) && pValue < 0.05
    const sig99 = Number.isFinite(pValue) && pValue < 0.01

    return { rateA, rateB, uplift, z, pValue, sig95, sig99, error: '' }
  }, [aVisitors, aConversions, bVisitors, bConversions])

  const statRow = (label: string, value: string) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.5rem 0',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{value}</span>
    </div>
  )

  return (
    <IO>
      <Panel title="inputs">
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--acid)',
              letterSpacing: '0.05em',
            }}
          >
            VARIANT A (control)
          </span>
          <Field label="Visitors">
            <TextInput type="number" value={aVisitors} onChange={setAVisitors} placeholder="1000" />
          </Field>
          <Field label="Conversions">
            <TextInput
              type="number"
              value={aConversions}
              onChange={setAConversions}
              placeholder="100"
            />
          </Field>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--acid)',
              letterSpacing: '0.05em',
              marginTop: '0.5rem',
            }}
          >
            VARIANT B (variation)
          </span>
          <Field label="Visitors">
            <TextInput type="number" value={bVisitors} onChange={setBVisitors} placeholder="1000" />
          </Field>
          <Field label="Conversions">
            <TextInput
              type="number"
              value={bConversions}
              onChange={setBConversions}
              placeholder="150"
            />
          </Field>
        </div>
      </Panel>

      <Panel title="results">
        {result.error ? (
          <Notice kind="error">{result.error}</Notice>
        ) : (
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            {statRow('Conversion rate A', fmtPct(result.rateA!))}
            {statRow('Conversion rate B', fmtPct(result.rateB!))}
            {statRow(
              'Relative uplift',
              Number.isFinite(result.uplift!)
                ? `${result.uplift! >= 0 ? '+' : ''}${(result.uplift! * 100).toFixed(2)}%`
                : 'n/a',
            )}
            {statRow('z-score', Number.isFinite(result.z!) ? result.z!.toFixed(4) : 'n/a')}
            {statRow(
              'p-value (two-tailed)',
              Number.isFinite(result.pValue!) ? result.pValue!.toFixed(5) : 'n/a',
            )}

            <div style={{ marginTop: '0.75rem' }}>
              <Notice kind={result.sig95 ? 'success' : 'info'}>
                {result.sig95
                  ? `Statistically significant at 95% (p < 0.05)${
                      result.sig99 ? ' and 99% (p < 0.01)' : ''
                    }.`
                  : 'Not statistically significant at 95% — the difference may be due to chance.'}
              </Notice>
            </div>
          </div>
        )}
      </Panel>
    </IO>
  )
}
