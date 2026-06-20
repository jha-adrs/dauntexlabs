'use client'

import { useMemo, useState } from 'react'
import { IO, Panel, TextArea, Notice } from '@/components/ui/kit'

type DiffLine = { type: 'add' | 'del' | 'eq'; text: string }

/**
 * Classic Longest-Common-Subsequence line diff.
 * Builds the LCS length table, then backtracks to emit add/del/eq lines in order.
 */
function lineDiff(a: string[], b: string[]): DiffLine[] {
  const n = a.length
  const m = b.length

  // dp[i][j] = LCS length of a[i..] and b[j..]
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: 'eq', text: a[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: a[i] })
      i++
    } else {
      out.push({ type: 'add', text: b[j] })
      j++
    }
  }
  while (i < n) {
    out.push({ type: 'del', text: a[i] })
    i++
  }
  while (j < m) {
    out.push({ type: 'add', text: b[j] })
    j++
  }
  return out
}

const PREFIX: Record<DiffLine['type'], string> = { add: '+', del: '-', eq: ' ' }

function lineStyle(type: DiffLine['type']): React.CSSProperties {
  if (type === 'add') {
    return { color: 'var(--acid)', background: 'rgba(198,242,78,.12)' }
  }
  if (type === 'del') {
    return { color: '#ff6a4d', background: 'rgba(255,106,77,.10)' }
  }
  return { color: 'var(--mute)' }
}

export default function TextDiff() {
  const [original, setOriginal] = useState('')
  const [changed, setChanged] = useState('')

  const { lines, added, removed, hasInput } = useMemo(() => {
    const hasInput = original !== '' || changed !== ''
    if (!hasInput) return { lines: [] as DiffLine[], added: 0, removed: 0, hasInput }
    const a = original.split('\n')
    const b = changed.split('\n')
    const lines = lineDiff(a, b)
    let added = 0
    let removed = 0
    for (const l of lines) {
      if (l.type === 'add') added++
      else if (l.type === 'del') removed++
    }
    return { lines, added, removed, hasInput }
  }, [original, changed])

  const identical = hasInput && added === 0 && removed === 0

  return (
    <>
      <IO>
        <Panel title="original">
          <TextArea
            value={original}
            onChange={setOriginal}
            placeholder="Original text…"
            rows={12}
          />
        </Panel>
        <Panel title="changed">
          <TextArea
            value={changed}
            onChange={setChanged}
            placeholder="Changed text…"
            rows={12}
          />
        </Panel>
      </IO>

      <Panel title="diff">
        {!hasInput ? (
          <Notice>Enter text in both panels to compare.</Notice>
        ) : identical ? (
          <Notice>No differences</Notice>
        ) : (
          <>
            <div
              className="mono"
              style={{
                fontSize: '.82rem',
                marginBottom: '.6rem',
                color: 'var(--mute)',
              }}
            >
              <span style={{ color: 'var(--acid)' }}>+{added}</span>{' '}
              <span style={{ color: '#ff6a4d' }}>−{removed}</span>
            </div>
            <pre
              className="mono"
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '.82rem',
                lineHeight: 1.5,
                border: '1px solid var(--line)',
                borderRadius: 6,
                overflow: 'auto',
              }}
            >
              {lines.map((l, idx) => (
                <div
                  key={idx}
                  style={{
                    ...lineStyle(l.type),
                    padding: '0 .6rem',
                  }}
                >
                  <span aria-hidden style={{ opacity: 0.7, userSelect: 'none' }}>
                    {PREFIX[l.type]}{' '}
                  </span>
                  {l.text === '' ? ' ' : l.text}
                </div>
              ))}
            </pre>
          </>
        )}
      </Panel>
    </>
  )
}
