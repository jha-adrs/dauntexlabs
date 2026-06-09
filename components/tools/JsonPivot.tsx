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
  Notice,
  Field,
} from '@/components/ui/kit'

type Op = 'transpose' | 'keyby' | 'groupby'

const OP_OPTIONS: { value: string; label: string }[] = [
  { value: 'transpose', label: 'Transpose' },
  { value: 'keyby',     label: 'Key by field' },
  { value: 'groupby',   label: 'Group by field' },
]

/** Return the union of all keys from an array of objects. */
function detectFields(rows: Record<string, unknown>[]): string[] {
  const keys = new Set<string>()
  for (const row of rows) {
    for (const k of Object.keys(row)) keys.add(k)
  }
  return Array.from(keys)
}

function transpose(rows: Record<string, unknown>[], fields: string[]): Record<string, unknown[]> {
  const out: Record<string, unknown[]> = {}
  for (const f of fields) {
    out[f] = rows.map(r => (f in r ? r[f] : null) ?? null)
  }
  return out
}

function keyBy(
  rows: Record<string, unknown>[],
  field: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const row of rows) {
    const k = String(row[field] ?? '')
    if (k in out) {
      // duplicate → promote to array
      const existing = out[k]
      if (Array.isArray(existing)) {
        (existing as unknown[]).push(row)
      } else {
        out[k] = [existing, row]
      }
    } else {
      out[k] = row
    }
  }
  return out
}

function groupBy(
  rows: Record<string, unknown>[],
  field: string,
): Record<string, unknown[]> {
  const out: Record<string, unknown[]> = {}
  for (const row of rows) {
    const k = String(row[field] ?? '')
    if (!out[k]) out[k] = []
    out[k].push(row)
  }
  return out
}

export default function JsonPivot() {
  const [input, setInput]   = useState('')
  const [op, setOp]         = useState<Op>('transpose')
  const [fieldPick, setFieldPick] = useState('')

  // Parse input and detect fields
  const { rows, fields, parseError } = useMemo(() => {
    if (!input.trim()) return { rows: [], fields: [], parseError: '' }
    try {
      const parsed = JSON.parse(input)
      if (!Array.isArray(parsed)) return { rows: [], fields: [], parseError: 'Input must be a JSON array.' }
      const nonObjects = parsed.filter(r => typeof r !== 'object' || r === null || Array.isArray(r))
      if (nonObjects.length > 0) return { rows: [], fields: [], parseError: 'Each array element must be a plain object.' }
      const r = parsed as Record<string, unknown>[]
      const f = detectFields(r)
      return { rows: r, fields: f, parseError: '' }
    } catch (e) {
      return { rows: [], fields: [], parseError: `JSON parse error: ${String(e)}` }
    }
  }, [input])

  // Ensure fieldPick is valid when fields change
  const effectiveField = fields.includes(fieldPick) ? fieldPick : (fields[0] ?? '')

  const fieldOptions = fields.map(f => ({ value: f, label: f }))

  const { output, outputError } = useMemo(() => {
    if (parseError) return { output: '', outputError: parseError }
    if (!rows.length) return { output: '', outputError: '' }
    try {
      let result: unknown
      if (op === 'transpose') {
        result = transpose(rows, fields)
      } else if (op === 'keyby') {
        if (!effectiveField) return { output: '', outputError: 'No field available to key by.' }
        result = keyBy(rows, effectiveField)
      } else {
        if (!effectiveField) return { output: '', outputError: 'No field available to group by.' }
        result = groupBy(rows, effectiveField)
      }
      return { output: JSON.stringify(result, null, 2), outputError: '' }
    } catch (e) {
      return { output: '', outputError: String(e) }
    }
  }, [rows, fields, op, effectiveField, parseError])

  const needsField = op === 'keyby' || op === 'groupby'

  return (
    <>
      <Toolbar>
        <Segmented value={op} onChange={v => setOp(v as Op)} options={OP_OPTIONS} />
        {needsField && fieldOptions.length > 0 && (
          <Field label="Field">
            <Select
              value={effectiveField}
              onChange={v => setFieldPick(v)}
              options={fieldOptions}
            />
          </Field>
        )}
        {needsField && fieldOptions.length === 0 && (
          <span style={{ fontSize: '0.78rem', color: 'var(--mute)', alignSelf: 'center' }}>
            — paste valid JSON to see fields —
          </span>
        )}
      </Toolbar>

      <IO>
        <Panel title="Input JSON (array of objects)">
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={'[\n  { "name": "Alice", "dept": "Eng", "score": 90 },\n  { "name": "Bob",   "dept": "HR",  "score": 78 }\n]'}
            rows={14}
          />
        </Panel>

        <Panel
          title="Output JSON"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename="pivoted.json" mime="application/json" />
            </>
          }
        >
          {outputError ? (
            <Notice kind="error">{outputError}</Notice>
          ) : (
            <TextArea
              value={output}
              readOnly
              placeholder="Pivoted result will appear here…"
              rows={14}
            />
          )}
        </Panel>
      </IO>

      {!outputError && fields.length > 0 && (
        <div style={{ fontSize: '0.78rem', color: 'var(--mute)', marginTop: 8 }}>
          Detected {fields.length} field{fields.length !== 1 ? 's' : ''}:{' '}
          {fields.map((f, i) => (
            <span key={f}>
              <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-800)' }}>{f}</code>
              {i < fields.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}
    </>
  )
}
