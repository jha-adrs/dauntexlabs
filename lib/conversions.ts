// Data + logic for programmatic /convert/<from>-to-<to>/ long-tail pages.
// Isolated from the interactive tool components on purpose (no refactor risk).

export type ConvFamily = 'unit' | 'base' | 'image'

export interface UnitDef {
  key: string
  label: string // "Kilograms"
  symbol: string // "kg"
  factor: number // value_in_base = value * factor
}
interface UnitCategory {
  name: string
  special?: 'temperature'
  units: Record<string, UnitDef>
}

/* ---- unit categories (factor → each category's base unit) ---------- */
const CATEGORIES: Record<string, UnitCategory> = {
  Length: {
    name: 'Length',
    units: {
      mm: { key: 'mm', label: 'Millimeters', symbol: 'mm', factor: 0.001 },
      cm: { key: 'cm', label: 'Centimeters', symbol: 'cm', factor: 0.01 },
      m: { key: 'm', label: 'Meters', symbol: 'm', factor: 1 },
      km: { key: 'km', label: 'Kilometers', symbol: 'km', factor: 1000 },
      in: { key: 'in', label: 'Inches', symbol: 'in', factor: 0.0254 },
      ft: { key: 'ft', label: 'Feet', symbol: 'ft', factor: 0.3048 },
      yd: { key: 'yd', label: 'Yards', symbol: 'yd', factor: 0.9144 },
      mi: { key: 'mi', label: 'Miles', symbol: 'mi', factor: 1609.344 },
      nmi: { key: 'nmi', label: 'Nautical miles', symbol: 'nmi', factor: 1852 },
    },
  },
  Mass: {
    name: 'Mass',
    units: {
      mg: { key: 'mg', label: 'Milligrams', symbol: 'mg', factor: 0.001 },
      g: { key: 'g', label: 'Grams', symbol: 'g', factor: 1 },
      kg: { key: 'kg', label: 'Kilograms', symbol: 'kg', factor: 1000 },
      oz: { key: 'oz', label: 'Ounces', symbol: 'oz', factor: 28.349523125 },
      lb: { key: 'lb', label: 'Pounds', symbol: 'lb', factor: 453.59237 },
      st: { key: 'st', label: 'Stones', symbol: 'st', factor: 6350.29318 },
      t: { key: 't', label: 'Metric tons', symbol: 't', factor: 1_000_000 },
    },
  },
  Temperature: {
    name: 'Temperature',
    special: 'temperature',
    units: {
      c: { key: 'c', label: 'Celsius', symbol: '°C', factor: 1 },
      f: { key: 'f', label: 'Fahrenheit', symbol: '°F', factor: 1 },
      k: { key: 'k', label: 'Kelvin', symbol: 'K', factor: 1 },
    },
  },
  Data: {
    name: 'Data',
    units: {
      b: { key: 'b', label: 'Bytes', symbol: 'B', factor: 1 },
      kb: { key: 'kb', label: 'Kilobytes', symbol: 'KB', factor: 1024 },
      mb: { key: 'mb', label: 'Megabytes', symbol: 'MB', factor: 1024 ** 2 },
      gb: { key: 'gb', label: 'Gigabytes', symbol: 'GB', factor: 1024 ** 3 },
      tb: { key: 'tb', label: 'Terabytes', symbol: 'TB', factor: 1024 ** 4 },
    },
  },
  Speed: {
    name: 'Speed',
    units: {
      mps: { key: 'mps', label: 'Meters per second', symbol: 'm/s', factor: 1 },
      kmh: { key: 'kmh', label: 'Kilometers per hour', symbol: 'km/h', factor: 1 / 3.6 },
      mph: { key: 'mph', label: 'Miles per hour', symbol: 'mph', factor: 0.44704 },
      knot: { key: 'knot', label: 'Knots', symbol: 'kn', factor: 0.514444 },
    },
  },
  Volume: {
    name: 'Volume',
    units: {
      ml: { key: 'ml', label: 'Milliliters', symbol: 'mL', factor: 0.001 },
      l: { key: 'l', label: 'Liters', symbol: 'L', factor: 1 },
      floz: { key: 'floz', label: 'Fluid ounces', symbol: 'fl oz', factor: 0.0295735295625 },
      cup: { key: 'cup', label: 'Cups', symbol: 'cup', factor: 0.2365882365 },
      qt: { key: 'qt', label: 'Quarts', symbol: 'qt', factor: 0.946352946 },
      gal: { key: 'gal', label: 'Gallons', symbol: 'gal', factor: 3.785411784 },
    },
  },
  Area: {
    name: 'Area',
    units: {
      sqm: { key: 'sqm', label: 'Square meters', symbol: 'm²', factor: 1 },
      sqft: { key: 'sqft', label: 'Square feet', symbol: 'ft²', factor: 0.09290304 },
      sqkm: { key: 'sqkm', label: 'Square kilometers', symbol: 'km²', factor: 1e6 },
      sqmi: { key: 'sqmi', label: 'Square miles', symbol: 'mi²', factor: 2_589_988.110336 },
      acre: { key: 'acre', label: 'Acres', symbol: 'ac', factor: 4046.8564224 },
      hectare: { key: 'hectare', label: 'Hectares', symbol: 'ha', factor: 10_000 },
    },
  },
  Time: {
    name: 'Time',
    units: {
      ms: { key: 'ms', label: 'Milliseconds', symbol: 'ms', factor: 0.001 },
      s: { key: 's', label: 'Seconds', symbol: 's', factor: 1 },
      min: { key: 'min', label: 'Minutes', symbol: 'min', factor: 60 },
      h: { key: 'h', label: 'Hours', symbol: 'h', factor: 3600 },
      day: { key: 'day', label: 'Days', symbol: 'd', factor: 86_400 },
      week: { key: 'week', label: 'Weeks', symbol: 'wk', factor: 604_800 },
    },
  },
}

/* ---- number base + image formats ----------------------------------- */
const BASES: Record<string, { key: string; radix: number; label: string }> = {
  binary: { key: 'binary', radix: 2, label: 'Binary' },
  octal: { key: 'octal', radix: 8, label: 'Octal' },
  decimal: { key: 'decimal', radix: 10, label: 'Decimal' },
  hexadecimal: { key: 'hexadecimal', radix: 16, label: 'Hexadecimal' },
}
const IMAGE_FORMATS: Record<string, { key: string; label: string; mime: string; note: string }> = {
  png: { key: 'png', label: 'PNG', mime: 'image/png', note: 'lossless, supports transparency' },
  jpg: { key: 'jpg', label: 'JPG', mime: 'image/jpeg', note: 'lossy, small photos, no transparency' },
  webp: { key: 'webp', label: 'WebP', mime: 'image/webp', note: 'modern, small, supports transparency' },
}

/* ---- pair model ---------------------------------------------------- */
export interface Pair {
  slug: string // "kilograms-to-pounds"
  family: ConvFamily
  category: string // "Mass" | "Number base" | "Image format"
  fromKey: string
  toKey: string
  fromLabel: string
  toLabel: string
}

function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildPairs(): Pair[] {
  const pairs: Pair[] = []
  // unit: all ordered pairs within each category
  for (const cat of Object.values(CATEGORIES)) {
    const keys = Object.keys(cat.units)
    for (const a of keys)
      for (const b of keys)
        if (a !== b) {
          const from = cat.units[a]
          const to = cat.units[b]
          pairs.push({
            slug: `${kebab(from.label)}-to-${kebab(to.label)}`,
            family: 'unit',
            category: cat.name,
            fromKey: `${cat.name}:${a}`,
            toKey: `${cat.name}:${b}`,
            fromLabel: from.label,
            toLabel: to.label,
          })
        }
  }
  // base: all ordered pairs
  const baseKeys = Object.keys(BASES)
  for (const a of baseKeys)
    for (const b of baseKeys)
      if (a !== b)
        pairs.push({
          slug: `${a}-to-${b}`,
          family: 'base',
          category: 'Number base',
          fromKey: a,
          toKey: b,
          fromLabel: BASES[a].label,
          toLabel: BASES[b].label,
        })
  // image: png/jpg/webp ordered pairs
  const imgKeys = Object.keys(IMAGE_FORMATS)
  for (const a of imgKeys)
    for (const b of imgKeys)
      if (a !== b)
        pairs.push({
          slug: `${a}-to-${b}`,
          family: 'image',
          category: 'Image format',
          fromKey: a,
          toKey: b,
          fromLabel: IMAGE_FORMATS[a].label,
          toLabel: IMAGE_FORMATS[b].label,
        })
  return pairs
}

export const PAIRS: Pair[] = buildPairs()
const BY_SLUG = new Map(PAIRS.map((p) => [p.slug, p]))
export const getPair = (slug: string): Pair | undefined => BY_SLUG.get(slug)
export const reverseSlug = (p: Pair): string => `${kebab(p.toLabel)}-to-${kebab(p.fromLabel)}`
export const imageMime = (key: string): string => IMAGE_FORMATS[key]?.mime ?? 'image/png'

function unitDef(catUnitKey: string): { cat: UnitCategory; unit: UnitDef } {
  const [catName, uKey] = catUnitKey.split(':')
  const cat = CATEGORIES[catName]
  return { cat, unit: cat.units[uKey] }
}

/* ---- conversion + formatting --------------------------------------- */
export function formatNum(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n === 0) return '0'
  const abs = Math.abs(n)
  let s: string
  if (abs >= 1e12 || abs < 1e-4) s = n.toExponential(4)
  else s = n.toPrecision(abs >= 1 ? 7 : 4)
  // trim trailing zeros / dot
  if (s.indexOf('e') === -1 && s.indexOf('.') !== -1) s = s.replace(/\.?0+$/, '')
  return s
}

function tempTo(from: string, v: number, to: string): number {
  const c = from === 'c' ? v : from === 'f' ? ((v - 32) * 5) / 9 : v - 273.15
  return to === 'c' ? c : to === 'f' ? (c * 9) / 5 + 32 : c + 273.15
}

/** Numeric conversion for unit pairs (returns a number). */
export function convertUnit(pair: Pair, value: number): number {
  const { cat, unit: from } = unitDef(pair.fromKey)
  const { unit: to } = unitDef(pair.toKey)
  if (cat.special === 'temperature') return tempTo(from.key, value, to.key)
  return (value * from.factor) / to.factor
}

/** Base conversion (string in fromBase → string in toBase), BigInt-safe. */
export function convertBase(pair: Pair, input: string): string {
  const from = BASES[pair.fromKey].radix
  const to = BASES[pair.toKey].radix
  const clean = input.trim().toLowerCase()
  if (clean === '') return ''
  const valid = clean.split('').every((ch) => {
    const d = parseInt(ch, from)
    return !Number.isNaN(d) && d < from
  })
  if (!valid) throw new Error(`Not a valid base-${from} number`)
  let n = 0n
  const big = BigInt(from)
  for (const ch of clean) n = n * big + BigInt(parseInt(ch, from))
  return n.toString(to)
}

export function unitSymbols(pair: Pair): { from: string; to: string } {
  const { unit: from } = unitDef(pair.fromKey)
  const { unit: to } = unitDef(pair.toKey)
  return { from: from.symbol, to: to.symbol }
}

/** Human "how it works" line. */
export function formula(pair: Pair): string {
  if (pair.family === 'base') {
    return `Interpret the ${pair.fromLabel.toLowerCase()} value in base ${BASES[pair.fromKey].radix}, then express it in base ${BASES[pair.toKey].radix}.`
  }
  if (pair.family === 'image') {
    return `The image is decoded and re-encoded as ${pair.toLabel} in your browser using the Canvas API.`
  }
  const { cat, unit: from } = unitDef(pair.fromKey)
  const { unit: to } = unitDef(pair.toKey)
  const fl = from.label.toLowerCase()
  const tl = to.label.toLowerCase()
  if (cat.special === 'temperature') {
    const map: Record<string, string> = {
      'c-f': '°F = (°C × 9/5) + 32',
      'f-c': '°C = (°F − 32) × 5/9',
      'c-k': 'K = °C + 273.15',
      'k-c': '°C = K − 273.15',
      'f-k': 'K = (°F − 32) × 5/9 + 273.15',
      'k-f': '°F = (K − 273.15) × 9/5 + 32',
    }
    return map[`${from.key}-${to.key}`] ?? ''
  }
  const mult = from.factor / to.factor
  return `${tl} = ${fl} × ${formatNum(mult)}`
}

export function exampleText(pair: Pair): string {
  if (pair.family === 'unit') {
    const { unit: from } = unitDef(pair.fromKey)
    const { unit: to } = unitDef(pair.toKey)
    return `1 ${from.label.toLowerCase()} = ${formatNum(convertUnit(pair, 1))} ${to.label.toLowerCase()} (${to.symbol})`
  }
  if (pair.family === 'base') {
    return `${BASES[pair.fromKey].label} 1010 = ${convertBase(pair, convertBaseSeed(pair))} in ${pair.toLabel.toLowerCase()}`
  }
  return `Upload a ${pair.fromLabel} image and download it as ${pair.toLabel} — no upload to any server.`
}

// helper: for a base example, express decimal 10 in the fromBase as the input string
function convertBaseSeed(pair: Pair): string {
  return (10).toString(BASES[pair.fromKey].radix)
}

const UNIT_SEEDS = [1, 2, 5, 10, 25, 50, 100]
const TEMP_SEEDS = [0, 10, 20, 25, 37, 50, 100]
const BASE_SEEDS = [1, 2, 5, 8, 10, 16, 32, 64, 100, 255]

export function tableRows(pair: Pair): { in: string; out: string }[] {
  if (pair.family === 'unit') {
    const { cat } = unitDef(pair.fromKey)
    const seeds = cat.special === 'temperature' ? TEMP_SEEDS : UNIT_SEEDS
    return seeds.map((v) => ({ in: String(v), out: formatNum(convertUnit(pair, v)) }))
  }
  if (pair.family === 'base') {
    const from = BASES[pair.fromKey].radix
    const to = BASES[pair.toKey].radix
    return BASE_SEEDS.map((v) => ({ in: v.toString(from), out: v.toString(to) }))
  }
  return []
}
