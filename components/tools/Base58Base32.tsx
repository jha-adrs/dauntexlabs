'use client'

import { useMemo, useState } from 'react'
import {
  Segmented,
  Toolbar,
  IO,
  Panel,
  TextArea,
  CopyButton,
  DownloadButton,
  Notice,
} from '@/components/ui/kit'

// ── RFC 4648 Base32 ──────────────────────────────────────────────────────────
const B32_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const B32_PAD = '='

function base32Encode(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += B32_ALPHA[(value >>> (bits - 5)) & 0x1f]
      bits -= 5
    }
  }
  if (bits > 0) {
    out += B32_ALPHA[(value << (5 - bits)) & 0x1f]
  }
  while (out.length % 8 !== 0) out += B32_PAD
  return out
}

function base32Decode(s: string): Uint8Array {
  s = s.toUpperCase().replace(/=+$/, '')
  const bytes: number[] = []
  let bits = 0
  let value = 0
  for (const ch of s) {
    const idx = B32_ALPHA.indexOf(ch)
    if (idx === -1) throw new Error(`Invalid Base32 character: '${ch}'`)
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return new Uint8Array(bytes)
}

// ── Bitcoin Base58 ───────────────────────────────────────────────────────────
const B58_ALPHA = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58Encode(bytes: Uint8Array): string {
  // Count leading zero bytes
  let leadingZeros = 0
  for (const b of bytes) {
    if (b !== 0) break
    leadingZeros++
  }

  // Convert bytes to a big integer (stored as array of digits in base 58)
  const digits = [0]
  for (const byte of bytes) {
    let carry = byte
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8
      digits[i] = carry % 58
      carry = Math.floor(carry / 58)
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = Math.floor(carry / 58)
    }
  }

  // Encode
  let out = '1'.repeat(leadingZeros)
  for (let i = digits.length - 1; i >= 0; i--) {
    out += B58_ALPHA[digits[i]]
  }
  return out
}

function base58Decode(s: string): Uint8Array {
  // Count leading '1's (leading zeros)
  let leadingOnes = 0
  for (const ch of s) {
    if (ch !== '1') break
    leadingOnes++
  }

  // Convert Base58 string to big integer as a byte array
  const bytes = [0]
  for (const ch of s) {
    const idx = B58_ALPHA.indexOf(ch)
    if (idx === -1) throw new Error(`Invalid Base58 character: '${ch}'`)
    let carry = idx
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58
      bytes[i] = carry & 0xff
      carry >>= 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }

  // Remove trailing zeros that don't correspond to leading ones
  while (bytes.length > leadingOnes && bytes[bytes.length - 1] === 0) bytes.pop()

  // Reverse (we built LSB-first)
  bytes.reverse()

  // Prepend leading zero bytes
  const result = new Uint8Array(leadingOnes + bytes.length)
  result.set(new Uint8Array(bytes), leadingOnes)
  return result
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Base58Base32() {
  const [alphabet, setAlphabet] = useState<'Base32' | 'Base58'>('Base32')
  const [op, setOp] = useState<'Encode' | 'Decode'>('Encode')
  const [input, setInput] = useState('')

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      if (op === 'Encode') {
        const bytes = new TextEncoder().encode(input)
        const out = alphabet === 'Base32' ? base32Encode(bytes) : base58Encode(bytes)
        return { output: out, error: '' }
      } else {
        const bytes = alphabet === 'Base32' ? base32Decode(input.trim()) : base58Decode(input.trim())
        const out = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
        return { output: out, error: '' }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      return { output: '', error: `Invalid input: ${msg}` }
    }
  }, [input, alphabet, op])

  return (
    <>
      <Toolbar>
        <Segmented
          value={alphabet}
          onChange={(v) => { setAlphabet(v as 'Base32' | 'Base58'); setInput('') }}
          options={[
            { value: 'Base32', label: 'Base32' },
            { value: 'Base58', label: 'Base58' },
          ]}
        />
        <Segmented
          value={op}
          onChange={(v) => { setOp(v as 'Encode' | 'Decode'); setInput('') }}
          options={[
            { value: 'Encode', label: 'Encode' },
            { value: 'Decode', label: 'Decode' },
          ]}
        />
      </Toolbar>

      <IO>
        <Panel title={op === 'Encode' ? 'plain text' : alphabet.toLowerCase()}>
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={
              op === 'Encode'
                ? `Text to ${alphabet} encode…`
                : `${alphabet}-encoded string to decode…`
            }
            rows={12}
          />
        </Panel>
        <Panel
          title={op === 'Encode' ? alphabet.toLowerCase() : 'plain text'}
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename="output.txt" />
            </>
          }
        >
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : (
            <TextArea value={output} readOnly placeholder="Result…" rows={12} />
          )}
        </Panel>
      </IO>
    </>
  )
}
