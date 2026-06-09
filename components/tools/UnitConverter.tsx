'use client'

import { useMemo, useState } from 'react'
import { Select, TextInput, Panel, IO, CopyButton, Notice, Field } from '@/components/ui/kit'

/* ---- category definitions ------------------------------------------ */

type UnitMap = Record<string, number>

const LENGTH: UnitMap = {
  m: 1,
  km: 1000,
  cm: 0.01,
  mm: 0.001,
  mi: 1609.344,
  yd: 0.9144,
  ft: 0.3048,
  in: 0.0254,
  nm: 1852,
}

const MASS: UnitMap = {
  kg: 1,
  g: 0.001,
  mg: 0.000001,
  lb: 0.45359237,
  oz: 0.028349523,
  t: 1000,
  st: 6.35029318,
}

const DATA: UnitMap = {
  B: 1,
  KB: 1024,
  MB: 1048576,
  GB: 1073741824,
  TB: 1099511627776,
  bit: 0.125,
  Kbit: 128,
  Mbit: 131072,
  Gbit: 134217728,
}

const SPEED: UnitMap = {
  'm/s': 1,
  'km/h': 1 / 3.6,
  mph: 0.44704,
  knot: 0.514444,
  'ft/s': 0.3048,
}

const AREA: UnitMap = {
  'm²': 1,
  'km²': 1e6,
  'cm²': 0.0001,
  'mm²': 0.000001,
  'ft²': 0.09290304,
  'in²': 0.00064516,
  acre: 4046.8564224,
  ha: 10000,
  'mi²': 2589988.110336,
}

const VOLUME: UnitMap = {
  L: 1,
  mL: 0.001,
  'm3': 1000,
  'cm3': 0.001,
  gal: 3.785411784,
  qt: 0.946352946,
  pt: 0.473176473,
  'fl oz': 0.02957353,
  cup: 0.2365882365,
  tsp: 0.00492892,
  tbsp: 0.01478676,
}

const TIME: UnitMap = {
  s: 1,
  ms: 0.001,
  min: 60,
  h: 3600,
  day: 86400,
  week: 604800,
  month: 2629746,
  year: 31556952,
  ns: 0.000000001,
}

/* Temperature is special-cased */
type TempUnit = 'C' | 'F' | 'K'

function toKelvin(v: number, u: TempUnit): number {
  if (u === 'C') return v + 273.15
  if (u === 'F') return (v + 459.67) * (5 / 9)
  return v
}

function fromKelvin(k: number, u: TempUnit): number {
  if (u === 'C') return k - 273.15
  if (u === 'F') return k * (9 / 5) - 459.67
  return k
}

/* ---- category registry --------------------------------------------- */

type Category = 'Length' | 'Mass' | 'Temperature' | 'Data' | 'Speed' | 'Area' | 'Volume' | 'Time'

const CATEGORIES: Category[] = [
  'Length', 'Mass', 'Temperature', 'Data', 'Speed', 'Area', 'Volume', 'Time',
]

const MAPS: Record<Exclude<Category, 'Temperature'>, UnitMap> = {
  Length: LENGTH,
  Mass: MASS,
  Data: DATA,
  Speed: SPEED,
  Area: AREA,
  Volume: VOLUME,
  Time: TIME,
}

const TEMP_UNITS: TempUnit[] = ['C', 'F', 'K']
const TEMP_LABELS: Record<TempUnit, string> = {
  C: '°C — Celsius',
  F: '°F — Fahrenheit',
  K: 'K — Kelvin',
}

function unitOptions(map: UnitMap) {
  return Object.keys(map).map((k) => ({ value: k, label: k }))
}

function formatNum(n: number): string {
  if (!isFinite(n)) return 'undefined'
  // up to 10 sig-figs, trim trailing zeros
  const s = n.toPrecision(10)
  return parseFloat(s).toString()
}

/* ---- component ----------------------------------------------------- */

export default function UnitConverter() {
  const [category, setCategory] = useState<Category>('Length')
  const [rawValue, setRawValue] = useState('1')

  // per-category from/to — stored as string keys
  const [fromUnit, setFromUnit] = useState<string>('m')
  const [toUnit, setToUnit] = useState<string>('km')
  const [tempFrom, setTempFrom] = useState<TempUnit>('C')
  const [tempTo, setTempTo] = useState<TempUnit>('F')

  // When category changes, reset from/to to first two units
  function handleCategory(c: string) {
    const cat = c as Category
    setCategory(cat)
    if (cat === 'Temperature') {
      setTempFrom('C')
      setTempTo('F')
    } else {
      const keys = Object.keys(MAPS[cat as Exclude<Category, 'Temperature'>])
      setFromUnit(keys[0] ?? '')
      setToUnit(keys[1] ?? keys[0] ?? '')
    }
  }

  const { result, ratio, error } = useMemo(() => {
    const num = parseFloat(rawValue)
    if (rawValue.trim() === '') return { result: '', ratio: '', error: '' }
    if (!isFinite(num)) return { result: '', ratio: '', error: 'Enter a valid number.' }

    if (category === 'Temperature') {
      const converted = fromKelvin(toKelvin(num, tempFrom), tempTo)
      const ratio1 = fromKelvin(toKelvin(1, tempFrom), tempTo)
      const ratioLabel = `1 ${tempFrom} = ${formatNum(ratio1)} ${tempTo}`
      return { result: formatNum(converted), ratio: ratioLabel, error: '' }
    }

    const map = MAPS[category as Exclude<Category, 'Temperature'>]
    const fromFactor = map[fromUnit]
    const toFactor = map[toUnit]
    if (fromFactor == null || toFactor == null) return { result: '', ratio: '', error: '' }

    const converted = (num * fromFactor) / toFactor
    const ratio1 = fromFactor / toFactor
    const ratioLabel = `1 ${fromUnit} = ${formatNum(ratio1)} ${toUnit}`
    return { result: formatNum(converted), ratio: ratioLabel, error: '' }
  }, [rawValue, category, fromUnit, toUnit, tempFrom, tempTo])

  const isTemp = category === 'Temperature'
  const currentMap = isTemp ? null : MAPS[category as Exclude<Category, 'Temperature'>]
  const fromOptions = isTemp
    ? TEMP_UNITS.map((u) => ({ value: u, label: TEMP_LABELS[u] }))
    : unitOptions(currentMap!)
  const toOptions = fromOptions

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Category">
        <Select
          value={category}
          onChange={handleCategory}
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
      </Field>

      <IO>
        <Panel title="from">
          <Field label="Unit">
            <Select
              value={isTemp ? tempFrom : fromUnit}
              onChange={(v) => (isTemp ? setTempFrom(v as TempUnit) : setFromUnit(v))}
              options={fromOptions}
            />
          </Field>
          <Field label="Value" hint="enter a number">
            <TextInput value={rawValue} onChange={setRawValue} type="number" />
          </Field>
        </Panel>

        <Panel
          title="to"
          actions={result ? <CopyButton text={result} /> : undefined}
        >
          <Field label="Unit">
            <Select
              value={isTemp ? tempTo : toUnit}
              onChange={(v) => (isTemp ? setTempTo(v as TempUnit) : setToUnit(v))}
              options={toOptions}
            />
          </Field>

          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.75rem',
                  color: 'var(--acid)',
                  letterSpacing: '-0.02em',
                  minHeight: '2.25rem',
                }}
              >
                {result || <span style={{ color: 'var(--mute)' }}>—</span>}
              </div>
              {ratio && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--mute)' }}>
                  {ratio}
                </span>
              )}
            </div>
          )}
        </Panel>
      </IO>
    </div>
  )
}
