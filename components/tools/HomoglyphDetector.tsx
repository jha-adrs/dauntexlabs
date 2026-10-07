'use client'

// lib/confusables.ts (the Unicode lookalike table) is imported lazily the first time
// the user types, so it never enters the shared bundle.

import { useEffect, useState, type ReactNode } from 'react'
import { Field, TextArea, Toggle, Panel, CopyButton, Notice } from '@/components/ui/kit'

type Lib = typeof import('@/lib/confusables')

const markStyle = {
  background: 'var(--danger-tint)',
  color: 'var(--danger)',
  borderRadius: 'var(--radius-sm)',
  padding: '0 1px',
}

const cell = { padding: '6px 10px', borderBottom: '1px solid var(--line)', textAlign: 'left' as const }

export default function HomoglyphDetector() {
  const [text, setText] = useState('')
  const [lib, setLib] = useState<Lib | null>(null)
  const [stripOnly, setStripOnly] = useState(false)

  useEffect(() => {
    if (!text || lib) return
    let alive = true
    import('@/lib/confusables').then((m) => alive && setLib(m))
    return () => {
      alive = false
    }
  }, [text, lib])

  const hits = lib && text ? lib.findConfusables(text) : []
  const ready = !!lib && !!text

  // Inline view: original text with suspicious characters marked.
  const inline: ReactNode[] = []
  if (ready) {
    const byIndex = new Map(hits.map((h) => [h.index, h]))
    let i = 0
    let plain = ''
    for (const ch of text) {
      const h = byIndex.get(i)
      if (h) {
        if (plain) inline.push(plain)
        plain = ''
        inline.push(
          <mark key={i} style={markStyle} title={`${lib.formatCodePoint(h.codePoint)} ${h.script}`}>
            {h.script === 'Invisible' ? `⟨${lib.formatCodePoint(h.codePoint)}⟩` : ch}
          </mark>,
        )
      } else plain += ch
      i++
    }
    if (plain) inline.push(plain)
  }

  const output = ready ? (stripOnly ? lib.removeInvisible(text) : lib.skeleton(text)) : ''

  return (
    <>
      <Field label="Text to check">
        <TextArea
          value={text}
          onChange={setText}
          rows={5}
          placeholder="Paste a domain, username or text…"
        />
      </Field>

      {ready && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          {hits.length === 0 ? (
            <Notice kind="success">No lookalike or invisible characters found.</Notice>
          ) : (
            <Notice kind="error">
              {hits.length} suspicious character{hits.length === 1 ? '' : 's'} found.
            </Notice>
          )}

          <Panel title="Highlighted">
            <div style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {inline}
            </div>
          </Panel>

          {hits.length > 0 && (
            <Panel title="Characters found">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ color: 'var(--mute)' }}>
                      <th style={cell}>Position</th>
                      <th style={cell}>Character</th>
                      <th style={cell}>Code</th>
                      <th style={cell}>Script</th>
                      <th style={cell}>Looks like</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hits.map((h) => (
                      <tr key={h.index}>
                        <td style={cell}>{h.index + 1}</td>
                        <td style={{ ...cell, fontFamily: 'var(--font-mono)' }}>
                          {h.script === 'Invisible' ? '(invisible)' : h.char}
                        </td>
                        <td style={{ ...cell, fontFamily: 'var(--font-mono)' }}>
                          {lib.formatCodePoint(h.codePoint)}
                        </td>
                        <td style={cell}>{h.script}</td>
                        <td style={{ ...cell, fontFamily: 'var(--font-mono)' }}>{h.looksLike || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          <Toggle checked={stripOnly} onChange={setStripOnly} label="Remove invisible characters" />
          <Panel
            title={stripOnly ? 'Without invisible characters' : 'ASCII skeleton'}
            actions={<CopyButton text={output} />}
          >
            <TextArea
              value={output}
              readOnly
              rows={4}
              placeholder={stripOnly ? 'Text without invisible characters…' : 'Skeleton…'}
            />
          </Panel>
        </div>
      )}
    </>
  )
}
