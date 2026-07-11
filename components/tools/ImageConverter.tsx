'use client'

// Native Canvas — no libraries. Decoding an image then re-encoding through a
// canvas converts between raster formats entirely on-device (also strips EXIF).

import { useEffect, useState } from 'react'
import { FileDrop, FilePreview, Field, Select, Button, Notice, downloadBlob } from '@/components/ui/kit'

type Loaded = { name: string; url: string; bytes: number; w: number; h: number }
type Out = { url: string; bytes: number; blob: Blob }

const LOSSY = new Set(['image/jpeg', 'image/webp', 'image/avif'])

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function extFor(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/avif') return 'avif'
  return 'jpg'
}

/** Feature-detect AVIF encoding: a 1×1 canvas that actually returns image/avif. */
function detectAvif(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const c = document.createElement('canvas')
      c.width = 1
      c.height = 1
      c.toBlob((b) => resolve(!!b && b.type === 'image/avif'), 'image/avif')
    } catch {
      resolve(false)
    }
  })
}

export default function ImageConverter({ presetFormat }: { presetFormat?: string }) {
  const [img, setImg] = useState<Loaded | null>(null)
  const [format, setFormat] = useState(presetFormat ?? 'image/png')
  const [quality, setQuality] = useState(80)
  const [out, setOut] = useState<Out | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [avifOk, setAvifOk] = useState(false)

  useEffect(() => {
    let live = true
    detectAvif().then((ok) => {
      if (live) setAvifOk(ok)
    })
    return () => {
      live = false
    }
  }, [])

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

  async function convert() {
    if (!img) return
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
      canvas.width = img.w
      canvas.height = img.h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no canvas context')
      // White matte for formats without alpha so PNG transparency doesn't go black.
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(im, 0, 0)
      const q = LOSSY.has(format) ? quality / 100 : undefined
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), format, q),
      )
      if (blob.type !== format) {
        throw new Error('unsupported')
      }
      setOut({ url: URL.createObjectURL(blob), bytes: blob.size, blob })
    } catch {
      setError('Conversion failed — your browser may not support encoding to this format.')
    } finally {
      setBusy(false)
    }
  }

  const options = [
    { value: 'image/png', label: 'PNG' },
    { value: 'image/jpeg', label: 'JPG' },
    { value: 'image/webp', label: 'WebP' },
    ...(avifOk ? [{ value: 'image/avif', label: 'AVIF' }] : []),
  ]

  return (
    <>
      <FileDrop
        onFiles={onFiles}
        accept="image/*"
        label="Drop an image, or click to choose"
        hint="converted on your device — nothing is uploaded"
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
            <Field label="Convert to">
              <Select value={format} onChange={setFormat} options={options} />
            </Field>
            {LOSSY.has(format) && (
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
            <Button variant="primary" onClick={convert} disabled={busy}>
              {busy ? 'Converting…' : 'Convert'}
            </Button>
          </div>

          {!avifOk && (
            <div style={{ marginTop: 10 }}>
              <Notice kind="info">AVIF encoding isn&apos;t supported by this browser, so it&apos;s hidden.</Notice>
            </div>
          )}

          {out && (
            <div style={{ marginTop: 16 }}>
              <Notice kind="success">
                Output: {fmtBytes(out.bytes)} · {extFor(format).toUpperCase()}
              </Notice>
              <div className="toolbar" style={{ marginTop: 12 }}>
                <Button
                  variant="primary"
                  onClick={() =>
                    downloadBlob(
                      out.blob,
                      img.name.replace(/\.[^.]+$/, '') + `.${extFor(format)}`,
                      format,
                    )
                  }
                >
                  Download .{extFor(format)}
                </Button>
              </div>
              <img
                src={out.url}
                alt="converted result"
                style={{ marginTop: 12, maxWidth: '100%', border: '1px solid var(--line)' }}
              />
            </div>
          )}
        </>
      )}
    </>
  )
}
