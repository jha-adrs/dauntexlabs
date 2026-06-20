'use client'

import { useMemo, useState } from 'react'
import {
  Toolbar,
  IO,
  Panel,
  TextInput,
  Toggle,
  CopyButton,
  Notice,
} from '@/components/ui/kit'

const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
]

const TENS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
]

const SCALES = [
  '', 'thousand', 'million', 'billion', 'trillion', 'quadrillion',
]

function threeDigits(n: number): string {
  if (n === 0) return ''
  const h = Math.floor(n / 100)
  const remainder = n % 100
  const t = Math.floor(remainder / 10)
  const o = remainder % 10
  const parts: string[] = []
  if (h > 0) parts.push(ONES[h] + ' hundred')
  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES[remainder])
    } else {
      parts.push(t > 0 ? TENS[t] + (o > 0 ? '-' + ONES[o] : '') : ONES[o])
    }
  }
  return parts.join(' ')
}

function numberToWords(n: bigint): string {
  if (n === 0n) return 'zero'
  let negative = false
  if (n < 0n) {
    negative = true
    n = -n
  }

  const groups: number[] = []
  const divisor = 1000n
  let remaining = n
  while (remaining > 0n) {
    groups.push(Number(remaining % divisor))
    remaining = remaining / divisor
  }

  if (groups.length > SCALES.length) {
    throw new Error('Number is too large (max ~999 quadrillion)')
  }

  const parts: string[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i]
    if (g === 0) continue
    const words = threeDigits(g)
    parts.push(SCALES[i] ? words + ' ' + SCALES[i] : words)
  }

  const result = parts.join(' ')
  return negative ? 'negative ' + result : result
}

export default function NumberToWords() {
  const [input, setInput] = useState('')
  const [capitalize, setCapitalize] = useState(false)

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    const trimmed = input.trim()
    // Allow leading minus, then only digits
    if (!/^-?\d+$/.test(trimmed)) {
      return { output: '', error: 'Enter a valid integer (digits only, optional leading minus)' }
    }
    try {
      let words = numberToWords(BigInt(trimmed))
      if (capitalize && words.length > 0) {
        words = words.charAt(0).toUpperCase() + words.slice(1)
      }
      return { output: words, error: '' }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input, capitalize])

  return (
    <>
      <Toolbar>
        <Toggle checked={capitalize} onChange={setCapitalize} label="Capitalize first letter" />
      </Toolbar>

      <IO>
        <Panel title="number">
          <TextInput
            value={input}
            onChange={setInput}
            placeholder="Enter an integer… e.g. 1234 or -99"
          />
        </Panel>
        <Panel title="words" actions={<CopyButton text={output} />}>
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : output ? (
            <div
              style={{
                fontFamily: 'var(--ff-mono)',
                fontSize: '1rem',
                color: 'var(--bone)',
                lineHeight: 1.6,
                padding: '0.75rem 0',
                wordBreak: 'break-word',
              }}
            >
              {output}
            </div>
          ) : (
            <div style={{ color: 'var(--ink-500)', fontFamily: 'var(--ff-mono)' }}>
              Result…
            </div>
          )}
        </Panel>
      </IO>
    </>
  )
}
