'use client'

import { useMemo, useState } from 'react'
import {
  Segmented,
  Toolbar,
  IO,
  Panel,
  TextInput,
  CopyButton,
  Notice,
} from '@/components/ui/kit'

const ROMAN_VALUES: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999) {
    throw new Error('Number must be an integer between 1 and 3999')
  }
  let result = ''
  let remaining = n
  for (const [value, numeral] of ROMAN_VALUES) {
    while (remaining >= value) {
      result += numeral
      remaining -= value
    }
  }
  return result
}

// Validates that the Roman numeral follows standard subtractive notation rules
function validateRoman(s: string): boolean {
  // Regex for valid standard Roman numerals 1–3999
  return /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(s.toUpperCase())
}

function fromRoman(s: string): number {
  const upper = s.trim().toUpperCase()
  if (!upper) throw new Error('Enter a Roman numeral')
  if (!validateRoman(upper)) throw new Error(`"${s}" is not a valid standard Roman numeral`)

  const map: Record<string, number> = {
    M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1,
  }
  let total = 0
  for (let i = 0; i < upper.length; i++) {
    const cur = map[upper[i]]
    const next = map[upper[i + 1]] ?? 0
    total += cur < next ? -cur : cur
  }
  return total
}

export default function RomanNumerals() {
  const [mode, setMode] = useState<'to-roman' | 'from-roman'>('to-roman')
  const [input, setInput] = useState('')

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      if (mode === 'to-roman') {
        const n = Number(input.trim())
        if (isNaN(n) || !Number.isFinite(n)) throw new Error('Enter a valid integer')
        return { output: toRoman(n), error: '' }
      } else {
        const n = fromRoman(input)
        return { output: String(n), error: '' }
      }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input, mode])

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'to-roman' | 'from-roman')}
          options={[
            { value: 'to-roman', label: 'Number → Roman' },
            { value: 'from-roman', label: 'Roman → Number' },
          ]}
        />
      </Toolbar>

      <IO>
        <Panel title={mode === 'to-roman' ? 'number' : 'Roman numeral'}>
          <TextInput
            value={input}
            onChange={setInput}
            placeholder={mode === 'to-roman' ? 'Enter a number (1–3999)…' : 'Enter a Roman numeral…'}
          />
        </Panel>
        <Panel
          title={mode === 'to-roman' ? 'Roman numeral' : 'number'}
          actions={<CopyButton text={output} />}
        >
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : output ? (
            <div
              style={{
                fontFamily: 'var(--ff-mono)',
                fontSize: '2rem',
                color: 'var(--acid)',
                padding: '1rem 0',
                letterSpacing: '0.05em',
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
