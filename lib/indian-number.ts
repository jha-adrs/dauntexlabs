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
const pow10 = (n: number) => 10n ** BigInt(n)

/** Parse "2.5 crore", "50k crore", "1,00,000" … into exact hundredths. null for empty input. */
export function parseAmount(text: string): ParseResult | null {
  const s = text.trim().toLowerCase()
  if (!s) return null
  if (s.startsWith('-')) return { ok: false, error: 'Negative numbers are not supported.' }
  const m = /^([\d,]*\.?\d*)\s*([a-z\s]*)$/.exec(s)
  const num = m ? m[1].replace(/,/g, '') : ''
  if (!m || !/^(\d+\.?\d*|\.\d+)$/.test(num))
    return { ok: false, error: 'Enter a number or a phrase, like 2.5 crore, 50k crore or 1,25,000.' }

  let exp = 0
  for (const word of m[2].split(/\s+/).filter(Boolean)) {
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

/** Indian words for a digit string, exact beyond 2^53 (recurses on the crore count like lib/rupees). */
function indianWords(digits: string): string {
  if (digits.length <= 15) return intWords(Number(digits), 'en')
  const high = indianWords(digits.slice(0, -7)) + ' Crore'
  const low = Number(digits.slice(-7))
  return low ? high + ' ' + intWords(low, 'en') : high
}

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
  /** Zeros in the whole-number digits (0 when the value is below 1). */
  zeros: number
}

export function describeAmount(value: bigint): Described {
  const { int, frac } = shiftDecimal(value, 2)
  const scaled = (unit: ScaleUnit, group: (d: string) => string) => {
    const s = shiftDecimal(value, EXP[unit] + 2)
    return { unit, text: `${join(group(s.int), s.frac)} ${unit}` }
  }
  return {
    indian: join(formatIndian(int), frac),
    international: join(formatInternational(int), frac),
    indianScale: INDIAN_UNITS.map((u) => scaled(u, formatIndian)),
    internationalScale: INTL_UNITS.map((u) => scaled(u, formatInternational)),
    wordsIndian: words(int, frac, indianWords),
    wordsInternational: words(int, frac, internationalWords),
    zeros: /^0*$/.test(int) ? 0 : [...int].filter((c) => c === '0').length,
  }
}
