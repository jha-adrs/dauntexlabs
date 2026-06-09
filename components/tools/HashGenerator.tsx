'use client'

import { useEffect, useState } from 'react'
import { Toolbar, Toggle, Field, TextArea, CopyButton, Notice } from '@/components/ui/kit'
import { md5 } from '@/lib/md5'

const SHA_ALGOS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const

async function shaHex(algo: string, text: string): Promise<string> {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default function HashGenerator() {
  const [input, setInput] = useState('')
  const [upper, setUpper] = useState(false)
  const [hashes, setHashes] = useState<{ algo: string; hex: string }[]>([])
  const subtle = typeof crypto !== 'undefined' && !!crypto.subtle

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!input) {
        setHashes([])
        return
      }
      // MD5 is pure JS and always works.
      const rows = [{ algo: 'MD5', hex: md5(input) }]
      // SHA family needs Web Crypto (secure context: HTTPS or localhost).
      if (subtle) {
        for (const a of SHA_ALGOS) {
          try {
            rows.push({ algo: a, hex: await shaHex(a, input) })
          } catch {
            /* skip on failure */
          }
        }
      }
      if (!cancelled) setHashes(rows)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [input, subtle])

  const fmt = (h: string) => (upper ? h.toUpperCase() : h)

  return (
    <>
      <Toolbar>
        <Toggle checked={upper} onChange={setUpper} label="Uppercase" />
        <span className="hint-inline">computed with Web Crypto · on-device</span>
      </Toolbar>

      {!subtle && (
        <Notice kind="info">
          SHA digests need a secure context (HTTPS or localhost). MD5 still works here.
        </Notice>
      )}

      <Field label="Input">
        <TextArea value={input} onChange={setInput} placeholder="Text to hash…" rows={6} />
      </Field>

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {hashes.length === 0 && <Notice kind="info">Enter text above to compute digests.</Notice>}
        {hashes.map(({ algo, hex }) => (
          <div className="hash-row" key={algo}>
            <span className="hash-algo">{algo}</span>
            <code className="hash-hex">{fmt(hex)}</code>
            <CopyButton text={fmt(hex)} />
          </div>
        ))}
      </div>
    </>
  )
}
