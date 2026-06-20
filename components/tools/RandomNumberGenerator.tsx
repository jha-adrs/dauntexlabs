'use client'

import { useState } from 'react'
import { TextInput, Toggle, Button, CopyButton, Field, Panel, IO, Notice, Toolbar, Segmented } from '@/components/ui/kit'

/**
 * Generate an unbiased random integer in [min, max] using rejection sampling
 * on crypto.getRandomValues. Avoids modulo bias.
 */
function randomIntInRange(min: number, max: number): number {
  const range = max - min + 1
  // Find the smallest power-of-2 ceiling for rejection sampling
  const buckets = Math.pow(2, Math.ceil(Math.log2(range)))
  const limit = buckets - (buckets % range)

  const buf = new Uint32Array(1)
  let val: number
  do {
    crypto.getRandomValues(buf)
    val = buf[0] % buckets
  } while (val >= limit)

  return min + (val % range)
}

/**
 * Generate `count` random integers in [min, max].
 * If `unique` is true, values are guaranteed to be distinct.
 * Throws if unique and range is too small.
 */
function generateNumbers(min: number, max: number, count: number, unique: boolean): number[] {
  const rangeSize = max - min + 1
  if (unique && count > rangeSize) {
    throw new RangeError(
      `Cannot generate ${count} unique values from a range of ${rangeSize} (${min}–${max}).`,
    )
  }

  if (unique) {
    // Fisher-Yates partial shuffle over the range
    // For large ranges, use a Set-based approach to avoid allocating a huge array
    if (rangeSize <= 10_000) {
      const pool = Array.from({ length: rangeSize }, (_, i) => min + i)
      for (let i = pool.length - 1; i > pool.length - 1 - count; i--) {
        const buf = new Uint32Array(1)
        crypto.getRandomValues(buf)
        const j = buf[0] % (i + 1)
        ;[pool[i], pool[j]] = [pool[j], pool[i]]
      }
      return pool.slice(pool.length - count)
    } else {
      // Set-based sampling for large ranges
      const seen = new Set<number>()
      const result: number[] = []
      while (result.length < count) {
        const v = randomIntInRange(min, max)
        if (!seen.has(v)) {
          seen.add(v)
          result.push(v)
        }
      }
      return result
    }
  }

  // Non-unique: just generate count values
  return Array.from({ length: count }, () => randomIntInRange(min, max))
}

export default function RandomNumberGenerator() {
  const [minStr, setMinStr] = useState('1')
  const [maxStr, setMaxStr] = useState('100')
  const [countStr, setCountStr] = useState('1')
  const [unique, setUnique] = useState(false)
  const [separator, setSeparator] = useState('comma')

  const [results, setResults] = useState<number[]>([])
  const [error, setError] = useState('')

  function handleGenerate() {
    setError('')
    setResults([])

    const min = parseInt(minStr, 10)
    const max = parseInt(maxStr, 10)
    const count = parseInt(countStr, 10)

    if (isNaN(min) || isNaN(max)) {
      setError('Min and Max must be valid integers.')
      return
    }
    if (min > max) {
      setError('Min must be less than or equal to Max.')
      return
    }
    if (isNaN(count) || count < 1) {
      setError('Count must be at least 1.')
      return
    }
    if (count > 10_000) {
      setError('Count must be 10,000 or fewer.')
      return
    }

    try {
      const nums = generateNumbers(min, max, count, unique)
      setResults(nums)
    } catch (e) {
      if (e instanceof RangeError) {
        setError(e.message)
      } else {
        setError('An unexpected error occurred.')
      }
    }
  }

  const resultText =
    results.length > 0
      ? separator === 'comma'
        ? results.join(', ')
        : results.join('\n')
      : ''

  return (
    <>
      <Toolbar>
        <Field label="Min">
          <TextInput type="number" value={minStr} onChange={setMinStr} placeholder="1" />
        </Field>
        <Field label="Max">
          <TextInput type="number" value={maxStr} onChange={setMaxStr} placeholder="100" />
        </Field>
        <Field label="Count">
          <TextInput type="number" value={countStr} onChange={setCountStr} placeholder="1" />
        </Field>
        <Toggle checked={unique} onChange={setUnique} label="Unique values" />
      </Toolbar>

      <Toolbar>
        <Segmented
          value={separator}
          onChange={setSeparator}
          options={[
            { value: 'comma', label: 'Comma-separated' },
            { value: 'newline', label: 'One per line' },
          ]}
        />
        <Button variant="primary" onClick={handleGenerate}>
          Generate
        </Button>
      </Toolbar>

      {error && <Notice kind="error">{error}</Notice>}

      <IO>
        <Panel
          title="results"
          actions={results.length > 0 ? <CopyButton text={resultText} /> : undefined}
        >
          {results.length === 0 && !error ? (
            <Notice kind="info">Configure the options and click Generate.</Notice>
          ) : results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {results.length === 1 ? (
                <div
                  style={{
                    fontFamily: 'var(--ff-display)',
                    fontSize: '3rem',
                    color: 'var(--acid)',
                    textAlign: 'center',
                    padding: '1.5rem',
                    background: 'var(--ink-800)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                  }}
                >
                  {results[0]}
                </div>
              ) : (
                <div
                  style={{
                    fontFamily: 'var(--ff-mono)',
                    fontSize: '0.9rem',
                    color: 'var(--bone)',
                    padding: '1rem',
                    background: 'var(--ink-800)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.7,
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }}
                >
                  {resultText}
                </div>
              )}
              <div
                style={{
                  fontFamily: 'var(--ff-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {results.length} number{results.length !== 1 ? 's' : ''} &middot; range {minStr}–{maxStr}
                {unique ? ' · unique' : ''}
              </div>
            </div>
          ) : null}
        </Panel>
      </IO>
    </>
  )
}
