'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, Toolbar, IO, Panel, Notice, CopyButton } from '@/components/ui/kit'

type QuadResult =
  | { ok: false; error: string }
  | {
      ok: true
      discriminant: number
      kind: 'two-real' | 'one-real' | 'complex'
      roots: string[]
      vertex: { x: string; y: string }
    }

function fmt(n: number): string {
  // Show up to 6 significant decimals, strip trailing zeros
  const s = parseFloat(n.toPrecision(10)).toString()
  // If it's basically an integer, show it as such
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n))
  return s
}

function solveQuadratic(a: number, b: number, c: number): QuadResult {
  if (a === 0) {
    return { ok: false, error: 'Coefficient a cannot be zero — that is not a quadratic equation.' }
  }

  const D = b * b - 4 * a * c

  // Vertex: x = -b/(2a),  y = c - b²/(4a)
  const vx = -b / (2 * a)
  const vy = c - (b * b) / (4 * a)

  if (D > 0) {
    const sqrtD = Math.sqrt(D)
    const r1 = (-b + sqrtD) / (2 * a)
    const r2 = (-b - sqrtD) / (2 * a)
    return {
      ok: true,
      discriminant: D,
      kind: 'two-real',
      roots: [fmt(r1), fmt(r2)],
      vertex: { x: fmt(vx), y: fmt(vy) },
    }
  }

  if (D === 0) {
    const r = -b / (2 * a)
    return {
      ok: true,
      discriminant: 0,
      kind: 'one-real',
      roots: [fmt(r)],
      vertex: { x: fmt(vx), y: fmt(vy) },
    }
  }

  // Complex roots: -b/(2a) ± sqrt(-D)/(2a) i
  const realPart = -b / (2 * a)
  const imagPart = Math.sqrt(-D) / (2 * a)

  const p = fmt(realPart)
  const q = fmt(Math.abs(imagPart))
  const plus = `${p} + ${q}i`
  const minus = realPart === 0 ? `−${q}i` : `${p} − ${q}i`

  return {
    ok: true,
    discriminant: D,
    kind: 'complex',
    roots: [plus, minus],
    vertex: { x: fmt(vx), y: fmt(vy) },
  }
}

function parseNum(s: string): number | null {
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

export default function QuadraticSolver() {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [c, setC] = useState('')

  const result = useMemo((): QuadResult | null => {
    if (!a && !b && !c) return null
    const an = parseNum(a)
    const bn = parseNum(b)
    const cn = parseNum(c)
    if (an === null || bn === null || cn === null) {
      return { ok: false, error: 'All three coefficients must be valid numbers.' }
    }
    return solveQuadratic(an, bn, cn)
  }, [a, b, c])

  const outputText = useMemo(() => {
    if (!result?.ok) return ''
    const { discriminant, kind, roots, vertex } = result
    const lines = [
      `Equation: (${a})x² + (${b})x + (${c}) = 0`,
      `Discriminant (Δ): ${discriminant}`,
      '',
    ]
    if (kind === 'two-real') {
      lines.push(`Two real roots:`, `  x₁ = ${roots[0]}`, `  x₂ = ${roots[1]}`)
    } else if (kind === 'one-real') {
      lines.push(`One real root (double):`, `  x = ${roots[0]}`)
    } else {
      lines.push(`Two complex roots:`, `  x₁ = ${roots[0]}`, `  x₂ = ${roots[1]}`)
    }
    lines.push('', `Vertex: (${vertex.x}, ${vertex.y})`)
    return lines.join('\n')
  }, [result, a, b, c])

  const kindLabel = result?.ok
    ? result.kind === 'two-real'
      ? 'Two real roots'
      : result.kind === 'one-real'
        ? 'One real root (double)'
        : 'Two complex roots'
    : ''

  const discriminantColor =
    result?.ok
      ? result.discriminant > 0
        ? 'var(--acid)'
        : result.discriminant === 0
          ? '#f0c040'
          : '#f05070'
      : 'var(--bone)'

  return (
    <>
      <Toolbar>
        <div
          style={{
            fontFamily: 'var(--ff-mono)',
            fontSize: '0.85rem',
            color: 'var(--ink-400)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>ax² + bx + c = 0</span>
        </div>
      </Toolbar>

      <IO>
        <Panel title="coefficients">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="a — coefficient of x²">
              <TextInput value={a} onChange={setA} placeholder="e.g. 1" type="number" />
            </Field>
            <Field label="b — coefficient of x">
              <TextInput value={b} onChange={setB} placeholder="e.g. −3" type="number" />
            </Field>
            <Field label="c — constant term">
              <TextInput value={c} onChange={setC} placeholder="e.g. 2" type="number" />
            </Field>
          </div>
        </Panel>

        <Panel title="solution" actions={<CopyButton text={outputText} />}>
          {result === null && (
            <Notice kind="info">Enter coefficients a, b, c to solve ax² + bx + c = 0.</Notice>
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
                  Discriminant (Δ = b²−4ac)
                </div>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: discriminantColor,
                    lineHeight: 1,
                  }}
                >
                  {result.discriminant}
                </div>
                <div
                  style={{ fontSize: '0.75rem', color: 'var(--ink-400)', marginTop: '0.25rem' }}
                >
                  {kindLabel}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-400)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Root{result.roots.length > 1 ? 's' : ''}
                </div>
                {result.roots.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '1.1rem',
                      color: 'var(--bone)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <span style={{ color: 'var(--ink-400)', marginRight: '0.5rem' }}>
                      x{result.roots.length > 1 ? (i === 0 ? '₁' : '₂') : ''} =
                    </span>
                    {r}
                  </div>
                ))}
              </div>

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
                  Vertex
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--bone)' }}>
                  ({result.vertex.x},&nbsp;{result.vertex.y})
                </div>
              </div>
            </div>
          )}
        </Panel>
      </IO>
    </>
  )
}
