'use client'

import { useMemo, useState } from 'react'
import {
  Segmented,
  TextInput,
  Toggle,
  Toolbar,
  IO,
  Panel,
  TextArea,
  CopyButton,
  DownloadButton,
  Notice,
  Field,
} from '@/components/ui/kit'

type Mode = 'result-csv' | 'data-insert'

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function csvEscapeField(v: string): string {
  if (v.includes('"') || v.includes(',') || v.includes('\n') || v.includes('\r')) {
    return '"' + v.replace(/"/g, '""') + '"'
  }
  return v
}

function rowsToCsv(headers: string[], rows: string[][]): string {
  const lines: string[] = [headers.map(csvEscapeField).join(',')]
  for (const row of rows) {
    lines.push(row.map(csvEscapeField).join(','))
  }
  return lines.join('\n')
}

// ─── MySQL ASCII table parser ─────────────────────────────────────────────────
// Handles: +------+-----+ border lines, | val | val | data lines, header row.
// Also falls back to tab/pipe-separated rows without borders.

function parseMysqlTable(raw: string): { headers: string[]; rows: string[][] } | null {
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  // Try MySQL-style: at least one +---+ border line exists
  const hasBorder = lines.some(l => /^\+[-+]+\+$/.test(l))

  if (hasBorder) {
    const dataLines = lines.filter(l => l.startsWith('|') && l.endsWith('|'))
    if (dataLines.length < 2) return null

    const splitRow = (line: string): string[] =>
      line
        .slice(1, -1)           // strip leading/trailing |
        .split('|')
        .map(c => c.trim())

    const headers = splitRow(dataLines[0])
    const rows = dataLines.slice(1).map(splitRow)
    return { headers, rows }
  }

  // Try tab-separated
  const tabLines = lines.filter(l => l.includes('\t'))
  if (tabLines.length >= 2) {
    const parsed = tabLines.map(l => l.split('\t').map(c => c.trim()))
    return { headers: parsed[0], rows: parsed.slice(1) }
  }

  // Try pipe-separated (without +---+ borders)
  const pipeLines = lines.filter(l => l.includes('|'))
  if (pipeLines.length >= 2) {
    const splitPipe = (line: string): string[] => {
      const stripped = line.startsWith('|') && line.endsWith('|')
        ? line.slice(1, -1)
        : line
      return stripped.split('|').map(c => c.trim())
    }
    const parsed = pipeLines.map(splitPipe)
    return { headers: parsed[0], rows: parsed.slice(1) }
  }

  return null
}

// ─── SQL value quoting ────────────────────────────────────────────────────────

function sqlValue(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed === '' || trimmed.toUpperCase() === 'NULL') return 'NULL'
  // Numeric: integer or decimal
  if (/^-?(\d+(\.\d*)?|\.\d+)$/.test(trimmed)) return trimmed
  // String: escape single-quotes
  return "'" + trimmed.replace(/'/g, "''") + "'"
}

// ─── Simple CSV parser (handles quoted fields) ────────────────────────────────

function parseCsv(raw: string): { headers: string[]; rows: string[][] } | null {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const nonEmpty = lines.filter(l => l.trim().length > 0)
  if (nonEmpty.length < 2) return null

  function parseLine(line: string): string[] {
    const fields: string[] = []
    let i = 0
    while (i < line.length) {
      if (line[i] === '"') {
        // Quoted field
        i++ // skip opening quote
        let val = ''
        while (i < line.length) {
          if (line[i] === '"') {
            if (line[i + 1] === '"') {
              val += '"'
              i += 2
            } else {
              i++ // closing quote
              break
            }
          } else {
            val += line[i++]
          }
        }
        fields.push(val)
        if (line[i] === ',') i++
      } else {
        const end = line.indexOf(',', i)
        if (end === -1) {
          fields.push(line.slice(i).trim())
          break
        } else {
          fields.push(line.slice(i, end).trim())
          i = end + 1
        }
      }
    }
    return fields
  }

  const headers = parseLine(nonEmpty[0])
  const rows = nonEmpty.slice(1).map(parseLine)
  return { headers, rows }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SqlToCsv() {
  const [mode, setMode]           = useState<Mode>('result-csv')
  const [input, setInput]         = useState('')
  const [tableName, setTableName] = useState('my_table')
  const [multiRow, setMultiRow]   = useState(false)

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      if (mode === 'result-csv') {
        // ── Result → CSV ──
        const parsed = parseMysqlTable(input)
        if (!parsed) return { output: '', error: 'Could not parse the result set. Paste a MySQL ASCII table (with +---+ borders) or tab/pipe-separated rows.' }
        const csv = rowsToCsv(parsed.headers, parsed.rows)
        return { output: csv, error: '' }
      } else {
        // ── Data → INSERT ──
        const tbl = tableName.trim() || 'table_name'
        const parsed = parseCsv(input)
        if (!parsed) return { output: '', error: 'Could not parse CSV. Make sure the first row is a header row.' }
        const { headers, rows } = parsed
        if (rows.length === 0) return { output: '', error: 'No data rows found.' }

        const colList = headers.map(h => `\`${h}\``).join(', ')

        if (multiRow) {
          const valueGroups = rows.map(row => {
            const vals = headers.map((_, i) => sqlValue(row[i] ?? ''))
            return '  (' + vals.join(', ') + ')'
          })
          const sql = `INSERT INTO \`${tbl}\` (${colList}) VALUES\n${valueGroups.join(',\n')};`
          return { output: sql, error: '' }
        } else {
          const stmts = rows.map(row => {
            const vals = headers.map((_, i) => sqlValue(row[i] ?? ''))
            return `INSERT INTO \`${tbl}\` (${colList}) VALUES (${vals.join(', ')});`
          })
          return { output: stmts.join('\n'), error: '' }
        }
      }
    } catch (e) {
      return { output: '', error: String(e) }
    }
  }, [input, mode, tableName, multiRow])

  const isInsert  = mode === 'data-insert'
  const outFile   = isInsert ? 'inserts.sql' : 'result.csv'
  const outMime   = isInsert ? 'text/plain' : 'text/csv'
  const outLabel  = isInsert ? 'download .sql' : 'download .csv'

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={v => setMode(v as Mode)}
          options={[
            { value: 'result-csv',  label: 'Result → CSV' },
            { value: 'data-insert', label: 'Data → INSERT' },
          ]}
        />
        {isInsert && (
          <>
            <Field label="Table name">
              <TextInput value={tableName} onChange={setTableName} placeholder="my_table" />
            </Field>
            <Toggle checked={multiRow} onChange={setMultiRow} label="Multi-row INSERT" />
          </>
        )}
      </Toolbar>

      <IO>
        <Panel title={isInsert ? 'Input CSV (first row = headers)' : 'SQL result set'}>
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={
              isInsert
                ? 'name,age,email\nAlice,30,alice@example.com\nBob,,\n'
                : '+-------+-----+\n| name  | age |\n+-------+-----+\n| Alice |  30 |\n+-------+-----+\n'
            }
            rows={14}
          />
        </Panel>

        <Panel
          title={isInsert ? 'INSERT statements' : 'CSV output'}
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton
                text={output}
                filename={outFile}
                mime={outMime}
                label={outLabel}
              />
            </>
          }
        >
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : (
            <TextArea value={output} readOnly placeholder="Output will appear here…" rows={14} />
          )}
        </Panel>
      </IO>

      {!isInsert && (
        <div style={{ fontSize: '0.78rem', color: 'var(--mute)', marginTop: 8 }}>
          Accepts MySQL-style <code style={{ fontFamily: 'var(--font-mono)' }}>+-----+</code> border tables, pipe-separated rows, or tab-separated rows.
        </div>
      )}
    </>
  )
}
