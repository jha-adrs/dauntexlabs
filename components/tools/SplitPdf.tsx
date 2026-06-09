'use client'

// pdf-lib is dynamically imported inside the action handlers so it only
// downloads when the user actually splits a PDF — it never bloats the bundle.

import { useState } from 'react'
import { FileDrop, FilePreview, Button, Notice, Field, TextInput, Segmented, downloadBlob } from '@/components/ui/kit'

type Loaded = { name: string; bytes: number; data: ArrayBuffer; pages: number }

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

/** Parse a range string like "1-3,5,8-10" (1-based) into 0-based indices. */
function parseRanges(spec: string, count: number): number[] {
  const seen = new Set<number>()
  const order: number[] = []
  const parts = spec
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  for (const part of parts) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/)
    if (!m) throw new Error(`"${part}" is not a valid page or range.`)
    const start = parseInt(m[1], 10)
    const end = m[2] ? parseInt(m[2], 10) : start
    if (start < 1 || end < 1) throw new Error('Pages start at 1.')
    if (start > count || end > count) throw new Error(`This PDF has only ${count} page${count === 1 ? '' : 's'}.`)
    const lo = Math.min(start, end)
    const hi = Math.max(start, end)
    for (let p = lo; p <= hi; p++) {
      const idx = p - 1
      if (!seen.has(idx)) {
        seen.add(idx)
        order.push(idx)
      }
    }
  }
  if (!order.length) throw new Error('Enter at least one page, e.g. "1-3,5".')
  return order
}

export default function SplitPdf() {
  const [file, setFile] = useState<Loaded | null>(null)
  const [ranges, setRanges] = useState('')
  const [mode, setMode] = useState<'one' | 'each'>('one')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onFiles(files: File[]) {
    setError('')
    const f = files.find((x) => x.type === 'application/pdf' || x.name.toLowerCase().endsWith('.pdf'))
    if (!f) {
      setError('Please choose a PDF file.')
      return
    }
    try {
      const data = await f.arrayBuffer()
      const { PDFDocument } = await import('pdf-lib')
      const doc = await PDFDocument.load(data)
      setFile({ name: f.name, bytes: f.size, data, pages: doc.getPageCount() })
      setRanges('')
    } catch {
      setError('Could not open this PDF. A PDF may be encrypted or damaged.')
    }
  }

  function reset() {
    setFile(null)
    setRanges('')
    setError('')
  }

  async function run() {
    if (!file) {
      setError('Please choose a PDF file.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const indices = parseRanges(ranges, file.pages)
      const { PDFDocument } = await import('pdf-lib')
      const src = await PDFDocument.load(file.data)

      if (mode === 'one') {
        const out = await PDFDocument.create()
        const copied = await out.copyPages(src, indices)
        copied.forEach((p) => out.addPage(p))
        const bytes = await out.save()
        const base = file.name.replace(/\.pdf$/i, '')
        downloadBlob(bytes, `${base}-extract.pdf`, 'application/pdf')
      } else {
        for (const idx of indices) {
          const out = await PDFDocument.create()
          const [page] = await out.copyPages(src, [idx])
          out.addPage(page)
          const bytes = await out.save()
          downloadBlob(bytes, `page-${idx + 1}.pdf`, 'application/pdf')
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not split this PDF. A PDF may be encrypted or damaged.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <FileDrop
        onFiles={onFiles}
        accept="application/pdf"
        label="Drop a PDF file, or click to choose"
        hint="Split on your device · nothing is uploaded"
      />
      {error && <Notice kind="error">{error}</Notice>}

      {file && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FilePreview
            name={file.name}
            meta={`${fmtBytes(file.bytes)} · ${file.pages} page${file.pages === 1 ? '' : 's'}`}
            onRemove={reset}
          />

          <Field
            label="Pages to extract"
            hint={`1-based. Example: "1-3,5,8-10". This PDF has ${file.pages} page${file.pages === 1 ? '' : 's'}.`}
          >
            <TextInput value={ranges} onChange={setRanges} placeholder="e.g. 1-3,5,8-10" />
          </Field>

          <Field label="Output">
            <Segmented
              value={mode}
              onChange={(v) => setMode(v as 'one' | 'each')}
              options={[
                { value: 'one', label: 'Extract to one PDF' },
                { value: 'each', label: 'Each page separately' },
              ]}
            />
          </Field>

          <div className="toolbar">
            <Button variant="primary" onClick={run} disabled={busy || !ranges.trim()}>
              {busy ? 'Splitting…' : mode === 'one' ? 'Extract pages' : 'Split into files'}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
