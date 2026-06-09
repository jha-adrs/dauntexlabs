'use client'

// pdf-lib is dynamically imported inside apply() so it only downloads when the
// user actually rebuilds the PDF — it never bloats the initial bundle.

import { useState } from 'react'
import { FileDrop, FilePreview, Button, Notice, Toggle, downloadBlob } from '@/components/ui/kit'

type Loaded = { name: string; bytes: number; data: ArrayBuffer }
type PageEntry = { index: number; rotate: number; deleted: boolean }

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export default function OrganizePdf() {
  const [file, setFile] = useState<Loaded | null>(null)
  const [pages, setPages] = useState<PageEntry[]>([])
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
      const count = doc.getPageCount()
      setFile({ name: f.name, bytes: f.size, data })
      setPages(Array.from({ length: count }, (_, i) => ({ index: i, rotate: 0, deleted: false })))
    } catch {
      setError('Could not open this PDF. A PDF may be encrypted or damaged.')
    }
  }

  function reset() {
    setFile(null)
    setPages([])
    setError('')
  }

  function move(i: number, dir: -1 | 1) {
    setPages((prev) => {
      const next = [...prev]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  function rotate(i: number) {
    setPages((prev) => prev.map((p, k) => (k === i ? { ...p, rotate: (p.rotate + 90) % 360 } : p)))
  }

  function toggleDelete(i: number) {
    setPages((prev) => prev.map((p, k) => (k === i ? { ...p, deleted: !p.deleted } : p)))
  }

  async function apply() {
    if (!file) {
      setError('Please choose a PDF file.')
      return
    }
    const keep = pages.filter((p) => !p.deleted)
    if (!keep.length) {
      setError('At least one page must remain.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const { PDFDocument, degrees } = await import('pdf-lib')
      const src = await PDFDocument.load(file.data)
      const out = await PDFDocument.create()
      const order = keep.map((p) => p.index)
      const copied = await out.copyPages(src, order)
      copied.forEach((page, k) => {
        const existing = page.getRotation().angle
        const added = keep[k].rotate
        page.setRotation(degrees((existing + added) % 360))
        out.addPage(page)
      })
      const bytes = await out.save()
      const base = file.name.replace(/\.pdf$/i, '')
      downloadBlob(bytes, `${base}-organized.pdf`, 'application/pdf')
    } catch {
      setError('Could not rebuild this PDF. A PDF may be encrypted or damaged.')
    } finally {
      setBusy(false)
    }
  }

  const remaining = pages.filter((p) => !p.deleted).length

  return (
    <>
      <FileDrop
        onFiles={onFiles}
        accept="application/pdf"
        label="Drop a PDF file, or click to choose"
        hint="Reordered on your device · nothing is uploaded"
      />
      {error && <Notice kind="error">{error}</Notice>}

      {file && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FilePreview name={file.name} meta={`${fmtBytes(file.bytes)} · ${pages.length} pages`} onRemove={reset} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pages.map((p, i) => (
              <div
                key={p.index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  background: 'var(--ink-850)',
                  opacity: p.deleted ? 0.5 : 1,
                }}
              >
                <span style={{ color: 'var(--mute-2)', fontSize: 12, width: 26 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    color: p.deleted ? 'var(--mute)' : 'var(--bone)',
                    textDecoration: p.deleted ? 'line-through' : 'none',
                  }}
                >
                  Page {p.index + 1}
                  {p.rotate ? <span style={{ color: 'var(--acid)', marginLeft: 8 }}>↻ {p.rotate}°</span> : null}
                </span>
                <Button onClick={() => move(i, -1)} disabled={i === 0 || p.deleted} title="Move up">
                  ↑
                </Button>
                <Button onClick={() => move(i, 1)} disabled={i === pages.length - 1 || p.deleted} title="Move down">
                  ↓
                </Button>
                <Button onClick={() => rotate(i)} disabled={p.deleted} title="Rotate 90°">
                  ↻ 90°
                </Button>
                <Toggle checked={p.deleted} onChange={() => toggleDelete(i)} label="delete" />
              </div>
            ))}
          </div>

          <div className="toolbar">
            <Button variant="primary" onClick={apply} disabled={busy || remaining === 0}>
              {busy ? 'Applying…' : `Apply → ${remaining} page${remaining === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
