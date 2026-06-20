'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, Select, Toolbar, IO, Panel, Notice, CopyButton } from '@/components/ui/kit'

function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b !== 0) {
    const t = b
    b = a % b
    a = t
  }
  return a
}

function reduce(num: number, den: number): { num: number; den: number } {
  if (den === 0) return { num, den }
  const g = gcd(Math.abs(num), Math.abs(den))
  const sign = den < 0 ? -1 : 1
  return { num: (sign * num) / g, den: (sign * Math.abs(den)) / g }
}

function formatMixed(num: number, den: number): string {
  if (den === 1) return `${num}`
  const whole = Math.trunc(num / den)
  const rem = num - whole * den
  if (whole === 0) return `${num}/${den}`
  if (rem === 0) return `${whole}`
  return `${whole} ${Math.abs(rem)}/${Math.abs(den)}`
}

type Result =
  | { ok: true; num: number; den: number; decimal: number; fraction: string; mixed: string }
  | { ok: false; error: string }

function compute(
  an: number,
  ad: number,
  bn: number,
  bd: number,
  op: string,
): Result {
  if (ad === 0 || bd === 0) {
    return { ok: false, error: 'Denominator cannot be zero.' }
  }
  if (op === '÷' && bn === 0) {
    return { ok: false, error: 'Division by zero: fraction B is 0/n which makes the divisor zero.' }
  }

  let rn: number, rd: number
  switch (op) {
    case '+':
      rn = an * bd + bn * ad
      rd = ad * bd
      break
    case '−':
      rn = an * bd - bn * ad
      rd = ad * bd
      break
    case '×':
      rn = an * bn
      rd = ad * bd
      break
    case '÷':
      rn = an * bd
      rd = ad * bn
      break
    default:
      return { ok: false, error: 'Unknown operation.' }
  }

  const { num, den } = reduce(rn, rd)
  const decimal = num / den
  const fraction = den === 1 ? `${num}` : `${num}/${den}`
  const mixed = formatMixed(num, den)

  return { ok: true, num, den, decimal, fraction, mixed }
}

const OPS = [
  { value: '+', label: '+ add' },
  { value: '−', label: '− subtract' },
  { value: '×', label: '× multiply' },
  { value: '÷', label: '÷ divide' },
]

export default function FractionCalculator() {
  const [an, setAn] = useState('')
  const [ad, setAd] = useState('')
  const [op, setOp] = useState('+')
  const [bn, setBn] = useState('')
  const [bd, setBd] = useState('')

  const result = useMemo((): Result | null => {
    if (!an && !ad && !bn && !bd) return null
    const anInt = parseInt(an, 10)
    const adInt = parseInt(ad, 10)
    const bnInt = parseInt(bn, 10)
    const bdInt = parseInt(bd, 10)
    if (isNaN(anInt) || isNaN(adInt) || isNaN(bnInt) || isNaN(bdInt)) {
      return { ok: false, error: 'All four fields must be integers.' }
    }
    return compute(anInt, adInt, bnInt, bdInt, op)
  }, [an, ad, op, bn, bd])

  const outputText =
    result?.ok
      ? `Fraction: ${result.fraction}\nDecimal: ${result.decimal.toFixed(6).replace(/\.?0+$/, '')}\nMixed number: ${result.mixed}`
      : ''

  return (
    <>
      <Toolbar>
        <Field label="Operation">
          <Select value={op} onChange={setOp} options={OPS} />
        </Field>
      </Toolbar>

      <IO>
        <Panel title="fractions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend
                style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-400)',
                  fontFamily: 'var(--ff-mono)',
                  marginBottom: '0.5rem',
                }}
              >
                Fraction A
              </legend>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Field label="Numerator">
                  <TextInput value={an} onChange={setAn} placeholder="e.g. 1" type="number" />
                </Field>
                <span
                  style={{
                    fontSize: '1.5rem',
                    color: 'var(--ink-400)',
                    alignSelf: 'flex-end',
                    paddingBottom: '0.2rem',
                  }}
                >
                  /
                </span>
                <Field label="Denominator">
                  <TextInput value={ad} onChange={setAd} placeholder="e.g. 2" type="number" />
                </Field>
              </div>
            </fieldset>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--acid)',
                fontFamily: 'var(--ff-mono)',
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              {op}
            </div>

            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend
                style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-400)',
                  fontFamily: 'var(--ff-mono)',
                  marginBottom: '0.5rem',
                }}
              >
                Fraction B
              </legend>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Field label="Numerator">
                  <TextInput value={bn} onChange={setBn} placeholder="e.g. 1" type="number" />
                </Field>
                <span
                  style={{
                    fontSize: '1.5rem',
                    color: 'var(--ink-400)',
                    alignSelf: 'flex-end',
                    paddingBottom: '0.2rem',
                  }}
                >
                  /
                </span>
                <Field label="Denominator">
                  <TextInput value={bd} onChange={setBd} placeholder="e.g. 3" type="number" />
                </Field>
              </div>
            </fieldset>
          </div>
        </Panel>

        <Panel title="result" actions={<CopyButton text={outputText} />}>
          {result === null && (
            <Notice kind="info">Enter fractions above to compute a result.</Notice>
          )}
          {result?.ok === false && <Notice kind="error">{result.error}</Notice>}
          {result?.ok === true && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                fontFamily: 'var(--ff-mono)',
                fontSize: '0.875rem',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-400)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Simplified fraction
                </div>
                <div
                  style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--acid)', lineHeight: 1 }}
                >
                  {result.fraction}
                </div>
              </div>

              {result.den !== 1 && result.mixed !== result.fraction && (
                <div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-400)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Mixed number
                  </div>
                  <div style={{ fontSize: '1.25rem', color: 'var(--bone)' }}>{result.mixed}</div>
                </div>
              )}

              <div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-400)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Decimal
                </div>
                <div style={{ fontSize: '1.25rem', color: 'var(--bone)' }}>
                  ≈ {result.decimal.toFixed(6).replace(/\.?0+$/, '')}
                </div>
              </div>
            </div>
          )}
        </Panel>
      </IO>
    </>
  )
}
