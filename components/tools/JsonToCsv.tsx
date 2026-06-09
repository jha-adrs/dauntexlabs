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

// Flatten a nested object with dotted key paths. Arrays become JSON strings.
function flattenObject(obj: unknown, prefix = ''): Record<string, unknown> {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return { [prefix]: obj }
  }
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flattenObject(v, key))
    } else {
      result[key] = v
    }
  }
  return result
}

// CSV field serializer: quotes a field if needed
function csvField(val: string, delimiter: string): string {
  if (val.includes('"') || val.includes(delimiter) || val.includes('\n') || val.includes('\r')) {
    return '"' + val.replace(/"/g, '""') + '"'
  }
  return val
}

// Build a CSV string from rows (array of string arrays) with a given delimiter
function buildCsv(rows: string[][], delimiter: string): string {
  return rows
    .map((row) => row.map((cell) => csvField(cell, delimiter)).join(delimiter))
    .join('\n')
}

const DELIMITERS = [
  { value: ',', label: 'Comma (,)' },
  { value: ';', label: 'Semicolon (;)' },
  { value: '\t', label: 'Tab' },
  { value: '|', label: 'Pipe (|)' },
]

export default function JsonToCsv() {
  const [input, setInput] = useState('')
  const [delimiter, setDelimiter] = useState(',')
  const [includeHeader, setIncludeHeader] = useState(true)
  const [flatten, setFlatten] = useState(false)

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      let parsed: unknown = JSON.parse(input)

      // Wrap single object in array
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        parsed = [parsed]
      }

      if (!Array.isArray(parsed)) {
        return { output: '', error: 'Input must be a JSON array of objects or a single object.' }
      }

      if (parsed.length === 0) return { output: '', error: '' }

      // Process each row
      const processedRows: Record<string, unknown>[] = parsed.map((item) => {
        if (item === null || typeof item !== 'object' || Array.isArray(item)) {
          return { value: item }
        }
        return flatten
          ? flattenObject(item as Record<string, unknown>)
          : (item as Record<string, unknown>)
      })

      // Union of all keys (preserving insertion order)
      const keySet = new Set<string>()
      for (const row of processedRows) {
        for (const k of Object.keys(row)) keySet.add(k)
      }
      const columns = Array.from(keySet)

      const dataRows: string[][] = processedRows.map((row) =>
        columns.map((col) => {
          const val = row[col]
          if (val === null || val === undefined) return ''
          if (typeof val === 'object') return JSON.stringify(val)
          return String(val)
        })
      )

      const rows: string[][] = includeHeader ? [columns, ...dataRows] : dataRows
      return { output: buildCsv(rows, delimiter), error: '' }
    } catch (e) {
      return { output: '', error: `Parse error: ${e instanceof Error ? e.message : String(e)}` }
    }
  }, [input, delimiter, includeHeader, flatten])

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
        <Toggle checked={includeHeader} onChange={setIncludeHeader} label="Include header row" />
        <Toggle checked={flatten} onChange={setFlatten} label="Flatten nested objects" />
      </Toolbar>

      <IO>
        <Panel title="json input">
          <TextArea
            value={input}
            onChange={setInput}
            placeholder='Paste JSON array (or single object) here…'
            rows={14}
          />
        </Panel>
        <Panel
          title="csv output"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename="data.csv" mime="text/csv" />
            </>
          }
        >
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : (
            <TextArea value={output} readOnly placeholder="CSV will appear here…" rows={14} />
          )}
        </Panel>
      </IO>
    </>
  )
}
