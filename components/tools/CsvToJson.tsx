'use client'

import { useMemo, useState } from 'react'
import {
  Toggle,
  Toolbar,
  IO,
  Panel,
  TextArea,
  CopyButton,
  DownloadButton,
  Notice,
  Select,
  Field,
} from '@/components/ui/kit'

// Robust CSV parser: handles quoted fields (with embedded commas, newlines, ""-escaped quotes)
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          // escaped double-quote
          field += '"'
          i += 2
        } else {
          inQuotes = false
          i++
        }
      } else {
        field += ch
        i++
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
      } else if (text.startsWith(delimiter, i)) {
        row.push(field)
        field = ''
        i += delimiter.length
      } else if (ch === '\r' && text[i + 1] === '\n') {
        row.push(field)
        field = ''
        rows.push(row)
        row = []
        i += 2
      } else if (ch === '\n') {
        row.push(field)
        field = ''
        rows.push(row)
        row = []
        i++
      } else {
        field += ch
        i++
      }
    }
  }

  // last field / row
  row.push(field)
  if (row.some((f) => f !== '') || rows.length === 0) {
    // skip totally empty trailing row
    if (!(row.length === 1 && row[0] === '')) {
      rows.push(row)
    }
  }

  return rows
}

function inferType(val: string): unknown {
  if (val === '' || val.toLowerCase() === 'null') return null
  if (val.toLowerCase() === 'true') return true
  if (val.toLowerCase() === 'false') return false
  const n = Number(val)
  if (!isNaN(n) && val.trim() !== '') return n
  return val
}

const DELIMITERS = [
  { value: ',', label: 'Comma (,)' },
  { value: ';', label: 'Semicolon (;)' },
  { value: '\t', label: 'Tab' },
  { value: '|', label: 'Pipe (|)' },
]

export default function CsvToJson() {
  const [input, setInput] = useState('')
  const [hasHeader, setHasHeader] = useState(true)
  const [delimiter, setDelimiter] = useState(',')
  const [typeInfer, setTypeInfer] = useState(true)
  const [trimValues, setTrimValues] = useState(true)

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      const rows = parseCsv(input, delimiter)
      if (rows.length === 0) return { output: '[]', error: '' }

      let headers: string[]
      let dataRows: string[][]

      if (hasHeader) {
        headers = rows[0].map((h) => (trimValues ? h.trim() : h))
        dataRows = rows.slice(1)
      } else {
        const colCount = Math.max(...rows.map((r) => r.length))
        headers = Array.from({ length: colCount }, (_, i) => `col${i + 1}`)
        dataRows = rows
      }

      const result = dataRows.map((row) => {
        const obj: Record<string, unknown> = {}
        headers.forEach((key, i) => {
          const raw = row[i] ?? ''
          const val = trimValues ? raw.trim() : raw
          obj[key] = typeInfer ? inferType(val) : val
        })
        return obj
      })

      return { output: JSON.stringify(result, null, 2), error: '' }
    } catch (e) {
      return { output: '', error: `Parse error: ${e instanceof Error ? e.message : String(e)}` }
    }
  }, [input, hasHeader, delimiter, typeInfer, trimValues])

  return (
    <>
      <Toolbar>
        <Field label="Delimiter">
          <Select
            value={delimiter}
            onChange={setDelimiter}
            options={DELIMITERS}
          />
        </Field>
        <Toggle checked={hasHeader} onChange={setHasHeader} label="First row is header" />
        <Toggle checked={typeInfer} onChange={setTypeInfer} label="Type inference" />
        <Toggle checked={trimValues} onChange={setTrimValues} label="Trim values" />
      </Toolbar>

      <IO>
        <Panel title="csv input">
          <TextArea
            value={input}
            onChange={setInput}
            placeholder="Paste CSV here…"
            rows={14}
          />
        </Panel>
        <Panel
          title="json output"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename="data.json" mime="application/json" />
            </>
          }
        >
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : (
            <TextArea value={output} readOnly placeholder="JSON will appear here…" rows={14} />
          )}
        </Panel>
      </IO>
    </>
  )
}
