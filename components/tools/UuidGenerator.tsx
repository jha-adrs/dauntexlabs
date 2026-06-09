'use client'

import { useState } from 'react'
import {
  Button,
  CopyButton,
  DownloadButton,
  Field,
  TextArea,
  TextInput,
  Toggle,
  Toolbar,
  IO,
  Panel,
} from '@/components/ui/kit'

/* ── UUID v4 via crypto.getRandomValues ────────────────────────────────── */

function uuidv4(): string {
  // Fast path: use native randomUUID if available (secure context)
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // Fallback: manual RFC-4122 v4 construction
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  // Set version bits: version 4 → 0100xxxx
  b[6] = (b[6] & 0x0f) | 0x40
  // Set variant bits: 10xxxxxx
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b).map((x) => x.toString(16).padStart(2, '0'))
  return [
    h.slice(0, 4).join(''),
    h.slice(4, 6).join(''),
    h.slice(6, 8).join(''),
    h.slice(8, 10).join(''),
    h.slice(10, 16).join(''),
  ].join('-')
}

function formatUUID(raw: string, uppercase: boolean, hyphens: boolean, braces: boolean): string {
  let s = raw
  if (!hyphens) s = s.replace(/-/g, '')
  if (uppercase) s = s.toUpperCase()
  if (braces) s = `{${s}}`
  return s
}

/* ── component ──────────────────────────────────────────────────────────── */

export default function UuidGenerator() {
  const [count, setCount] = useState('5')
  const [uppercase, setUppercase] = useState(false)
  const [hyphens, setHyphens] = useState(true)
  const [braces, setBraces] = useState(false)

  const [output, setOutput] = useState('')
  const [generated, setGenerated] = useState(0)

  function generate() {
    const n = Math.max(1, Math.min(10000, parseInt(count) || 5))
    const lines: string[] = []
    for (let i = 0; i < n; i++) {
      lines.push(formatUUID(uuidv4(), uppercase, hyphens, braces))
    }
    const result = lines.join('\n')
    setOutput(result)
    setGenerated(n)
  }

  return (
    <>
      <Toolbar>
        <Field label="Count">
          <TextInput value={count} onChange={setCount} type="number" placeholder="5" />
        </Field>
        <Toggle checked={uppercase} onChange={setUppercase} label="Uppercase" />
        <Toggle checked={hyphens} onChange={setHyphens} label="Hyphens" />
        <Toggle checked={braces} onChange={setBraces} label="Braces {…}" />
      </Toolbar>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
        <Button variant="primary" onClick={generate}>
          Generate
        </Button>
        {generated > 0 && (
          <span style={{ color: 'var(--mute)', fontSize: '0.82rem' }}>
            {generated} UUID{generated !== 1 ? 's' : ''} generated
          </span>
        )}
      </div>

      <IO>
        <Panel
          title="output"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename="uuids.txt" mime="text/plain" />
            </>
          }
        >
          <TextArea
            value={output}
            readOnly
            placeholder="Click Generate to produce UUIDs…"
            rows={16}
          />
        </Panel>
      </IO>
    </>
  )
}
