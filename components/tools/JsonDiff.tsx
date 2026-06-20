'use client'

import { useMemo, useState } from 'react'
import { IO, Panel, TextArea, Notice } from '@/components/ui/kit'

type DiffKind = 'added' | 'removed' | 'changed'

interface DiffEntry {
  path: string
  kind: DiffKind
  left?: unknown
  right?: unknown
}

function deepDiff(left: unknown, right: unknown, path: string, entries: DiffEntry[]): void {
  if (left === right) return

  const isObj = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v)
  const isArr = (v: unknown): v is unknown[] => Array.isArray(v)

  if (isObj(left) && isObj(right)) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)])
    for (const key of keys) {
      const childPath = path ? `${path}.${key}` : key
      if (!(key in left)) {
        entries.push({ path: childPath, kind: 'added', right: right[key] })
      } else if (!(key in right)) {
        entries.push({ path: childPath, kind: 'removed', left: left[key] })
      } else {
        deepDiff(left[key], right[key], childPath, entries)
      }
    }
    return
  }

  if (isArr(left) && isArr(right)) {
    const len = Math.max(left.length, right.length)
    for (let i = 0; i < len; i++) {
      const childPath = `${path}[${i}]`
      if (i >= left.length) {
        entries.push({ path: childPath, kind: 'added', right: right[i] })
      } else if (i >= right.length) {
        entries.push({ path: childPath, kind: 'removed', left: left[i] })
      } else {
        deepDiff(left[i], right[i], childPath, entries)
      }
    }
    return
  }

  // Primitive mismatch or type mismatch
  entries.push({ path: path || '(root)', kind: 'changed', left, right })
}

function fmt(v: unknown): string {
  if (typeof v === 'string') return JSON.stringify(v)
  return JSON.stringify(v)
}

const kindColor: Record<DiffKind, string> = {
  added: 'var(--acid)',
  removed: '#f87171',
  changed: '#d8b24a',
}

const kindLabel: Record<DiffKind, string> = {
  added: 'ADDED',
  removed: 'REMOVED',
  changed: 'CHANGED',
}

export default function JsonDiff() {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')

  const result = useMemo(() => {
    if (!left.trim() && !right.trim()) return { entries: null, error: '' }
    if (!left.trim()) return { entries: null, error: 'Left input is empty.' }
    if (!right.trim()) return { entries: null, error: 'Right input is empty.' }

    let leftVal: unknown
    let rightVal: unknown
    try {
      leftVal = JSON.parse(left)
    } catch {
      return { entries: null, error: 'Left JSON is invalid.' }
    }
    try {
      rightVal = JSON.parse(right)
    } catch {
      return { entries: null, error: 'Right JSON is invalid.' }
    }

    const entries: DiffEntry[] = []
    deepDiff(leftVal, rightVal, '', entries)
    return { entries, error: '' }
  }, [left, right])

  const counts = result.entries
    ? {
        added: result.entries.filter((e) => e.kind === 'added').length,
        removed: result.entries.filter((e) => e.kind === 'removed').length,
        changed: result.entries.filter((e) => e.kind === 'changed').length,
      }
    : null

  return (
    <>
      <IO>
        <Panel title="left JSON">
          <TextArea
            value={left}
            onChange={setLeft}
            placeholder='{"key": "value"}'
            rows={14}
          />
        </Panel>
        <Panel title="right JSON">
          <TextArea
            value={right}
            onChange={setRight}
            placeholder='{"key": "value"}'
            rows={14}
          />
        </Panel>
      </IO>

      {result.error && <Notice kind="error">{result.error}</Notice>}

      {result.entries !== null && !result.error && (
        <>
          {result.entries.length === 0 ? (
            <Notice kind="success">No differences — the two JSON values are identical.</Notice>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  padding: '0.75rem 1rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  borderTop: '1px solid var(--line)',
                  borderBottom: '1px solid var(--line)',
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  <span style={{ color: kindColor.added }}>{counts!.added}</span>
                  <span style={{ color: 'var(--mute)', marginLeft: '0.35rem' }}>added</span>
                </span>
                <span>
                  <span style={{ color: kindColor.removed }}>{counts!.removed}</span>
                  <span style={{ color: 'var(--mute)', marginLeft: '0.35rem' }}>removed</span>
                </span>
                <span>
                  <span style={{ color: kindColor.changed }}>{counts!.changed}</span>
                  <span style={{ color: 'var(--mute)', marginLeft: '0.35rem' }}>changed</span>
                </span>
                <span>
                  <span style={{ color: 'var(--bone)' }}>{result.entries.length}</span>
                  <span style={{ color: 'var(--mute)', marginLeft: '0.35rem' }}>total</span>
                </span>
              </div>

              <div
                role="list"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  padding: '1rem 0',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                }}
              >
                {result.entries.map((entry, i) => (
                  <div
                    key={i}
                    role="listitem"
                    data-kind={entry.kind}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr',
                      gap: '0 1rem',
                      padding: '0.55rem 1rem',
                      background: 'var(--ink-850)',
                      border: '1px solid var(--line)',
                      borderLeft: `3px solid ${kindColor[entry.kind]}`,
                    }}
                  >
                    <span style={{ color: kindColor[entry.kind], fontWeight: 600, minWidth: '5.5rem' }}>
                      {kindLabel[entry.kind]}
                    </span>
                    <span style={{ color: 'var(--bone)' }}>{entry.path}</span>
                    {entry.kind === 'changed' && (
                      <>
                        <span style={{ color: 'var(--mute)' }}>left</span>
                        <span style={{ color: '#f87171' }}>{fmt(entry.left)}</span>
                        <span style={{ color: 'var(--mute)' }}>right</span>
                        <span style={{ color: 'var(--acid)' }}>{fmt(entry.right)}</span>
                      </>
                    )}
                    {entry.kind === 'added' && (
                      <>
                        <span style={{ color: 'var(--mute)' }}>value</span>
                        <span style={{ color: 'var(--acid)' }}>{fmt(entry.right)}</span>
                      </>
                    )}
                    {entry.kind === 'removed' && (
                      <>
                        <span style={{ color: 'var(--mute)' }}>value</span>
                        <span style={{ color: '#f87171' }}>{fmt(entry.left)}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
