'use client'

// One upload (photo, signature, thumb, declaration): load → crop → make a JPG
// inside the KB range → checklist → download. Native Canvas only. Images and
// results live in object URLs that are revoked on replace, remove and unmount.

import { useEffect, useRef, useState } from 'react'
import { FileDrop, FilePreview, Field, TextInput, Toggle, Button, Notice, downloadBlob } from '@/components/ui/kit'
import { byteBounds, checkOutput, cropRect, fitToBounds, targetSize, whiten, DEFAULT_DPI, type Check } from '@/lib/photo-fit'
import { fitText, formatDateIN, layoutStamp } from '@/lib/stamp'
import type { Upload } from '@/lib/photo-presets'

type Loaded = { name: string; url: string; el: HTMLImageElement; w: number; h: number }
type Result = { bytes: Uint8Array; url: string; width: number; height: number; padded: boolean; scaled: boolean; checks: Check[] }

const FONT = 'sans-serif'
const DEFAULT_STRIP_PCT = 18

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const rangeStyle = { accentColor: 'var(--accent)', width: 180 }

export default function FitSection({
  upload,
  fileName,
  label,
  disabled = false,
}: {
  upload: Upload
  fileName: string
  label: string
  disabled?: boolean
}) {
  const [img, setImg] = useState<Loaded | null>(null)
  const [zoom, setZoom] = useState(1)
  const [ox, setOx] = useState(0)
  const [oy, setOy] = useState(0)
  const [whiteOn, setWhiteOn] = useState(!!upload.whiteBg)
  const [strength, setStrength] = useState(50)
  const [stripOn, setStripOn] = useState(!!upload.nameDate)
  const [name, setName] = useState('')
  const [date, setDate] = useState(todayISO)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const urls = useRef(new Set<string>())
  // Bumped whenever an in-flight make becomes stale (settings change, remove, unmount).
  const gen = useRef(0)

  const isPhoto = upload.type === 'photo'
  const strip = isPhoto && stripOn
  const dateText = formatDateIN(date)
  const specKey = JSON.stringify([upload.px, upload.width, upload.kb, upload.dpi])

  useEffect(() => {
    const set = urls.current
    const g = gen
    return () => {
      g.current++
      set.forEach((u) => URL.revokeObjectURL(u))
      set.clear()
    }
  }, [])

  function drop(url: string) {
    URL.revokeObjectURL(url)
    urls.current.delete(url)
  }

  function clearResult() {
    setResult((r) => {
      if (r) drop(r.url)
      return null
    })
  }

  // Any change to the input or its settings makes the last result stale.
  useEffect(() => {
    gen.current++
    clearResult()
  }, [img, zoom, ox, oy, whiteOn, strength, strip, name, date, specKey, disabled]) // eslint-disable-line react-hooks/exhaustive-deps

  function load(files: File[]) {
    const f = files[0]
    if (!f) return
    setError('')
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG or WebP).')
      return
    }
    const url = URL.createObjectURL(f)
    urls.current.add(url)
    const el = new Image()
    el.onload = () => {
      setImg((prev) => {
        if (prev) drop(prev.url)
        return { name: f.name, url, el, w: el.naturalWidth, h: el.naturalHeight }
      })
      setZoom(1)
      setOx(0)
      setOy(0)
    }
    el.onerror = () => {
      drop(url)
      setError('Could not read that image. iPhone HEIC photos need converting to JPG first.')
    }
    el.src = url
  }

  function remove() {
    gen.current++
    if (img) drop(img.url)
    setImg(null)
    setError('')
  }

  /** Paint the output at w × h: white fill, crop, optional whitening, optional name/date strip. */
  function paint(canvas: HTMLCanvasElement, w: number, h: number) {
    if (!img) return
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas')
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    const stripPct = strip
      ? upload.nameDate && upload.px
        ? (upload.nameDate.stripPx * 100) / upload.px[1]
        : DEFAULT_STRIP_PCT
      : 0
    const layout = layoutStamp({ width: w, height: h, stripPct })
    const box = layout.photo
    const c = cropRect(img.w, img.h, box.w, box.h, zoom, ox, oy)
    ctx.drawImage(img.el, c.sx, c.sy, c.sw, c.sh, box.x, box.y, box.w, box.h)
    if (whiteOn && strength > 0) {
      const data = ctx.getImageData(box.x, box.y, box.w, box.h)
      if (data && data.data) {
        whiten(data.data, strength)
        ctx.putImageData(data, box.x, box.y)
      }
    }
    if (layout.strip) {
      const st = layout.strip
      const lines = [name.trim(), dateText].filter(Boolean)
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const lineH = st.h / Math.max(lines.length, 1)
      const measure = (t: string, px: number) => {
        ctx.font = `600 ${px}px ${FONT}`
        return ctx.measureText(t)?.width ?? 0
      }
      lines.forEach((t, i) => {
        const px = fitText(measure, t, st.w * 0.92, Math.max(8, Math.floor(lineH * 0.72)), 6)
        ctx.font = `600 ${px}px ${FONT}`
        ctx.fillText(t, st.x + st.w / 2, st.y + lineH * i + lineH / 2)
      })
    }
  }

  const size = img ? targetSize(upload, img.w, img.h) : null

  // Live preview at the exact output size.
  useEffect(() => {
    if (!img || !size || !previewRef.current) return
    try {
      paint(previewRef.current, size[0], size[1])
    } catch {
      /* preview only */
    }
  }, [img, zoom, ox, oy, whiteOn, strength, strip, name, dateText, size?.[0], size?.[1]]) // eslint-disable-line react-hooks/exhaustive-deps

  async function make() {
    if (!img || !size) return
    setError('')
    clearResult()
    setBusy(true)
    const myGen = gen.current
    const dpi = upload.dpi ?? DEFAULT_DPI
    try {
      const canvas = document.createElement('canvas')
      const render = (w: number, h: number) => {
        paint(canvas, w, h)
        return (q: number) =>
          new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', q))
      }
      const fixedPx = !!(upload.px || upload.width)
      const r = await fitToBounds(render, size, byteBounds(upload.kb), { fixedPx, dpi })
      // Settings changed, file removed or section unmounted while encoding: this result is stale.
      if (gen.current !== myGen) return
      if (!r.ok) {
        setError(
          `This file can’t get under ${upload.kb[1]} KB at ${size[0]} × ${size[1]} px. Try a plainer background or zoom in closer.`,
        )
        return
      }
      const url = URL.createObjectURL(new Blob([r.bytes as BlobPart], { type: 'image/jpeg' }))
      urls.current.add(url)
      setResult({
        bytes: r.bytes,
        url,
        width: r.width,
        height: r.height,
        padded: r.padded,
        scaled: r.scaled,
        checks: checkOutput(r.bytes, r.width, r.height, upload),
      })
    } catch {
      setError('Could not create the JPEG in this browser.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label={label} style={{ marginTop: 18 }}>
      <h3 style={{ margin: '0 0 4px' }}>{label}</h3>
      {upload.note && <p style={{ color: 'var(--mute)', margin: '0 0 10px' }}>{upload.note}</p>}

      {!img ? (
        <FileDrop
          onFiles={load}
          accept="image/*"
          label={`Drop your ${label.toLowerCase()}, or click to choose`}
          hint="JPG · PNG · WebP — processed on your device"
        />
      ) : (
        <>
          <FilePreview name={img.name} meta={`${img.w}×${img.h}`} thumbUrl={img.url} onRemove={remove} />

          <div style={{ marginTop: 12 }}>
            <span className="field-label">Output preview{size ? ` — ${size[0]} × ${size[1]} px` : ''}</span>
            <canvas
              ref={previewRef}
              aria-label="Output preview"
              style={{
                display: 'block',
                marginTop: 6,
                maxWidth: '100%',
                maxHeight: 320,
                height: 'auto',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-soft)',
              }}
            />
          </div>

          <div className="toolbar" style={{ marginTop: 12 }}>
            <Field label="Zoom">
              <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(+e.target.value)} style={rangeStyle} />
            </Field>
            <Field label="Move left/right">
              <input type="range" min={-1} max={1} step={0.02} value={ox} onChange={(e) => setOx(+e.target.value)} style={rangeStyle} />
            </Field>
            <Field label="Move up/down">
              <input type="range" min={-1} max={1} step={0.02} value={oy} onChange={(e) => setOy(+e.target.value)} style={rangeStyle} />
            </Field>
          </div>

          <div className="toolbar" style={{ marginTop: 8 }}>
            <Toggle checked={whiteOn} onChange={setWhiteOn} label="Whiten background" />
            {whiteOn && (
              <Field label="Whitening strength">
                <input type="range" min={0} max={100} value={strength} onChange={(e) => setStrength(+e.target.value)} style={rangeStyle} />
              </Field>
            )}
            {isPhoto && <Toggle checked={stripOn} onChange={setStripOn} label="Name and date strip" />}
          </div>

          {strip && (
            <div className="toolbar" style={{ marginTop: 8 }}>
              <Field label="Name">
                <TextInput value={name} onChange={setName} placeholder="Name as on the form" />
              </Field>
              <Field label="Date" hint={dateText ? `Shows as ${dateText}` : undefined}>
                <input className="inp" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
            </div>
          )}

          <div className="toolbar" style={{ marginTop: 12 }}>
            <Button variant="primary" onClick={make} disabled={disabled || busy}>
              Make file
            </Button>
          </div>
        </>
      )}

      {error && <Notice kind="error">{error}</Notice>}

      {result && (
        <div style={{ marginTop: 12 }}>
          <img
            src={result.url}
            alt="Result"
            style={{ display: 'block', maxWidth: '100%', maxHeight: 320, border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)' }}
          />
          <p style={{ margin: '8px 0' }}>
            {result.width} × {result.height} px · {(result.bytes.length / 1024).toFixed(1)} KB
          </p>
          <ul aria-label="Checks" style={{ listStyle: 'none', padding: 0, margin: '0 0 8px' }}>
            {result.checks.map((c) => (
              <li key={c.key} data-ok={String(c.ok)} style={{ color: c.ok ? 'var(--accent)' : 'var(--danger)' }}>
                {c.ok ? '✓ ' : '✗ '}
                {c.text}
              </li>
            ))}
          </ul>
          {result.padded && <Notice kind="info">Padded with blank bytes to reach the minimum size; the picture is unchanged.</Notice>}
          {result.scaled && <Notice kind="info">{`Scaled down to ${result.width} × ${result.height} px to fit.`}</Notice>}
          <div className="toolbar" style={{ marginTop: 8 }}>
            <Button variant="primary" onClick={() => downloadBlob(result.bytes, fileName, 'image/jpeg')}>
              {`Download ${fileName}`}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
