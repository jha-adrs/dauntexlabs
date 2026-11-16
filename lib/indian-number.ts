// Indian ↔ international number formats. All maths is on BigInt "hundredths" (value × 100),
// so phrases like "2.5 crore" or 10^18 are exact — never floats, never e-notation.
import { formatIndian, intWords } from './rupees'

export type ScaleUnit = 'thousand' | 'lakh' | 'million' | 'crore' | 'billion' | 'lakh crore' | 'trillion'
export type ParseResult = { ok: true; value: bigint } | { ok: false; error: string }

const EXP: Record<ScaleUnit, number> = {
  thousand: 3, lakh: 5, million: 6, crore: 7, billion: 9, 'lakh crore': 12, trillion: 12,
}

const ALIASES: Record<string, number> = {
  k: 3, thousand: 3, thousands: 3,
  lakh: 5, lakhs: 5, lac: 5, lacs: 5,
  million: 6, millions: 6, mn: 6,
  crore: 7, crores: 7, cr: 7,
  billion: 9, billions: 9, bn: 9,
  trillion: 12, trillions: 12, tn: 12,
}

const MAX = 10n ** 20n // 10^18, in hundredths
const MAX_LEN = 60
const FILLER = new Set(['rupees', 'rs', 'inr', 'views'])
const pow10 = (n: number) => 10n ** BigInt(n)

/** Parse "2.5 crore", "50k crore", "1,00,000" … into exact hundredths. null for empty input. */
export function parseAmount(text: string): ParseResult | null {
  const raw = text.trim().toLowerCase()
  if (!raw) return null
  if (raw.length > MAX_LEN) return { ok: false, error: `Keep the input under ${MAX_LEN} characters, like 2.5 crore or 1,25,000.` }
  // Query-shaped input: "₹5 crore views in million" → "5 crore views"; "2.5 Cr." → "2.5 cr".
  const s = raw
    .replace(/^(₹|rs\.?)\s*/, '')
    .replace(/\s+(in|to|into)\b.*$/, '')
    .replace(/\.$/, '')
    .trim()
  if (s.startsWith('-')) return { ok: false, error: 'Negative numbers are not supported.' }
  const m = /^([\d,]*(?:\.\d*)?)([a-z\s]*)$/.exec(s)
  const num = m ? m[1].replace(/,/g, '') : ''
  if (!m || !/^(\d+\.?\d*|\.\d+)$/.test(num))
    return { ok: false, error: 'Enter a number or a phrase, like 2.5 crore, 50k crore or 1,25,000.' }

  let exp = 0
  for (const word of m[2].split(/\s+/).filter(Boolean)) {
    if (FILLER.has(word)) continue
    const e = ALIASES[word]
    if (e === undefined)
      return { ok: false, error: `Unknown unit "${word}". Use thousand (k), lakh (lac), crore (cr), million (mn), billion (bn) or trillion (tn).` }
    exp += e
  }

  const [int, frac = ''] = num.split('.')
  const digits = BigInt((int || '0') + frac)
  const shift = exp - frac.length + 2
  let value: bigint
  if (shift >= 0) value = digits * pow10(shift)
  else {
    const d = pow10(-shift)
    if (digits % d !== 0n) return { ok: false, error: 'Use at most two decimal places of the final number.' }
    value = digits / d
  }
  if (value > MAX) return { ok: false, error: 'That is above 10^18, the largest number this tool handles.' }
  return { ok: true, value }
}

/** International digit grouping: 10000000 → 10,000,000 */
export function formatInternational(digits: string): string {
  return digits.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** Exact decimal string of `value / 10^places` with trailing zeros trimmed. */
function shiftDecimal(value: bigint, places: number): { int: string; frac: string } {
  const s = value.toString().padStart(places + 1, '0')
  return { int: s.slice(0, -places), frac: s.slice(-places).replace(/0+$/, '') }
}
const join = (int: string, frac: string) => (frac ? `${int}.${frac}` : int)

/** Value (hundredths) expressed in a unit, as a plain decimal: 123456789 in crore → "12.3456789". */
export function inScale(value: bigint, unit: ScaleUnit): string {
  const { int, frac } = shiftDecimal(value, EXP[unit] + 2)
  return join(int, frac)
}

/** Indian words; beyond 15 digits the recursive crore wording stops being readable, so show a dash. */
const indianWords = (digits: string) => (digits.length > 15 ? '—' : intWords(Number(digits), 'en'))

const INTL = ['', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion', 'Quintillion']
function internationalWords(digits: string): string {
  const parts: string[] = []
  for (let end = digits.length, i = 0; end > 0; end -= 3, i++) {
    const g = Number(digits.slice(Math.max(0, end - 3), end))
    if (g) parts.unshift(intWords(g, 'en') + (INTL[i] ? ' ' + INTL[i] : ''))
  }
  return parts.join(' ')
}

const DIGIT = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
function words(int: string, frac: string, spell: (d: string) => string): string {
  const head = /^0*$/.test(int) ? 'Zero' : spell(int.replace(/^0+/, ''))
  return frac ? `${head} Point ${[...frac].map((d) => DIGIT[+d]).join(' ')}` : head
}

const INDIAN_UNITS: ScaleUnit[] = ['lakh', 'crore', 'lakh crore']
const INTL_UNITS: ScaleUnit[] = ['thousand', 'million', 'billion', 'trillion']

export interface Described {
  indian: string
  international: string
  indianScale: { unit: ScaleUnit; text: string }[]
  internationalScale: { unit: ScaleUnit; text: string }[]
  wordsIndian: string
  wordsInternational: string
  /** Zeros and digit count of a whole number; undefined when the value has a fractional part. */
  zeros?: number
  digits?: number
}

export function describeAmount(value: bigint): Described {
  const { int, frac } = shiftDecimal(value, 2)
  const scaled = (units: ScaleUnit[], group: (d: string) => string) =>
    units.flatMap((unit) => {
      const s = shiftDecimal(value, EXP[unit] + 2)
      // Hide values below 0.001 of the unit (e.g. 1.5 lakh in trillion): noise, not information.
      if (s.int === '0' && s.frac.startsWith('000')) return []
      return [{ unit, text: `${join(group(s.int), s.frac)} ${unit}` }]
    })
  const whole = frac ? null : int.replace(/^0+(?=\d)/, '')
  return {
    indian: join(formatIndian(int), frac),
    international: join(formatInternational(int), frac),
    indianScale: scaled(INDIAN_UNITS, formatIndian),
    internationalScale: scaled(INTL_UNITS, formatInternational),
    wordsIndian: words(int, frac, indianWords),
    wordsInternational: words(int, frac, internationalWords),
    zeros: whole === null ? undefined : whole === '0' ? 0 : [...whole].filter((c) => c === '0').length,
    digits: whole === null ? undefined : whole.length,
  }
}
