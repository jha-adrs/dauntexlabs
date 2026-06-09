'use client'

// Native Canvas — no libraries. Resize by drawing the source image onto a
// target-sized canvas, then re-encode. Entirely on-device.

import { useState } from 'react'
import { FileDrop, FilePreview, Field, TextInput, Toggle, Button, Notice, downloadBlob } from '@/components/ui/kit'

type Loaded = { name: string; type: string; url: string; bytes: number; w: number; h: number }
type Out = { url: string; bytes: number; blob: Blob; w: number; h: number }

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

// Keep the source format when we can encode it; otherwise fall back to PNG.
function outMime(srcType: string): string {
  if (srcType === 'image/jpeg' || srcType === 'image/webp' || srcType === 'image/png') return srcType
  return 'image/png'
}
function extFor(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  return 'png'
}

export default function ImageResizer() {
  const [img, setImg] = useState<Loaded | null>(null)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [lock, setLock] = useState(true)
  const [out, setOut] = useState<Out | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function reset() {
    setImg(null)
    setOut(null)
    setWidth('')
    setHeight('')
  }

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f) return
    setError('')
    setOut(null)
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    const url = URL.createObjectURL(f)
    const im = new Image()
    im.onload = () => {
      setImg({ name: f.name, type: f.type, url, bytes: f.size, w: im.naturalWidth, h: im.naturalHeight })
      setWidth(String(im.naturalWidth))
      setHeight(String(im.naturalHeight))
    }
    im.onerror = () => setError('Could not read that image.')
    im.src = url
  }

  function changeWidth(v: string) {
    setWidth(v)
    if (lock && img) {
      const n = parseInt(v, 10)
      if (n > 0) setHeight(String(Math.max(1, Math.round((n * img.h) / img.w))))
    }
  }

  function changeHeight(v: string) {
    setHeight(v)
    if (lock && img) {
      const n = parseInt(v, 10)
      if (n > 0) setWidth(String(Math.max(1, Math.round((n * img.w) / img.h))))
    }
  }

  function scaleTo(pct: number) {
    if (!img) return
    const w = Math.max(1, Math.round((img.w * pct) / 100))
    const h = Math.max(1, Math.round((img.h * pct) / 100))
    setWidth(String(w))
    setHeight(String(h))
  }

  async function resize() {
    if (!img) return
    const w = parseInt(width, 10)
    const h = parseInt(height, 10)
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      setError('Width and height must be positive whole numbers.')
      return
    }
    setBusy(true)
    setError('')
    setOut(null)
    try {
      const im = new Image()
      await new Promise<void>((res, rej) => {
        im.onload = () => res()
        im.onerror = () => rej(new Error('load'))
        im.src = img.url
      })
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no canvas context')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      const mime = outMime(img.type)
      if (mime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
      }
      ctx.drawImage(im, 0, 0, w, h)
      const q = mime === 'image/png' ? undefined : 0.92
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), mime, q),
      )
      setOut({ url: URL.createObjectURL(blob), bytes: blob.size, blob, w, h })
    } catch {
      setError('Resize failed. The target dimensions may be too large for this browser.')
    } finally {
      setBusy(false)
    }
  }

  const mime = img ? outMime(img.type) : 'image/png'

  return (
    <>
      <FileDrop
        onFiles={onFiles}
        accept="image/*"
        label="Drop an image, or click to choose"
        hint="resized on your device — nothing is uploaded"
      />
      {error && <Notice kind="error">{error}</Notice>}

      {img && (
        <>
          <div style={{ marginTop: 14 }}>
            <FilePreview
              name={img.name}
              meta={`original ${img.w}×${img.h} · ${fmtBytes(img.bytes)}`}
              thumbUrl={img.url}
              onRemove={reset}
            />
          </div>

          <div className="toolbar" style={{ marginTop: 16 }}>
            <Field label="Width (px)">
              <TextInput type="number" value={width} onChange={changeWidth} />
            </Field>
            <Field label="Height (px)">
              <TextInput type="number" value={height} onChange={changeHeight} />
            </Field>
            <Toggle checked={lock} onChange={setLock} label="Lock aspect ratio" />
          </div>

          <div className="toolbar" style={{ marginTop: 8 }}>
            <span className="hint-inline">Quick scale:</span>
            {[25, 50, 75, 200].map((p) => (
              <Button key={p} onClick={() => scaleTo(p)}>
                {p}%
              </Button>
            ))}
            <Button onClick={() => scaleTo(100)}>reset</Button>
          </div>

          <div className="toolbar" style={{ marginTop: 12 }}>
            <Button variant="primary" onClick={resize} disabled={busy}>
              {busy ? 'Resizing…' : 'Resize'}
            </Button>
          </div>

          {out && (
            <div style={{ marginTop: 16 }}>
              <Notice kind="success">
                {out.w}×{out.h} · {fmtBytes(out.bytes)} · {extFor(mime).toUpperCase()}
              </Notice>
              <div className="toolbar" style={{ marginTop: 12 }}>
                <Button
                  variant="primary"
                  onClick={() =>
                    downloadBlob(
                      out.blob,
                      img.name.replace(/\.[^.]+$/, '') + `-${out.w}x${out.h}.${extFor(mime)}`,
                      mime,
                    )
                  }
                >
                  Download
                </Button>
              </div>
              <img
                src={out.url}
                alt="resized result"
                style={{ marginTop: 12, maxWidth: '100%', border: '1px solid var(--line)' }}
              />
            </div>
          )}
        </>
      )}
    </>
  )
}
