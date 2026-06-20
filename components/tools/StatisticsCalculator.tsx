'use client'

import { useMemo, useState } from 'react'
import { Field, TextArea, Notice } from '@/components/ui/kit'

/** Parse a free-form string into the numeric tokens it contains. */
function parseNumbers(raw: string): number[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t !== '')
    .map((t) => Number(t))
    .filter((n) => Number.isFinite(n))
}

/** Linear-interpolation quantile (same method many calculators use, R type 7). */
function quantile(sorted: number[], q: number): number {
  const n = sorted.length
  if (n === 0) return NaN
  if (n === 1) return sorted[0]
  const pos = (n - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (base + 1 < n) return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  return sorted[base]
}

function computeModes(nums: number[]): number[] {
  const counts = new Map<number, number>()
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1)
  let max = 0
  for (const c of counts.values()) if (c > max) max = c
  if (max <= 1) return [] // no value repeats → no mode
  const modes: number[] = []
  for (const [val, c] of counts) if (c === max) modes.push(val)
  return modes.sort((a, b) => a - b)
}

export default function StatisticsCalculator() {
  const [input, setInput] = useState('')

  const result = useMemo(() => {
    const nums = parseNumbers(input)
    if (nums.length === 0) return null

    const sorted = [...nums].sort((a, b) => a - b)
    const count = nums.length
    const sum = nums.reduce((a, b) => a + b, 0)
    const mean = sum / count
    const min = sorted[0]
    const max = sorted[count - 1]
    const range = max - min

    const median = quantile(sorted, 0.5)
    const q1 = quantile(sorted, 0.25)
    const q3 = quantile(sorted, 0.75)
    const iqr = q3 - q1

    const sqDiff = nums.reduce((a, b) => a + (b - mean) ** 2, 0)
    const popVar = sqDiff / count
    const popStd = Math.sqrt(popVar)
    const sampVar = count > 1 ? sqDiff / (count - 1) : NaN
    const sampStd = count > 1 ? Math.sqrt(sampVar) : NaN

    const modes = computeModes(nums)

    return {
      count,
      sum,
      mean,
      median,
      modes,
      min,
      max,
      range,
      popVar,
      popStd,
      sampVar,
      sampStd,
      q1,
      q3,
      iqr,
    }
  }, [input])

  /** Round for display: trim trailing zeros, cap at 6 dp. */
  function fmt(n: number): string {
    if (!Number.isFinite(n)) return '—'
    return Number(n.toFixed(6)).toString()
  }

  return (
    <>
      <Field
        label="data set"
        hint="Numbers separated by commas, spaces, or new lines. Non-numeric tokens are ignored."
      >
        <TextArea
          value={input}
          onChange={setInput}
          placeholder="e.g. 2, 4, 4, 4, 5, 5, 7, 9"
          rows={6}
        />
      </Field>

      {input.trim() !== '' && result === null && (
        <div style={{ marginTop: '1rem' }}>
          <Notice kind="error">No numbers found. Enter some numeric values.</Notice>
        </div>
      )}

      {result === null && input.trim() === '' && (
        <div style={{ marginTop: '1rem' }}>
          <Notice kind="info">Enter a set of numbers to see the statistics.</Notice>
        </div>
      )}

      {result && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))',
            gap: '0.75rem',
            marginTop: '1.25rem',
          }}
        >
          <Stat label="Count" value={fmt(result.count)} />
          <Stat label="Sum" value={fmt(result.sum)} />
          <Stat label="Mean" value={fmt(result.mean)} accent />
          <Stat label="Median" value={fmt(result.median)} accent />
          <Stat
            label={result.modes.length === 1 ? 'Mode' : 'Mode(s)'}
            value={result.modes.length === 0 ? 'none' : result.modes.map(fmt).join(', ')}
          />
          <Stat label="Min" value={fmt(result.min)} />
          <Stat label="Max" value={fmt(result.max)} />
          <Stat label="Range" value={fmt(result.range)} />
          <Stat label="Population variance" value={fmt(result.popVar)} />
          <Stat label="Population std dev" value={fmt(result.popStd)} />
          <Stat label="Sample variance" value={fmt(result.sampVar)} />
          <Stat label="Sample std dev" value={fmt(result.sampStd)} />
          <Stat label="Q1 (25th pct)" value={fmt(result.q1)} />
          <Stat label="Q3 (75th pct)" value={fmt(result.q3)} />
          <Stat label="IQR" value={fmt(result.iqr)} />
        </div>
      )}
    </>
  )
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      style={{
        border: '1px solid var(--line)',
        background: 'var(--ink-850)',
        borderRadius: 8,
        padding: '0.8rem 0.9rem',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'var(--mute)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.25rem',
          marginTop: '0.3rem',
          color: accent ? 'var(--acid)' : 'var(--bone)',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </div>
    </div>
  )
}
