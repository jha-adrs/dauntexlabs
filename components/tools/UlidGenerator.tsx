'use client'

import { useState } from 'react'
import {
  Segmented,
  Toolbar,
  IO,
  Panel,
  TextArea,
  TextInput,
  Button,
  CopyButton,
  DownloadButton,
  Field,
  Notice,
} from '@/components/ui/kit'

// Crockford Base32 alphabet (no I, L, O, U)
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

function generateUlid(): string {
  const now = Date.now()
  // 48-bit timestamp → 10 Base32 chars
  let ts = ''
  let t = now
  for (let i = 9; i >= 0; i--) {
    ts = CROCKFORD[t & 0x1f] + ts
    t = Math.floor(t / 32)
  }

  // 80 bits of randomness → 16 Base32 chars
  const rand = new Uint8Array(10)
  crypto.getRandomValues(rand)
  // pack 10 bytes (80 bits) into 16 Base32 chars
  // each Base32 char = 5 bits; 80 bits / 5 = 16 chars
  const bits: number[] = []
  for (const b of rand) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1)
  }
  let rnd = ''
  for (let i = 0; i < 16; i++) {
    let val = 0
    for (let j = 0; j < 5; j++) val = (val << 1) | bits[i * 5 + j]
    rnd += CROCKFORD[val]
  }

  return ts + rnd
}

function generateUuidV7(): string {
  const ms = Date.now()
  const rand = new Uint8Array(10)
  crypto.getRandomValues(rand)

  // 48-bit unix-ms timestamp in the top 48 bits of a 128-bit UUID
  // Layout: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
  // time_high (32 bits), time_low (16 bits), ver+rand (16 bits), var+rand (16 bits), rand (48 bits)
  const hi32 = Math.floor(ms / 0x10000) >>> 0       // top 32 bits of ms
  const lo16 = (ms & 0xffff) >>> 0                  // bottom 16 bits of ms

  // rand[0..1] → 12 bits after version nibble
  const randA = ((rand[0] & 0x0f) << 8) | rand[1]  // 12 random bits (version nibble replaces top 4)

  // rand[2] carries the variant bits (10xx xxxx) + 6 bits random
  const randB = ((rand[2] & 0x3f) | 0x80) << 8 | rand[3] // variant 10xx + 8 bits

  // remaining 48 bits from rand[4..9]
  const c = rand[4].toString(16).padStart(2, '0')
    + rand[5].toString(16).padStart(2, '0')
    + rand[6].toString(16).padStart(2, '0')
    + rand[7].toString(16).padStart(2, '0')
    + rand[8].toString(16).padStart(2, '0')
    + rand[9].toString(16).padStart(2, '0')

  const p1 = hi32.toString(16).padStart(8, '0')
  const p2 = lo16.toString(16).padStart(4, '0')
  const p3 = (0x7000 | randA).toString(16).padStart(4, '0')
  const p4 = randB.toString(16).padStart(4, '0')

  return `${p1}-${p2}-${p3}-${p4}-${c}`
}

export default function UlidGenerator() {
  const [mode, setMode] = useState<'ULID' | 'UUIDv7'>('ULID')
  const [count, setCount] = useState('1')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  function generate() {
    const n = parseInt(count, 10)
    if (!Number.isFinite(n) || n < 1 || n > 100) {
      setError('Count must be between 1 and 100.')
      setOutput('')
      return
    }
    setError('')
    const lines: string[] = []
    for (let i = 0; i < n; i++) {
      lines.push(mode === 'ULID' ? generateUlid() : generateUuidV7())
    }
    setOutput(lines.join('\n'))
  }

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={(v) => { setMode(v as 'ULID' | 'UUIDv7'); setOutput(''); setError('') }}
          options={[
            { value: 'ULID', label: 'ULID' },
            { value: 'UUIDv7', label: 'UUID v7' },
          ]}
        />
        <Field label="Count">
          <TextInput
            value={count}
            onChange={(v) => setCount(v)}
            placeholder="1"
            type="number"
          />
        </Field>
        <Button variant="primary" onClick={generate}>Generate</Button>
      </Toolbar>

      {error && <Notice kind="error">{error}</Notice>}

      <IO>
        <Panel
          title="output"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename="ids.txt" />
            </>
          }
        >
          <TextArea
            value={output}
            readOnly
            placeholder={`Generated ${mode}s will appear here…`}
            rows={12}
          />
        </Panel>
      </IO>
    </>
  )
}
