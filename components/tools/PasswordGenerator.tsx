'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  CopyButton,
  Field,
  Notice,
  Segmented,
  Select,
  TextArea,
  Toggle,
  Toolbar,
} from '@/components/ui/kit'

/* ── character sets ─────────────────────────────────────────────────── */

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?'
const AMBIGUOUS = /[O0l1I|]/g

/* ── random helpers (crypto.getRandomValues — works in any context) ─── */

/** Unbiased random integer in [0, n). Uses rejection sampling. */
function randInt(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n
  const buf = new Uint32Array(1)
  let v: number
  do {
    crypto.getRandomValues(buf)
    v = buf[0]
  } while (v >= limit)
  return v % n
}

function randPassword(
  length: number,
  useLower: boolean,
  useUpper: boolean,
  useDigits: boolean,
  useSymbols: boolean,
  excludeAmbiguous: boolean,
): string {
  let charset = ''
  if (useLower) charset += LOWER
  if (useUpper) charset += UPPER
  if (useDigits) charset += DIGITS
  if (useSymbols) charset += SYMBOLS
  if (excludeAmbiguous) charset = charset.replace(AMBIGUOUS, '')
  if (!charset) return ''

  const chars: string[] = []
  for (let i = 0; i < length; i++) {
    chars.push(charset[randInt(charset.length)])
  }
  return chars.join('')
}

/* ── entropy / strength ─────────────────────────────────────────────── */

function entropyBits(charsetSize: number, length: number): number {
  if (charsetSize <= 1) return 0
  return Math.round(length * Math.log2(charsetSize))
}

function strengthLabel(bits: number): { label: string; color: string } {
  if (bits < 28) return { label: 'Weak', color: '#e05' }
  if (bits < 60) return { label: 'Fair', color: '#f90' }
  if (bits < 100) return { label: 'Strong', color: '#8c4' }
  return { label: 'Very Strong', color: 'var(--acid)' }
}

function charsetSize(
  useLower: boolean,
  useUpper: boolean,
  useDigits: boolean,
  useSymbols: boolean,
  excludeAmbiguous: boolean,
): number {
  let s = ''
  if (useLower) s += LOWER
  if (useUpper) s += UPPER
  if (useDigits) s += DIGITS
  if (useSymbols) s += SYMBOLS
  if (excludeAmbiguous) s = s.replace(AMBIGUOUS, '')
  return s.length
}

/* ── passphrase word list (150+ common short words) ─────────────────── */

const WORDS = [
  'apple', 'brave', 'cloud', 'dance', 'earth', 'flame', 'grace', 'heart',
  'iris', 'joker', 'karma', 'light', 'mango', 'noble', 'ocean', 'peace',
  'quest', 'river', 'stone', 'tiger', 'unity', 'valor', 'water', 'xenon',
  'yield', 'zebra', 'acorn', 'berry', 'cedar', 'dawn', 'ember', 'frost',
  'grove', 'haven', 'inlet', 'jade', 'knoll', 'lemon', 'maple', 'north',
  'olive', 'pilot', 'queen', 'ridge', 'solar', 'talon', 'umbra', 'viper',
  'willow', 'xylem', 'youth', 'zonal', 'amber', 'bison', 'coral', 'delta',
  'eagle', 'fable', 'giant', 'honor', 'image', 'jewel', 'knife', 'lunar',
  'metal', 'nexus', 'orbit', 'pixel', 'quill', 'rapid', 'sigma', 'tidal',
  'ultra', 'vivid', 'whisky', 'axiom', 'blaze', 'crisp', 'drift', 'elbow',
  'flint', 'glint', 'haste', 'index', 'joint', 'latch', 'mount', 'nerve',
  'optic', 'plain', 'quartz', 'raven', 'scout', 'thorn', 'umbel', 'venom',
  'waltz', 'xerox', 'years', 'zesty', 'algae', 'brisk', 'cloak', 'dense',
  'epoch', 'forge', 'gleam', 'hound', 'ivory', 'jumbo', 'laser', 'micro',
  'night', 'ozone', 'plumb', 'quake', 'reign', 'spark', 'trove', 'upper',
  'vault', 'wrath', 'ample', 'bacon', 'charm', 'depth', 'envoy', 'ferry',
  'guild', 'hover', 'intro', 'juggle', 'knack', 'lodge', 'magic', 'niche',
  'onset', 'perch', 'quota', 'realm', 'slant', 'tempo', 'urban', 'vista',
  'wagon', 'yodel',
]

function randPassphrase(
  wordCount: number,
  separator: string,
  capitalize: boolean,
  includeNumber: boolean,
): string {
  const chosen: string[] = []
  for (let i = 0; i < wordCount; i++) {
    let w = WORDS[randInt(WORDS.length)]
    if (capitalize) w = w.charAt(0).toUpperCase() + w.slice(1)
    chosen.push(w)
  }
  if (includeNumber) {
    const num = randInt(100).toString()
    chosen.splice(randInt(chosen.length + 1), 0, num)
  }
  return chosen.join(separator === 'space' ? ' ' : separator)
}

/* ── component ──────────────────────────────────────────────────────── */

const MODES = [
  { value: 'password', label: 'Password' },
  { value: 'passphrase', label: 'Passphrase' },
]

const SEP_OPTIONS = [
  { value: '-', label: '- hyphen' },
  { value: '.', label: '. period' },
  { value: '_', label: '_ underscore' },
  { value: 'space', label: '  space' },
]

export default function PasswordGenerator() {
  const [mode, setMode] = useState('password')

  // Password options
  const [length, setLength] = useState(20)
  const [useLower, setUseLower] = useState(true)
  const [useUpper, setUseUpper] = useState(true)
  const [useDigits, setUseDigits] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)

  // Passphrase options
  const [wordCount, setWordCount] = useState(4)
  const [separator, setSeparator] = useState('-')
  const [capitalize, setCapitalize] = useState(true)
  const [includeNumber, setIncludeNumber] = useState(false)

  const [output, setOutput] = useState('')

  const generate = useCallback(() => {
    if (mode === 'password') {
      const pw = randPassword(length, useLower, useUpper, useDigits, useSymbols, excludeAmbiguous)
      setOutput(pw)
    } else {
      const pp = randPassphrase(wordCount, separator, capitalize, includeNumber)
      setOutput(pp)
    }
  }, [mode, length, useLower, useUpper, useDigits, useSymbols, excludeAmbiguous, wordCount, separator, capitalize, includeNumber])

  // Auto-generate whenever options change
  useEffect(() => {
    generate()
  }, [generate])

  const noCharset =
    mode === 'password' && !useLower && !useUpper && !useDigits && !useSymbols

  // Entropy display (password mode only)
  const cs = charsetSize(useLower, useUpper, useDigits, useSymbols, excludeAmbiguous)
  const bits = entropyBits(cs, length)
  const strength = strengthLabel(bits)

  return (
    <>
      <Toolbar>
        <Segmented value={mode} onChange={setMode} options={MODES} />
      </Toolbar>

      {mode === 'password' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Field label={`Length: ${length}`}>
              <input
                type="range"
                min={4}
                max={64}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                style={{ accentColor: 'var(--acid)', width: 220 }}
              />
            </Field>
            {!noCharset && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: strength.color }}>
                {bits} bits — {strength.label}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Toggle checked={useLower} onChange={setUseLower} label="lowercase" />
            <Toggle checked={useUpper} onChange={setUseUpper} label="UPPERCASE" />
            <Toggle checked={useDigits} onChange={setUseDigits} label="Digits 0–9" />
            <Toggle checked={useSymbols} onChange={setUseSymbols} label="Symbols !@#…" />
            <Toggle checked={excludeAmbiguous} onChange={setExcludeAmbiguous} label="Exclude ambiguous (O 0 l 1 I |)" />
          </div>

          {noCharset && (
            <Notice kind="error">Enable at least one character set.</Notice>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Field label={`Words: ${wordCount}`}>
              <input
                type="range"
                min={3}
                max={10}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                style={{ accentColor: 'var(--acid)', width: 220 }}
              />
            </Field>
            <Field label="Separator">
              <Select value={separator} onChange={setSeparator} options={SEP_OPTIONS} />
            </Field>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Toggle checked={capitalize} onChange={setCapitalize} label="Capitalize words" />
            <Toggle checked={includeNumber} onChange={setIncludeNumber} label="Include a number" />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 12px' }}>
        <Button variant="primary" onClick={generate}>
          Generate
        </Button>
      </div>

      <div
        style={{
          position: 'relative',
          background: 'var(--ink-850)',
          border: '1px solid var(--line)',
          borderRadius: 4,
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.1rem',
            color: 'var(--bone)',
            letterSpacing: '0.03em',
            wordBreak: 'break-all',
            minHeight: '2em',
            paddingRight: 80,
          }}
        >
          {output || <span style={{ color: 'var(--mute)' }}>—</span>}
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <CopyButton text={output} />
        </div>
      </div>
    </>
  )
}
