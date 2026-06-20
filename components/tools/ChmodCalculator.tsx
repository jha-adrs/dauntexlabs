'use client'

import { useState } from 'react'
import { TextInput, Field, Panel, Toggle, CopyButton } from '@/components/ui/kit'

/* ── model ───────────────────────────────────────────────────────────────── */

// Nine permission bits, ordered owner→group→other, each read→write→execute.
type Perms = boolean[] // length 9

const CLASSES = ['Owner', 'Group', 'Other'] as const
const BIT_LABELS = ['read', 'write', 'execute'] as const
const SYMBOLS = ['r', 'w', 'x'] as const

const EMPTY: Perms = Array(9).fill(false)

/** Permissions → 3-digit octal string, e.g. [t,t,t,t,f,t,t,f,t] → "755". */
function permsToOctal(perms: Perms): string {
  let out = ''
  for (let c = 0; c < 3; c++) {
    const base = c * 3
    const digit =
      (perms[base] ? 4 : 0) + (perms[base + 1] ? 2 : 0) + (perms[base + 2] ? 1 : 0)
    out += String(digit)
  }
  return out
}

/** Permissions → symbolic notation, e.g. "rwxr-xr-x". */
function permsToSymbolic(perms: Perms): string {
  let out = ''
  for (let i = 0; i < 9; i++) {
    out += perms[i] ? SYMBOLS[i % 3] : '-'
  }
  return out
}

/** Parse a 1-3 digit octal string into Perms, or null if invalid. */
function octalToPerms(octal: string): Perms | null {
  const s = octal.trim()
  if (!/^[0-7]{1,3}$/.test(s)) return null
  // left-pad to 3 digits so "44" means owner=0, so we right-align: treat "44" as "044"
  const padded = s.padStart(3, '0')
  const perms: Perms = []
  for (let c = 0; c < 3; c++) {
    const digit = Number(padded[c])
    perms.push((digit & 4) !== 0) // read
    perms.push((digit & 2) !== 0) // write
    perms.push((digit & 1) !== 0) // execute
  }
  return perms
}

/* ── component ───────────────────────────────────────────────────────────── */

export default function ChmodCalculator() {
  const [perms, setPerms] = useState<Perms>(() => octalToPerms('755') ?? EMPTY)
  // raw text the user is typing into the octal box (kept separate so partial
  // / invalid input is preserved without snapping the toggles around)
  const [octalText, setOctalText] = useState('755')

  const octal = permsToOctal(perms)
  const symbolic = permsToSymbolic(perms)

  function setBit(index: number, value: boolean) {
    const next = perms.slice()
    next[index] = value
    setPerms(next)
    setOctalText(permsToOctal(next))
  }

  function onOctalChange(text: string) {
    setOctalText(text)
    const parsed = octalToPerms(text)
    if (parsed) setPerms(parsed)
  }

  const octalValid = octalToPerms(octalText) !== null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── prominent results ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Panel title="octal" actions={<CopyButton text={octal} />}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2rem',
              color: 'var(--acid)',
              letterSpacing: '0.1em',
            }}
            aria-label="octal permissions"
          >
            {octal}
          </div>
        </Panel>
        <Panel title="symbolic" actions={<CopyButton text={symbolic} />}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2rem',
              color: 'var(--acid)',
              letterSpacing: '0.05em',
            }}
            aria-label="symbolic permissions"
          >
            {symbolic}
          </div>
        </Panel>
      </div>

      {/* ── octal input ── */}
      <Panel title="enter octal">
        <Field
          label="Octal (e.g. 755)"
          hint={octalValid ? 'digits 0-7, up to 3 places' : 'invalid octal — use digits 0-7'}
        >
          <TextInput value={octalText} onChange={onOctalChange} placeholder="755" />
        </Field>
      </Panel>

      {/* ── toggle grid ── */}
      <Panel title="permissions">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CLASSES.map((cls, c) => (
            <div
              key={cls}
              style={{
                display: 'grid',
                gridTemplateColumns: '5rem repeat(3, 1fr)',
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
                  fontSize: '0.75rem',
                  color: 'var(--mute)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {cls}
              </span>
              {BIT_LABELS.map((bit, b) => {
                const idx = c * 3 + b
                return (
                  <Toggle
                    key={bit}
                    checked={perms[idx]}
                    onChange={(v) => setBit(idx, v)}
                    label={`${cls.toLowerCase()} ${bit}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
