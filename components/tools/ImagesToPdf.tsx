'use client'

// pdf-lib is dynamically imported inside create() so it only downloads when the
// user actually builds the PDF — it never bloats the initial bundle.

import { useEffect, useState } from 'react'
import { FileDrop, FilePreview, Button, Notice, Field, Select, downloadBlob } from '@/components/ui/kit'

type Item = { id: string; name: string; bytes: number; type: string; data: ArrayBuffer; url: string }
type Fit = 'native' | 'a4p' | 'a4l'

// A4 in PDF points (72 dpi): 595.28 x 841.89
const A4_W = 595.28
const A4_H = 841.89

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function isEmbeddable(t: string, name: string): boolean {
  const n = name.toLowerCase()
  return t === 'image/jpeg' || t === 'image/png' || n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.png')
}

function isPng(t: string, name: string): boolean {
  return t === 'image/png' || name.toLowerCase().endsWith('.png')
}

export default function ImagesToPdf() {
  const [items, setItems] = useState<Item[]>([])
  const [fit, setFit] = useState<Fit>('native')
  const [error, setError] = useState('')
  const [warn, setWarn] = useState('')
  const [busy, setBusy] = useState(false)

  // Revoke object URLs on unmount to avoid leaks.
  useEffect(() => {
    return () => {
      items.forEach((it) => URL.revokeObjectURL(it.url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onFiles(files: File[]) {
    setError('')
    setWarn('')
    const images = files.filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp)$/i.test(f.name))
    if (!images.length) {
      setError('Please choose image files.')
      return
    }
    const skipped = images.filter((f) => !isEmbeddable(f.type, f.name))
    if (skipped.length) {
      setWarn(`Only JPG and PNG can be embedded. Skipping: ${skipped.map((s) => s.name).join(', ')}.`)
    }
    const usable = images.filter((f) => isEmbeddable(f.type, f.name))
    const loaded = await Promise.all(
      usable.map(async (f) => ({
        id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2)}`,
        name: f.name,
        bytes: f.size,
        type: f.type,
        data: await f.arrayBuffer(),
        url: URL.createObjectURL(f),
      })),
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
    setItems((prev) => {
      const target = prev[i]
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((_, k) => k !== i)
    })
  }

  async function create() {
    if (!items.length) {
      setError('Add at least one image.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const { PDFDocument } = await import('pdf-lib')
      const doc = await PDFDocument.create()
      for (const it of items) {
        const img = isPng(it.type, it.name) ? await doc.embedPng(it.data) : await doc.embedJpg(it.data)
        const iw = img.width
        const ih = img.height

        if (fit === 'native') {
          const page = doc.addPage([iw, ih])
          page.drawImage(img, { x: 0, y: 0, width: iw, height: ih })
        } else {
          const pw = fit === 'a4l' ? A4_H : A4_W
          const ph = fit === 'a4l' ? A4_W : A4_H
          const page = doc.addPage([pw, ph])
          const scale = Math.min(pw / iw, ph / ih)
          const w = iw * scale
          const h = ih * scale
          page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h })
        }
      }
      const bytes = await doc.save()
      downloadBlob(bytes, 'images.pdf', 'application/pdf')
    } catch {
      setError('Could not build the PDF. An image may be damaged or in an unsupported format.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <FileDrop
        onFiles={onFiles}
        accept="image/*"
        multiple
        label="Drop images (JPG / PNG), or click to choose"
        hint="Converted on your device · nothing is uploaded"
      />
      {error && <Notice kind="error">{error}</Notice>}
      {warn && <Notice kind="info">{warn}</Notice>}

      {items.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((it, i) => (
              <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--mute-2)', fontSize: 12, width: 26 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FilePreview name={it.name} meta={fmtBytes(it.bytes)} thumbUrl={it.url} onRemove={() => remove(i)} />
                </div>
                <Button onClick={() => move(i, -1)} disabled={i === 0} title="Move up">
                  ↑
                </Button>
                <Button onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down">
                  ↓
                </Button>
              </div>
            ))}
          </div>

          <Field label="Page fit">
            <Select
              value={fit}
              onChange={(v) => setFit(v as Fit)}
              options={[
                { value: 'native', label: 'Fit image size' },
                { value: 'a4p', label: 'A4 portrait' },
                { value: 'a4l', label: 'A4 landscape' },
              ]}
            />
          </Field>

          <div className="toolbar">
            <Button variant="primary" onClick={create} disabled={busy}>
              {busy ? 'Creating…' : `Create PDF (${items.length} image${items.length === 1 ? '' : 's'})`}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
