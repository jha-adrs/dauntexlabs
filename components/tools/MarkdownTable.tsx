'use client'

import { useMemo, useState } from 'react'
import {
  Segmented,
  Select,
  Toolbar,
  IO,
  Panel,
  TextArea,
  CopyButton,
  DownloadButton,
  Field,
} from '@/components/ui/kit'

type Align = 'left' | 'center' | 'right'

const SOURCES = [
  { value: 'csv', label: 'From CSV' },
  { value: 'tsv', label: 'From TSV' },
]

const ALIGNMENTS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
]

/**
 * Parse delimited text into rows of cells. Handles RFC-4180-style quoting for
 * CSV (double-quoted fields, "" escapes, embedded delimiters/newlines). TSV is
 * parsed line-by-line with a literal tab delimiter (no quoting convention).
 */
function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0
  const n = text.length

  // Only honour quote semantics for comma-delimited data.
  const quoteAware = delimiter === ','

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  while (i < n) {
    const ch = text[i]

    if (quoteAware && inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += ch
      i++
      continue
    }

    if (quoteAware && ch === '"') {
      inQuotes = true
      i++
      continue
    }

    if (ch === delimiter) {
      pushField()
      i++
      continue
    }

    if (ch === '\r') {
      // swallow CR; the following LF (if any) ends the row
      if (text[i + 1] === '\n') {
        pushRow()
        i += 2
      } else {
        pushRow()
        i++
      }
      continue
    }

    if (ch === '\n') {
      pushRow()
      i++
      continue
    }

    field += ch
    i++
  }

  // flush trailing field/row unless the input ended on a clean row boundary
  if (field.length > 0 || row.length > 0) pushRow()

  return rows
}

/** Escape a cell for use inside a Markdown table cell. */
function escapeCell(cell: string): string {
  return cell
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>')
    .trim()
}

/** Build the alignment separator for one column at the chosen width. */
function separatorCell(width: number, align: Align): string {
  // GitHub needs at least 3 dashes; honour width for readability.
  const dashes = Math.max(3, width)
  if (align === 'center') return ':' + '-'.repeat(Math.max(1, dashes - 2)) + ':'
  if (align === 'right') return '-'.repeat(Math.max(1, dashes - 1)) + ':'
  return '-'.repeat(dashes)
}

/** Pad a cell's visible content to `width` (always left-justified text). */
function padCell(cell: string, width: number): string {
  return cell + ' '.repeat(Math.max(0, width - cell.length))
}

function buildTable(rows: string[][], align: Align): string {
  if (!rows.length) return ''

  // normalise: every row gets the same column count as the header
  const cols = rows[0].length
  const grid = rows.map((r) => {
    const cells = r.map(escapeCell)
    while (cells.length < cols) cells.push('')
    return cells.slice(0, cols)
  })

  const header = grid[0]
  const body = grid.slice(1)

  // Cell column widths: max content width over header + body (no artificial
  // floor, so tight single-char columns stay tight, e.g. "| a |"). The
  // separator row is rendered independently with the GFM-required >=3 dashes;
  // GitHub allows the separator to be wider than its data cells, so we don't
  // inflate data columns just to match it.
  const widths: number[] = []
  for (let c = 0; c < cols; c++) {
    let w = header[c]?.length ?? 0
    for (const r of body) w = Math.max(w, r[c]?.length ?? 0)
    widths[c] = Math.max(1, w)
  }

  const renderRow = (cells: string[]) =>
    '| ' + cells.map((cell, c) => padCell(cell ?? '', widths[c])).join(' | ') + ' |'

  const sepRow = '| ' + widths.map((w) => separatorCell(w, align)).join(' | ') + ' |'

  const lines = [renderRow(header), sepRow, ...body.map(renderRow)]
  return lines.join('\n')
}

export default function MarkdownTable() {
  const [source, setSource] = useState('csv')
  const [align, setAlign] = useState<Align>('left')
  const [input, setInput] = useState('')

  const output = useMemo(() => {
    if (!input.trim()) return ''
    const delimiter = source === 'tsv' ? '\t' : ','
    const rows = parseDelimited(input, delimiter)
    // drop fully-empty rows that can appear from trailing newlines
    const cleaned = rows.filter((r) => r.some((c) => c.trim() !== '') || r.length > 1)
    if (!cleaned.length) return ''
    return buildTable(cleaned, align)
  }, [input, source, align])

  return (
    <>
      <Toolbar>
        <Segmented value={source} onChange={setSource} options={SOURCES} />
        <Field label="Align">
          <Select value={align} onChange={(v) => setAlign(v as Align)} options={ALIGNMENTS} />
        </Field>
      </Toolbar>

      <IO>
        <Panel title={source === 'tsv' ? 'tsv input' : 'csv input'}>
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={
              source === 'tsv'
                ? 'name<tab>age then a row per line, e.g. Ada<tab>36'
                : 'name,age — header first, then one row per line, e.g. Ada,36'
            }
            rows={16}
          />
          <span className="hint-inline">first row is the header · {source === 'csv' ? 'quoted fields supported' : 'tab-delimited'}</span>
        </Panel>

        <Panel
          title="markdown table"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename="table.md" mime="text/markdown" />
            </>
          }
        >
          <TextArea
            value={output}
            readOnly
            placeholder="GitHub-Flavored Markdown table will appear here…"
            rows={16}
          />
        </Panel>
      </IO>
    </>
  )
}
