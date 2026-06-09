'use client'

import { useMemo, useState } from 'react'
import { Select, TextInput, Panel, IO, CopyButton, Notice, Field } from '@/components/ui/kit'

/* ---- helpers ------------------------------------------------------- */

const COMMON_BASES = [
  { base: 2, label: 'Binary', prefix: '0b' },
  { base: 8, label: 'Octal', prefix: '0o' },
  { base: 10, label: 'Decimal', prefix: '' },
  { base: 16, label: 'Hexadecimal', prefix: '0x' },
]

const BASE_OPTIONS = [2, 8, 10, 16].map((b) => ({ value: String(b), label: `Base ${b}` }))

/** Parse a string in the given base to BigInt. Returns null on invalid input. */
function parseBigInt(str: string, base: number): bigint | null {
  const s = str.trim().toLowerCase()
  if (!s) return null
  const bigBase = BigInt(base)
  let result = 0n
  for (const ch of s) {
    const digit = ch >= '0' && ch <= '9'
      ? ch.charCodeAt(0) - 48
      : ch >= 'a' && ch <= 'z'
      ? ch.charCodeAt(0) - 87
      : -1
    if (digit < 0 || digit >= base) return null
    result = result * bigBase + BigInt(digit)
  }
  return result
}

/** Validate all chars in input against the given base. */
function validateInput(input: string, base: number): boolean {
  const s = input.trim().toLowerCase()
  if (!s) return true
  for (const ch of s) {
    const digit = ch >= '0' && ch <= '9'
      ? ch.charCodeAt(0) - 48
      : ch >= 'a' && ch <= 'z'
      ? ch.charCodeAt(0) - 87
      : -1
    if (digit < 0 || digit >= base) return false
  }
  return true
}

function bigIntToBase(n: bigint, base: number): string {
  if (n === 0n) return '0'
  const b = BigInt(base)
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  let result = ''
  let cur = n
  while (cur > 0n) {
    result = chars[Number(cur % b)] + result
    cur = cur / b
  }
  return result
}

/* ---- component ----------------------------------------------------- */

export default function NumberBaseConverter() {
  const [input, setInput] = useState('')
  const [fromBase, setFromBase] = useState('10')
  const [toBase, setToBase] = useState('16')
  // arbitrary from/to base (2-36)
  const [arbFromBase, setArbFromBase] = useState('10')
  const [arbToBase, setArbToBase] = useState('36')
  const [arbInput, setArbInput] = useState('')

  const fromBaseNum = parseInt(fromBase, 10)
  const toBaseNum = parseInt(toBase, 10)

  /* ---- common-base conversion ----------------------------------- */
  const { converted, table, error } = useMemo(() => {
    if (!input.trim()) return { converted: '', table: null, error: '' }
    if (!validateInput(input, fromBaseNum)) {
      return {
        converted: '',
        table: null,
        error: `"${input}" contains digits invalid for base ${fromBaseNum}.`,
      }
    }
    const n = parseBigInt(input, fromBaseNum)
    if (n === null) return { converted: '', table: null, error: 'Invalid number.' }

    const out = bigIntToBase(n, toBaseNum)

    const rows = COMMON_BASES.map(({ base, label, prefix }) => ({
      base,
      label,
      value: prefix + bigIntToBase(n, base),
    }))

    return { converted: out, table: rows, error: '' }
  }, [input, fromBaseNum, toBaseNum])

  /* ---- arbitrary base conversion -------------------------------- */
  const arbFromNum = Math.max(2, Math.min(36, parseInt(arbFromBase, 10) || 10))
  const arbToNum = Math.max(2, Math.min(36, parseInt(arbToBase, 10) || 36))

  const { arbResult, arbError } = useMemo(() => {
    if (!arbInput.trim()) return { arbResult: '', arbError: '' }
    if (!validateInput(arbInput, arbFromNum)) {
      return { arbResult: '', arbError: `Contains digits invalid for base ${arbFromNum}.` }
    }
    const n = parseBigInt(arbInput, arbFromNum)
    if (n === null) return { arbResult: '', arbError: 'Invalid number.' }
    return { arbResult: bigIntToBase(n, arbToNum), arbError: '' }
  }, [arbInput, arbFromNum, arbToNum])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ---- common base converter ---- */}
      <IO>
        <Panel title="input">
          <Field label="From base">
            <Select value={fromBase} onChange={setFromBase} options={BASE_OPTIONS} />
          </Field>
          <Field label="Value" hint={`enter digits valid for base ${fromBaseNum}`}>
            <TextInput value={input} onChange={setInput} />
          </Field>
        </Panel>

        <Panel
          title="output"
          actions={converted ? <CopyButton text={converted} /> : undefined}
        >
          <Field label="To base">
            <Select value={toBase} onChange={setToBase} options={BASE_OPTIONS} />
          </Field>
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.5rem',
                color: 'var(--acid)',
                marginTop: 8,
                wordBreak: 'break-all',
                minHeight: '2rem',
              }}
            >
              {converted || <span style={{ color: 'var(--mute)' }}>—</span>}
            </div>
          )}
        </Panel>
      </IO>

      {/* ---- all-bases table ---- */}
      {table && (
        <Panel title="all common bases">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {table.map(({ base, label, value }) => (
              <div
                key={base}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '7rem 1fr auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 10px',
                  background: 'var(--ink-850)',
                  border: '1px solid var(--line)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--mute)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {label} ({base})
                </span>
                <code
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--bone)',
                    wordBreak: 'break-all',
                    fontSize: '0.9rem',
                  }}
                >
                  {value}
                </code>
                <CopyButton text={value} />
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ---- arbitrary base (2-36) ---- */}
      <Panel title="arbitrary base (2 – 36)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'end' }}>
          <Field label="From base (2–36)">
            <TextInput value={arbFromBase} onChange={setArbFromBase} type="number" />
          </Field>
          <span style={{ color: 'var(--mute)', paddingBottom: 4 }}>→</span>
          <Field label="To base (2–36)">
            <TextInput value={arbToBase} onChange={setArbToBase} type="number" />
          </Field>
        </div>
        <Field label="Value" hint={`digits for base ${arbFromNum}`}>
          <TextInput value={arbInput} onChange={setArbInput} />
        </Field>
        {arbError ? (
          <Notice kind="error">{arbError}</Notice>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 8,
              minHeight: '2rem',
            }}
          >
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.25rem',
                color: 'var(--acid)',
                wordBreak: 'break-all',
                flex: 1,
              }}
            >
              {arbResult || <span style={{ color: 'var(--mute)', fontStyle: 'normal' }}>—</span>}
            </code>
            {arbResult && <CopyButton text={arbResult} />}
          </div>
        )}
      </Panel>
    </div>
  )
}
