'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  Segmented,
  Select,
  Toggle,
  Toolbar,
  IO,
  Panel,
  TextArea,
  TextInput,
  CopyButton,
  DownloadButton,
  Notice,
  Field,
} from '@/components/ui/kit'

type InputFmt  = 'csv' | 'tsv' | 'json' | 'yaml'
type OutputFmt = 'json' | 'csv'

// ─── CSV/TSV parser (handles quoted fields) ───────────────────────────────────

function parseDsv(raw: string, delimiter: string): { headers: string[]; rows: Record<string, string>[] } {
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = text.split('\n').filter(l => l.trim().length > 0)
  if (lines.length < 1) return { headers: [], rows: [] }

  function parseLine(line: string, delim: string): string[] {
    const fields: string[] = []
    let i = 0
    while (i <= line.length) {
      if (i === line.length) { fields.push(''); break }
      if (line[i] === '"') {
        i++ // skip opening quote
        let val = ''
        while (i < line.length) {
          if (line[i] === '"') {
            if (i + 1 < line.length && line[i + 1] === '"') { val += '"'; i += 2 }
            else { i++; break }
          } else { val += line[i++] }
        }
        fields.push(val)
        if (line[i] === delim) i++
        else break
      } else {
        const end = line.indexOf(delim, i)
        if (end === -1) { fields.push(line.slice(i)); break }
        else { fields.push(line.slice(i, end)); i = end + 1 }
      }
    }
    return fields
  }

  const headers = parseLine(lines[0], delimiter).map(h => h.trim())
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i], delimiter)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = vals[idx] ?? '' })
    rows.push(row)
  }
  return { headers, rows }
}

// ─── JSON array parser ────────────────────────────────────────────────────────

function parseJsonArray(raw: string): { headers: string[]; rows: Record<string, unknown>[] } {
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('JSON input must be an array of objects.')
  const seen = new Set<string>()
  for (const item of parsed) {
    if (typeof item !== 'object' || item === null || Array.isArray(item))
      throw new Error('Each JSON array element must be a plain object.')
    for (const k of Object.keys(item as object)) seen.add(k)
  }
  return { headers: Array.from(seen), rows: parsed as Record<string, unknown>[] }
}

// ─── Simple YAML list parser ──────────────────────────────────────────────────
// Supports only: top-level `- ` items, each containing `key: value` lines.
// Values are treated as strings. Does not support nested structures.

function parseSimpleYaml(raw: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = raw.split('\n')
  const rows: Record<string, string>[] = []
  const seenKeys = new Set<string>()
  let current: Record<string, string> | null = null

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '')
    const listMatch = /^- (.*)$/.exec(line)
    if (listMatch) {
      if (current) rows.push(current)
      current = {}
      // The list item may itself be a key: value
      const kvMatch = /^([^:]+):\s*(.*)$/.exec(listMatch[1].trim())
      if (kvMatch) {
        const k = kvMatch[1].trim()
        const v = kvMatch[2].trim().replace(/^['"](.*)['"]$/, '$1')
        current[k] = v
        seenKeys.add(k)
      }
    } else if (current && /^\s{2,}([^:]+):\s*(.*)$/.test(line)) {
      const kvMatch = /^\s+([^:]+):\s*(.*)$/.exec(line)
      if (kvMatch) {
        const k = kvMatch[1].trim()
        const v = kvMatch[2].trim().replace(/^['"](.*)['"]$/, '$1')
        current[k] = v
        seenKeys.add(k)
      }
    }
  }
  if (current && Object.keys(current).length > 0) rows.push(current)
  return { headers: Array.from(seenKeys), rows }
}

// ─── Output serialisers ───────────────────────────────────────────────────────

function toJson(rows: Record<string, unknown>[], pick: string[]): string {
  const out = rows.map(row => {
    const obj: Record<string, unknown> = {}
    for (const k of pick) obj[k] = k in row ? row[k] : undefined
    return obj
  })
  return JSON.stringify(out, null, 2)
}

function csvEscape(v: string): string {
  if (v.includes('"') || v.includes(',') || v.includes('\n')) return '"' + v.replace(/"/g, '""') + '"'
  return v
}

function toCsv(rows: Record<string, unknown>[], pick: string[]): string {
  const header = pick.map(csvEscape).join(',')
  const dataRows = rows.map(row =>
    pick.map(k => csvEscape(String(k in row ? (row[k] ?? '') : ''))).join(',')
  )
  return [header, ...dataRows].join('\n')
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DataPicker() {
  const [input,      setInput]      = useState('')
  const [inputFmt,   setInputFmt]   = useState<InputFmt>('csv')
  const [outputFmt,  setOutputFmt]  = useState<OutputFmt>('json')
  const [fieldText,  setFieldText]  = useState('')   // manual comma-separated list
  const [toggles,    setToggles]    = useState<Record<string, boolean>>({})

  // Parse input into rows + detected headers
  const { headers, rows, parseError } = useMemo<{
    headers: string[]
    rows: Record<string, unknown>[]
    parseError: string
  }>(() => {
    if (!input.trim()) return { headers: [], rows: [], parseError: '' }
    try {
      if (inputFmt === 'csv') {
        const { headers: h, rows: r } = parseDsv(input, ',')
        return { headers: h, rows: r as Record<string, unknown>[], parseError: '' }
      }
      if (inputFmt === 'tsv') {
        const { headers: h, rows: r } = parseDsv(input, '\t')
        return { headers: h, rows: r as Record<string, unknown>[], parseError: '' }
      }
      if (inputFmt === 'json') {
        const { headers: h, rows: r } = parseJsonArray(input)
        return { headers: h, rows: r, parseError: '' }
      }
      // yaml
      const { headers: h, rows: r } = parseSimpleYaml(input)
      if (r.length === 0) return { headers: [], rows: [], parseError: 'No YAML list items found. Ensure items start with "- ".' }
      return { headers: h, rows: r as Record<string, unknown>[], parseError: '' }
    } catch (e) {
      return { headers: [], rows: [], parseError: String(e) }
    }
  }, [input, inputFmt])

  // When headers change, sync toggles (add new, keep existing states)
  useEffect(() => {
    setToggles(prev => {
      const next: Record<string, boolean> = {}
      for (const h of headers) {
        next[h] = h in prev ? prev[h] : true // default: all on
      }
      return next
    })
  }, [headers])

  // Determine which fields are actually picked
  const pickedFields: string[] = useMemo(() => {
    const manual = fieldText.trim()
    if (manual) {
      // manual list takes precedence; intersect with known headers if possible
      const listed = manual.split(',').map(s => s.trim()).filter(Boolean)
      return listed
    }
    return headers.filter(h => toggles[h] !== false)
  }, [fieldText, headers, toggles])

  // Compute output
  const { output, outputError } = useMemo(() => {
    if (parseError) return { output: '', outputError: parseError }
    if (!rows.length) return { output: '', outputError: '' }
    if (!pickedFields.length) return { output: '', outputError: 'No fields selected.' }
    try {
      if (outputFmt === 'json') return { output: toJson(rows, pickedFields), outputError: '' }
      return { output: toCsv(rows, pickedFields), outputError: '' }
    } catch (e) {
      return { output: '', outputError: String(e) }
    }
  }, [rows, pickedFields, outputFmt, parseError])

  const outFile = outputFmt === 'json' ? 'picked.json' : 'picked.csv'
  const outMime = outputFmt === 'json' ? 'application/json' : 'text/csv'

  return (
    <>
      <Toolbar>
        <Field label="Input format">
          <Select
            value={inputFmt}
            onChange={v => setInputFmt(v as InputFmt)}
            options={[
              { value: 'csv',  label: 'CSV' },
              { value: 'tsv',  label: 'TSV' },
              { value: 'json', label: 'JSON (array of objects)' },
              { value: 'yaml', label: 'YAML (simple list)' },
            ]}
          />
        </Field>
        <Field label="Output format">
          <Segmented
            value={outputFmt}
            onChange={v => setOutputFmt(v as OutputFmt)}
            options={[
              { value: 'json', label: 'JSON' },
              { value: 'csv',  label: 'CSV'  },
            ]}
          />
        </Field>
      </Toolbar>

      {inputFmt === 'yaml' && (
        <Notice kind="info">
          YAML parsing supports a simple subset: a top-level list of <code style={{ fontFamily: 'var(--font-mono)' }}>- </code> items each containing flat <code style={{ fontFamily: 'var(--font-mono)' }}>key: value</code> lines. Nested structures, anchors, and multi-line values are not supported.
        </Notice>
      )}

      <IO>
        <Panel title="Input data">
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={
              inputFmt === 'csv'  ? 'id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com' :
              inputFmt === 'tsv'  ? 'id\tname\temail\n1\tAlice\talice@example.com' :
              inputFmt === 'json' ? '[\n  { "id": 1, "name": "Alice", "email": "alice@example.com" }\n]' :
              '- name: Alice\n  age: 30\n  email: alice@example.com\n- name: Bob\n  age: 25\n  email: bob@example.com'
            }
            rows={14}
          />
        </Panel>

        <Panel
          title="Output"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename={outFile} mime={outMime} />
            </>
          }
        >
          {outputError ? (
            <Notice kind="error">{outputError}</Notice>
          ) : (
            <TextArea value={output} readOnly placeholder="Filtered output will appear here…" rows={14} />
          )}
        </Panel>
      </IO>

      {/* Field picker section */}
      <Panel title="Pick fields">
        {headers.length === 0 ? (
          <span style={{ fontSize: '0.82rem', color: 'var(--mute)' }}>
            Paste data above to detect fields automatically.
          </span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px' }}>
              {headers.map(h => (
                <Toggle
                  key={h}
                  checked={fieldText.trim() ? true : (toggles[h] ?? true)}
                  onChange={v => {
                    if (fieldText.trim()) return // manual list active, toggles are display-only
                    setToggles(prev => ({ ...prev, [h]: v }))
                  }}
                  label={h}
                />
              ))}
            </div>
            <Field
              label="Or override with a comma-separated list"
              hint="Leave blank to use the toggles above."
            >
              <TextInput
                value={fieldText}
                onChange={setFieldText}
                placeholder="e.g. name, email, score"
              />
            </Field>
          </div>
        )}
      </Panel>
    </>
  )
}
