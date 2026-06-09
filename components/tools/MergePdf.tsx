'use client'

// pdf-lib is dynamically imported inside merge() so it only downloads when the
// user actually merges — it never bloats the initial bundle or other pages.

import { useState } from 'react'
import { FileDrop, FilePreview, Button, Notice, downloadBlob } from '@/components/ui/kit'

type Item = { name: string; bytes: number; data: ArrayBuffer }

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export default function MergePdf() {
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onFiles(files: File[]) {
    setError('')
    const pdfs = files.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
    )
    if (!pdfs.length) {
      setError('Please choose PDF files.')
      return
    }
    const loaded = await Promise.all(
      pdfs.map(async (f) => ({ name: f.name, bytes: f.size, data: await f.arrayBuffer() })),
    )
    setItems((prev) => [...prev, ...loaded])
  }

  function move(i: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  function remove(i: number) {
    setItems((prev) => prev.filter((_, k) => k !== i))
  }

  async function merge() {
    if (items.length < 2) {
      setError('Add at least two PDFs to merge.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const { PDFDocument } = await import('pdf-lib')
      const out = await PDFDocument.create()
      for (const it of items) {
        const src = await PDFDocument.load(it.data)
        const pages = await out.copyPages(src, src.getPageIndices())
        pages.forEach((p) => out.addPage(p))
      }
      const bytes = await out.save()
      downloadBlob(bytes, 'merged.pdf', 'application/pdf')
    } catch {
      setError('Could not merge these files. A PDF may be encrypted or damaged.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <FileDrop
        onFiles={onFiles}
        accept="application/pdf"
        multiple
        label="Drop PDF files, or click to choose"
        hint="Merged on your device · nothing is uploaded"
      />
      {error && <Notice kind="error">{error}</Notice>}

      {items.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--mute-2)', fontSize: 12, width: 26 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <FilePreview name={it.name} meta={fmtBytes(it.bytes)} onRemove={() => remove(i)} />
              </div>
              <Button onClick={() => move(i, -1)} disabled={i === 0} title="Move up">
                ↑
              </Button>
              <Button onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down">
                ↓
              </Button>
            </div>
          ))}
          <div className="toolbar" style={{ marginTop: 8 }}>
            <Button variant="primary" onClick={merge} disabled={busy || items.length < 2}>
              {busy ? 'Merging…' : `Merge ${items.length} PDFs`}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
