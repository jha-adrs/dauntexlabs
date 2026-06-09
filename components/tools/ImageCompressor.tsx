'use client'

// Native Canvas — no libraries. Re-encoding through a canvas also strips EXIF/GPS
// metadata, so the output is a clean, smaller image. All on-device.

import { useState } from 'react'
import { FileDrop, FilePreview, Field, Select, Button, Notice, downloadBlob } from '@/components/ui/kit'

type Loaded = { name: string; url: string; bytes: number; w: number; h: number }
type Out = { url: string; bytes: number; blob: Blob }

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export default function ImageCompressor() {
  const [img, setImg] = useState<Loaded | null>(null)
  const [format, setFormat] = useState('image/jpeg')
  const [quality, setQuality] = useState(70)
  const [out, setOut] = useState<Out | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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
    im.onload = () => setImg({ name: f.name, url, bytes: f.size, w: im.naturalWidth, h: im.naturalHeight })
    im.onerror = () => setError('Could not read that image.')
    im.src = url
  }

  async function compress() {
    if (!img) return
    setBusy(true)
    setError('')
    try {
      const im = new Image()
      await new Promise<void>((res, rej) => {
        im.onload = () => res()
        im.onerror = () => rej(new Error('load'))
        im.src = img.url
      })
      const canvas = document.createElement('canvas')
      canvas.width = img.w
      canvas.height = img.h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no canvas context')
      ctx.drawImage(im, 0, 0)
      const q = format === 'image/png' ? undefined : quality / 100
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), format, q),
      )
      setOut({ url: URL.createObjectURL(blob), bytes: blob.size, blob })
    } catch {
      setError('Compression failed. Your browser may not support this output format.')
    } finally {
      setBusy(false)
    }
  }

  const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg'

  return (
    <>
      <FileDrop
        onFiles={onFiles}
        accept="image/*"
        label="Drop an image, or click to choose"
        hint="JPG · PNG · WebP — processed on your device, EXIF stripped"
      />
      {error && <Notice kind="error">{error}</Notice>}

      {img && (
        <>
          <div style={{ marginTop: 14 }}>
            <FilePreview
              name={img.name}
              meta={`${img.w}×${img.h} · ${fmtBytes(img.bytes)}`}
              thumbUrl={img.url}
              onRemove={() => {
                setImg(null)
                setOut(null)
              }}
            />
          </div>

          <div className="toolbar" style={{ marginTop: 16 }}>
            <Field label="Output format">
              <Select
                value={format}
                onChange={setFormat}
                options={[
                  { value: 'image/jpeg', label: 'JPG' },
                  { value: 'image/webp', label: 'WebP' },
                  { value: 'image/png', label: 'PNG (lossless)' },
                ]}
              />
            </Field>
            {format !== 'image/png' && (
              <Field label={`Quality — ${quality}%`}>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                  style={{ accentColor: 'var(--acid)', width: 220 }}
                />
              </Field>
            )}
            <Button variant="primary" onClick={compress} disabled={busy}>
              {busy ? 'Compressing…' : 'Compress'}
            </Button>
          </div>

          {out && (
            <div style={{ marginTop: 16 }}>
              <Notice kind="success">
                {fmtBytes(img.bytes)} → {fmtBytes(out.bytes)} (
                {Math.max(0, Math.round((1 - out.bytes / img.bytes) * 100))}% smaller)
              </Notice>
              <div className="toolbar" style={{ marginTop: 12 }}>
                <Button
                  variant="primary"
                  onClick={() =>
                    downloadBlob(
                      out.blob,
                      img.name.replace(/\.[^.]+$/, '') + `-compressed.${ext}`,
                      format,
                    )
                  }
                >
                  Download
                </Button>
              </div>
              <img
                src={out.url}
                alt="compressed result"
                style={{ marginTop: 12, maxWidth: '100%', border: '1px solid var(--line)' }}
              />
            </div>
          )}
        </>
      )}
    </>
  )
}
