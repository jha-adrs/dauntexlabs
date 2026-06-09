'use client'

import { useMemo, useState } from 'react'
import {
  Segmented,
  Toolbar,
  IO,
  Panel,
  TextArea,
  CopyButton,
  DownloadButton,
  Notice,
} from '@/components/ui/kit'

// CSV field serializer (always comma-separated output)
function csvField(val: string): string {
  if (val.includes('"') || val.includes(',') || val.includes('\n') || val.includes('\r')) {
    return '"' + val.replace(/"/g, '""') + '"'
  }
  return val
}

function buildCsvRow(cells: string[]): string {
  return cells.map(csvField).join(',')
}

// Serialize any value to a string suitable for a CSV cell
function serialize(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

export default function JsonObjectToCsv() {
  const [input, setInput] = useState('')
  const [orientation, setOrientation] = useState('rows')

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      const parsed: unknown = JSON.parse(input)

      // Normalize to array of [key, value] pairs
      let pairs: [string, unknown][]

      if (Array.isArray(parsed)) {
        // Expect array of [key, value] pairs
        for (const item of parsed) {
          if (!Array.isArray(item) || item.length !== 2) {
            return {
              output: '',
              error:
                'When input is an array, each element must be a [key, value] pair (length-2 array).',
            }
          }
        }
        pairs = parsed as [string, unknown][]
      } else if (parsed !== null && typeof parsed === 'object') {
        pairs = Object.entries(parsed as Record<string, unknown>)
      } else {
        return { output: '', error: 'Input must be a JSON object or an array of [key, value] pairs.' }
      }

      if (pairs.length === 0) return { output: '', error: '' }

      let csv: string

      if (orientation === 'rows') {
        // Header row: key, value
        // Then one row per pair
        const rows: string[] = [buildCsvRow(['key', 'value'])]
        for (const [k, v] of pairs) {
          rows.push(buildCsvRow([serialize(k), serialize(v)]))
        }
        csv = rows.join('\n')
      } else {
        // columns: first row = all keys, second row = all values
        const keys = pairs.map(([k]) => serialize(k))
        const vals = pairs.map(([, v]) => serialize(v))
        csv = [buildCsvRow(keys), buildCsvRow(vals)].join('\n')
      }

      return { output: csv, error: '' }
    } catch (e) {
      return { output: '', error: `Parse error: ${e instanceof Error ? e.message : String(e)}` }
    }
  }, [input, orientation])

  return (
    <>
      <Toolbar>
        <Segmented
          value={orientation}
          onChange={setOrientation}
          options={[
            { value: 'rows', label: 'Rows (key/value per line)' },
            { value: 'columns', label: 'Columns (keys / values)' },
          ]}
        />
      </Toolbar>

      <IO>
        <Panel title="json input">
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={'Paste a JSON object {"a":1,"b":2} or [["a",1],["b",2]]…'}
            rows={14}
          />
        </Panel>
        <Panel
          title="csv output"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename="object.csv" mime="text/csv" />
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
