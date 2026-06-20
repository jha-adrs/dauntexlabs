'use client'

import { useMemo, useState } from 'react'
import { TextInput, Field, Panel, CopyButton, Notice } from '@/components/ui/kit'

/* ── 32-bit unsigned IPv4 helpers ────────────────────────────────────────── */

/** Parse a dotted-quad to an unsigned 32-bit integer, or null if invalid. */
function parseIp(ip: string): number | null {
  const parts = ip.trim().split('.')
  if (parts.length !== 4) return null
  let acc = 0
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null
    const n = Number(part)
    if (n < 0 || n > 255) return null
    // reject leading zeros like "01" to keep parsing strict but allow "0"
    if (part.length > 1 && part[0] === '0') return null
    acc = (acc * 256 + n) >>> 0
  }
  return acc >>> 0
}

/** Render an unsigned 32-bit integer as a dotted quad. */
function ipToString(n: number): string {
  const u = n >>> 0
  return [
    (u >>> 24) & 0xff,
    (u >>> 16) & 0xff,
    (u >>> 8) & 0xff,
    u & 0xff,
  ].join('.')
}

/** Build a netmask for a given prefix length (0-32) as unsigned 32-bit. */
function prefixToMask(prefix: number): number {
  if (prefix === 0) return 0 >>> 0
  return (0xffffffff << (32 - prefix)) >>> 0
}

type CidrResult = {
  network: string
  broadcast: string
  netmask: string
  wildcard: string
  firstHost: string
  lastHost: string
  total: string
  usable: string
  prefix: number
}

function computeCidr(input: string): CidrResult {
  const trimmed = input.trim()
  const slash = trimmed.indexOf('/')
  if (slash === -1) {
    throw new Error('Missing prefix. Use the form 192.168.1.10/24.')
  }
  const ipPart = trimmed.slice(0, slash)
  const prefixPart = trimmed.slice(slash + 1)

  const ip = parseIp(ipPart)
  if (ip === null) {
    throw new Error('Invalid IPv4 address. Each octet must be 0-255.')
  }
  if (!/^\d+$/.test(prefixPart)) {
    throw new Error('Invalid prefix. Must be a number 0-32.')
  }
  const prefix = Number(prefixPart)
  if (prefix < 0 || prefix > 32) {
    throw new Error('Prefix out of range. Must be 0-32.')
  }

  const mask = prefixToMask(prefix)
  const wildcard = (~mask) >>> 0
  const network = (ip & mask) >>> 0
  const broadcast = (network | wildcard) >>> 0

  // total addresses in the block (2^(32-prefix)); use Math.pow for /0 safety
  const total = Math.pow(2, 32 - prefix)

  let firstHost: string
  let lastHost: string
  let usable: number

  if (prefix >= 31) {
    // /31 (RFC 3021 point-to-point) and /32 (single host) have no broadcast/host range
    if (prefix === 32) {
      firstHost = ipToString(network)
      lastHost = ipToString(network)
      usable = 1
    } else {
      // /31: both addresses are usable as hosts
      firstHost = ipToString(network)
      lastHost = ipToString(broadcast)
      usable = 2
    }
  } else {
    firstHost = ipToString((network + 1) >>> 0)
    lastHost = ipToString((broadcast - 1) >>> 0)
    usable = total - 2
  }

  return {
    network: ipToString(network),
    broadcast: ipToString(broadcast),
    netmask: ipToString(mask),
    wildcard: ipToString(wildcard),
    firstHost,
    lastHost,
    total: String(total),
    usable: String(usable),
    prefix,
  }
}

/* ── row ─────────────────────────────────────────────────────────────────── */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '10rem 1fr auto',
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
          fontSize: '0.72rem',
          color: 'var(--mute)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
      <code
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--bone)',
          fontSize: '0.92rem',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </code>
      <CopyButton text={value} />
    </div>
  )
}

/* ── component ───────────────────────────────────────────────────────────── */

export default function CidrCalculator() {
  const [input, setInput] = useState('192.168.1.0/24')

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, data: null }
    try {
      return { ok: true as const, data: computeCidr(input) }
    } catch (e) {
      return { ok: false as const, error: (e as Error).message }
    }
  }, [input])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Panel title="cidr block">
        <Field label="IPv4 CIDR" hint="e.g. 192.168.1.10/24">
          <TextInput value={input} onChange={setInput} placeholder="192.168.1.10/24" />
        </Field>
      </Panel>

      {!result.ok ? (
        <Notice kind="error">{result.error}</Notice>
      ) : result.data ? (
        <Panel title={`results · /${result.data.prefix}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Row label="Network" value={result.data.network} />
            <Row label="Broadcast" value={result.data.broadcast} />
            <Row label="Netmask" value={result.data.netmask} />
            <Row label="Wildcard" value={result.data.wildcard} />
            <Row label="First host" value={result.data.firstHost} />
            <Row label="Last host" value={result.data.lastHost} />
            <Row label="Total addresses" value={result.data.total} />
            <Row label="Usable hosts" value={result.data.usable} />
          </div>
        </Panel>
      ) : (
        <span style={{ color: 'var(--mute)', fontSize: '0.85rem' }}>
          Enter an IPv4 CIDR block above.
        </span>
      )}
    </div>
  )
}
