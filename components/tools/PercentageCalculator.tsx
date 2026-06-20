'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, Segmented, Toolbar, Panel, Notice, CopyButton } from '@/components/ui/kit'

type Mode = 'pct-of' | 'is-what-pct' | 'pct-change' | 'inc-dec'

const MODES: { value: Mode; label: string }[] = [
  { value: 'pct-of', label: 'X% of Y' },
  { value: 'is-what-pct', label: 'X is what % of Y' },
  { value: 'pct-change', label: '% change A→B' },
  { value: 'inc-dec', label: 'Inc / Dec Y by X%' },
]

function fmtNum(n: number) {
  // Round to at most 6 significant digits, strip trailing zeros
  const rounded = parseFloat(n.toPrecision(10))
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  }).format(rounded)
}

function getLabels(mode: Mode): [string, string] {
  switch (mode) {
    case 'pct-of':
      return ['Percentage (X)', 'Value (Y)']
    case 'is-what-pct':
      return ['Part (X)', 'Whole (Y)']
    case 'pct-change':
      return ['From (A)', 'To (B)']
    case 'inc-dec':
      return ['Value (Y)', 'Percentage (X)']
  }
}

function getPlaceholders(mode: Mode): [string, string] {
  switch (mode) {
    case 'pct-of':
      return ['e.g. 25', 'e.g. 200']
    case 'is-what-pct':
      return ['e.g. 50', 'e.g. 200']
    case 'pct-change':
      return ['e.g. 100', 'e.g. 150']
    case 'inc-dec':
      return ['e.g. 200', 'e.g. 10']
  }
}

function compute(
  mode: Mode,
  a: number,
  b: number,
): { result: number; label: string } | { error: string } {
  switch (mode) {
    case 'pct-of': {
      // a% of b
      return { result: (a / 100) * b, label: `${fmtNum(a)}% of ${fmtNum(b)}` }
    }
    case 'is-what-pct': {
      if (b === 0) return { error: 'Whole (Y) cannot be zero.' }
      return { result: (a / b) * 100, label: `${fmtNum(a)} is what % of ${fmtNum(b)}` }
    }
    case 'pct-change': {
      if (a === 0) return { error: 'From value (A) cannot be zero.' }
      return { result: ((b - a) / Math.abs(a)) * 100, label: `Change from ${fmtNum(a)} to ${fmtNum(b)}` }
    }
    case 'inc-dec': {
      // increase/decrease Y (first input) by X% (second input)
      return { result: a * (1 + b / 100), label: `${fmtNum(a)} adjusted by ${fmtNum(b)}%` }
    }
  }
}

function formatResult(mode: Mode, result: number): string {
  if (mode === 'pct-of' || mode === 'inc-dec') {
    return fmtNum(result)
  }
  if (mode === 'is-what-pct' || mode === 'pct-change') {
    const sign = result > 0 ? '+' : ''
    return `${sign}${fmtNum(result)}%`
  }
  return fmtNum(result)
}

export default function PercentageCalculator() {
  const [mode, setMode] = useState<Mode>('pct-of')
  const [valA, setValA] = useState('25')
  const [valB, setValB] = useState('200')

  // Reset inputs when mode changes
  function handleModeChange(m: string) {
    setMode(m as Mode)
    setValA('')
    setValB('')
  }

  const computed = useMemo(() => {
    if (!valA || !valB) return null

    const a = parseFloat(valA)
    const b = parseFloat(valB)

    if (isNaN(a)) return { error: 'First value must be a valid number.' }
    if (isNaN(b)) return { error: 'Second value must be a valid number.' }

    return compute(mode, a, b)
  }, [mode, valA, valB])

  const [labelA, labelB] = getLabels(mode)
  const [phA, phB] = getPlaceholders(mode)

  const resultStr =
    computed && !('error' in computed)
      ? formatResult(mode, computed.result)
      : ''

  const copyText =
    computed && !('error' in computed)
      ? `${computed.label} = ${resultStr}`
      : ''

  return (
    <>
      <Toolbar>
        <Segmented value={mode} onChange={handleModeChange} options={MODES} />
      </Toolbar>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}
      >
        <Field label={labelA}>
          <TextInput type="number" value={valA} onChange={setValA} placeholder={phA} />
        </Field>
        <Field label={labelB}>
          <TextInput type="number" value={valB} onChange={setValB} placeholder={phB} />
        </Field>
      </div>

      {computed && 'error' in computed && (
        <Notice kind="error">{computed.error}</Notice>
      )}

      {computed && !('error' in computed) && (
        <Panel title="result" actions={<CopyButton text={copyText} />}>
          <div
            style={{
              padding: '1.25rem 1rem',
              background: 'var(--ink-850)',
              border: '1px solid var(--line)',
              borderRadius: '4px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--mute)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.5rem',
              }}
            >
              {computed.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2rem',
                color: 'var(--acid)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
              aria-label="result"
            >
              {resultStr}
            </div>
          </div>
        </Panel>
      )}
    </>
  )
}
