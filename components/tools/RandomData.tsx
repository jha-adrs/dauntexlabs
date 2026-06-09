'use client'

import { useState } from 'react'
import {
  Button,
  CopyButton,
  DownloadButton,
  Field,
  TextArea,
  TextInput,
  Select,
  Toggle,
  Toolbar,
  IO,
  Panel,
} from '@/components/ui/kit'

/* ── helpers ─────────────────────────────────────────────────────────────── */

function randInt(min: number, max: number): number {
  const range = max - min + 1
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return min + (arr[0] % range)
}

function randFloat(min: number, max: number): number {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return min + (arr[0] / 0xffffffff) * (max - min)
}

function pickFrom<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]
}

function randString(length: number, charset: string): string {
  const out: string[] = []
  const bytes = new Uint8Array(length * 2)
  crypto.getRandomValues(bytes)
  let bi = 0
  while (out.length < length) {
    out.push(charset[bytes[bi++ % bytes.length] % charset.length])
  }
  return out.join('')
}

const CHARSETS: Record<string, string> = {
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  hex: '0123456789abcdef',
  digits: '0123456789',
  'base64-ish': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
}

const WORDS = [
  'apple', 'bridge', 'canvas', 'delta', 'ember', 'falcon', 'grove', 'harbor',
  'index', 'jewel', 'kite', 'lantern', 'maple', 'nexus', 'orbit', 'prism',
  'quartz', 'ridge', 'spiral', 'tundra', 'umbra', 'valley', 'winter', 'xenon',
  'yonder', 'zenith', 'amber', 'brook', 'crystal', 'dusk', 'echo', 'frost',
  'gale', 'haven', 'iris', 'jade', 'knoll', 'lunar',
]

const FIRST_NAMES = [
  'Alice', 'Bob', 'Carol', 'David', 'Elena', 'Frank', 'Grace', 'Hiro',
  'Iris', 'James', 'Kira', 'Liam', 'Maya', 'Noah', 'Olivia', 'Paulo',
  'Quinn', 'Rosa', 'Sam', 'Tara', 'Uma', 'Victor', 'Wendy', 'Xander',
  'Yuki', 'Zoe',
]

const LAST_NAMES = [
  'Adams', 'Baker', 'Chen', 'Diaz', 'Evans', 'Foster', 'Garcia', 'Hayes',
  'Iyer', 'Jones', 'Kim', 'Lopez', 'Miller', 'Nguyen', 'Ortiz', 'Patel',
  'Quinn', 'Ramos', 'Smith', 'Torres', 'Ueda', 'Vargas', 'Wang', 'Xavier',
  'Young', 'Zhang',
]

const DOMAINS = [
  'example.com', 'testmail.io', 'fakemail.net', 'devtest.org',
  'sample.co', 'mailtest.dev', 'dummybox.io',
]

function uuidv4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b).map((x) => x.toString(16).padStart(2, '0'))
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10).join('')}`
}

function randDate(start: Date, end: Date): string {
  const t = randFloat(start.getTime(), end.getTime())
  return new Date(Math.round(t)).toISOString()
}

function randJsonObject(): Record<string, unknown> {
  const first = pickFrom(FIRST_NAMES)
  const last = pickFrom(LAST_NAMES)
  return {
    id: uuidv4(),
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${randInt(1, 99)}@${pickFrom(DOMAINS)}`,
    age: randInt(18, 75),
    active: randInt(0, 1) === 1,
    score: parseFloat(randFloat(0, 100).toFixed(2)),
    createdAt: randDate(new Date('2020-01-01'), new Date()),
  }
}

/* ── types & options ─────────────────────────────────────────────────────── */

type DataType = 'string' | 'number' | 'words' | 'name' | 'email' | 'boolean' | 'date' | 'uuid' | 'json'

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'words', label: 'Word(s)' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'uuid', label: 'UUID' },
  { value: 'json', label: 'JSON Object' },
]

const CHARSET_OPTIONS = [
  { value: 'alphanumeric', label: 'Alphanumeric' },
  { value: 'alpha', label: 'Alpha only' },
  { value: 'hex', label: 'Hex' },
  { value: 'digits', label: 'Digits only' },
  { value: 'base64-ish', label: 'Base64-ish' },
]

/* ── component ──────────────────────────────────────────────────────────── */

export default function RandomData() {
  const [dataType, setDataType] = useState<DataType>('string')
  const [count, setCount] = useState('10')

  // String options
  const [strLen, setStrLen] = useState('12')
  const [charset, setCharset] = useState('alphanumeric')

  // Number options
  const [numMin, setNumMin] = useState('0')
  const [numMax, setNumMax] = useState('1000')
  const [isInt, setIsInt] = useState(true)

  // Date options
  const [dateStart, setDateStart] = useState('2020-01-01')
  const [dateEnd, setDateEnd] = useState('2025-12-31')

  const [output, setOutput] = useState('')

  function generate() {
    const n = Math.max(1, Math.min(1000, parseInt(count) || 10))
    const items: string[] = []

    for (let i = 0; i < n; i++) {
      switch (dataType) {
        case 'string': {
          const len = Math.max(1, Math.min(256, parseInt(strLen) || 12))
          items.push(randString(len, CHARSETS[charset]))
          break
        }
        case 'number': {
          const mn = parseFloat(numMin) || 0
          const mx = parseFloat(numMax) || 1000
          const lo = Math.min(mn, mx)
          const hi = Math.max(mn, mx)
          items.push(isInt ? String(randInt(Math.ceil(lo), Math.floor(hi))) : randFloat(lo, hi).toFixed(4))
          break
        }
        case 'words': {
          const wc = randInt(1, 4)
          items.push(Array.from({ length: wc }, () => pickFrom(WORDS)).join(' '))
          break
        }
        case 'name': {
          items.push(`${pickFrom(FIRST_NAMES)} ${pickFrom(LAST_NAMES)}`)
          break
        }
        case 'email': {
          const first = pickFrom(FIRST_NAMES).toLowerCase()
          const last = pickFrom(LAST_NAMES).toLowerCase()
          items.push(`${first}.${last}${randInt(1, 99)}@${pickFrom(DOMAINS)}`)
          break
        }
        case 'boolean': {
          items.push(randInt(0, 1) === 1 ? 'true' : 'false')
          break
        }
        case 'date': {
          const s = new Date(dateStart || '2020-01-01')
          const e = new Date(dateEnd || '2025-12-31')
          const lo2 = isNaN(s.getTime()) ? new Date('2020-01-01') : s
          const hi2 = isNaN(e.getTime()) ? new Date('2025-12-31') : e
          items.push(randDate(lo2, hi2))
          break
        }
        case 'uuid': {
          items.push(uuidv4())
          break
        }
        case 'json': {
          items.push(JSON.stringify(randJsonObject(), null, 2))
          break
        }
      }
    }

    if (dataType === 'json') {
      setOutput(JSON.stringify(items.map((s) => JSON.parse(s)), null, 2))
    } else {
      setOutput(items.join('\n'))
    }
  }

  const isJson = dataType === 'json'
  const fileExt = isJson ? 'json' : 'txt'
  const fileMime = isJson ? 'application/json' : 'text/plain'

  return (
    <>
      <Toolbar>
        <Field label="Type">
          <Select value={dataType} onChange={(v) => setDataType(v as DataType)} options={TYPE_OPTIONS} />
        </Field>
        <Field label="Count">
          <TextInput value={count} onChange={setCount} type="number" placeholder="10" />
        </Field>

        {dataType === 'string' && (
          <>
            <Field label="Length">
              <TextInput value={strLen} onChange={setStrLen} type="number" placeholder="12" />
            </Field>
            <Field label="Charset">
              <Select value={charset} onChange={setCharset} options={CHARSET_OPTIONS} />
            </Field>
          </>
        )}

        {dataType === 'number' && (
          <>
            <Field label="Min">
              <TextInput value={numMin} onChange={setNumMin} type="number" placeholder="0" />
            </Field>
            <Field label="Max">
              <TextInput value={numMax} onChange={setNumMax} type="number" placeholder="1000" />
            </Field>
            <Toggle checked={isInt} onChange={setIsInt} label="Integer" />
          </>
        )}

        {dataType === 'date' && (
          <>
            <Field label="From">
              <TextInput value={dateStart} onChange={setDateStart} placeholder="2020-01-01" />
            </Field>
            <Field label="To">
              <TextInput value={dateEnd} onChange={setDateEnd} placeholder="2025-12-31" />
            </Field>
          </>
        )}
      </Toolbar>

      <div style={{ margin: '12px 0' }}>
        <Button variant="primary" onClick={generate}>
          Generate
        </Button>
      </div>

      <IO>
        <Panel
          title="output"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename={`random-data.${fileExt}`} mime={fileMime} />
            </>
          }
        >
          <TextArea
            value={output}
            readOnly
            placeholder="Click Generate to produce random data…"
            rows={16}
          />
        </Panel>
      </IO>
    </>
  )
}
