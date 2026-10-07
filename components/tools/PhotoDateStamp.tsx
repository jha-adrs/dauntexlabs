'use client'

// Exam-style photo with a name + date strip, optional signature joined below.
// Native Canvas only. Images stay in memory (object URLs revoked on remove /
// unmount) and every output is re-encoded through canvas.toBlob as JPEG.

import { useEffect, useRef, useState } from 'react'
import { FileDrop, FilePreview, Field, Select, TextInput, Toggle, Button, Notice, downloadBlob } from '@/components/ui/kit'
import { containRect, coverCrop, fitText, formatDateIN, layoutStamp, type Box } from '@/lib/stamp'

type Loaded = { name: string; url: string; el: HTMLImageElement; w: number; h: number }

const PHOTO_PRESETS = [
  { value: '200x230', label: '200 × 230 px (common exam size)', w: 200, h: 230 },
  { value: '350x450', label: '350 × 450 px (3.5 × 4.5 ratio)', w: 350, h: 450 },
  { value: 'custom', label: 'Custom', w: 0, h: 0 },
]
const SIG_PRESETS = [
  { value: '140x60', label: '140 × 60 px', w: 140, h: 60 },
  { value: '280x120', label: '280 × 120 px', w: 280, h: 120 },
  { value: 'custom', label: 'Custom', w: 0, h: 0 },
]

const FONT = 'sans-serif'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function clampPx(v: string, fallback: number): number {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? Math.min(Math.max(n, 20), 2000) : fallback
}

function fmtBytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', quality / 100),
  )
}

/** Signature contained in a white box with a little breathing room. */
function drawSignature(ctx: CanvasRenderingContext2D, sig: Loaded, box: Box) {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(box.x, box.y, box.w, box.h)
  const pad = Math.round(Math.min(box.w, box.h) * 0.05)
  const r = containRect(sig.w, sig.h, { x: box.x + pad, y: box.y + pad, w: box.w - pad * 2, h: box.h - pad * 2 })
  ctx.drawImage(sig.el, r.x, r.y, r.w, r.h)
}

export default function PhotoDateStamp() {
  const [photo, setPhoto] = useState<Loaded | null>(null)
  const [sig, setSig] = useState<Loaded | null>(null)
  const [name, setName] = useState('')
  const [date, setDate] = useState(todayISO)
  const [showDate, setShowDate] = useState(true)
  const [stripPct, setStripPct] = useState(18)
  const [preset, setPreset] = useState('200x230')
  const [customW, setCustomW] = useState('200')
  const [customH, setCustomH] = useState('230')
  const [sigPreset, setSigPreset] = useState('140x60')
  const [sigCustomW, setSigCustomW] = useState('140')
  const [sigCustomH, setSigCustomH] = useState('60')
  const [joinSig, setJoinSig] = useState(true)
  const [quality, setQuality] = useState(85)
  const [saved, setSaved] = useState('')
  const [error, setError] = useState('')
  const previewRef = useRef<HTMLCanvasElement>(null)
  const urls = useRef(new Set<string>())

  // Release every in-memory image when the tool unmounts.
  useEffect(() => {
    const set = urls.current
    return () => {
      set.forEach((u) => URL.revokeObjectURL(u))
      set.clear()
    }
  }, [])

  function release(item: Loaded | null) {
    if (!item) return
    URL.revokeObjectURL(item.url)
    urls.current.delete(item.url)
  }

  function load(files: File[], done: (l: Loaded) => void) {
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
    el.onload = () => done({ name: f.name, url, el, w: el.naturalWidth, h: el.naturalHeight })
    el.onerror = () => {
      URL.revokeObjectURL(url)
      urls.current.delete(url)
      setError('Could not read that image.')
    }
    el.src = url
  }

  const p = PHOTO_PRESETS.find((x) => x.value === preset)!
  const width = preset === 'custom' ? clampPx(customW, 200) : p.w
  const height = preset === 'custom' ? clampPx(customH, 230) : p.h
  const s = SIG_PRESETS.find((x) => x.value === sigPreset)!
  const sigW = sigPreset === 'custom' ? clampPx(sigCustomW, 140) : s.w
  const sigH = sigPreset === 'custom' ? clampPx(sigCustomH, 60) : s.h
  const dateText = showDate ? formatDateIN(date) : ''

  /** Paint the full output (photo + strip + optional joined signature) at its real size. */
  function paint(canvas: HTMLCanvasElement) {
    if (!photo) return
    const layout = layoutStamp({
      width,
      height,
      stripPct,
      sig: sig && joinSig ? { w: sigW, h: sigH } : undefined,
    })
    canvas.width = layout.width
    canvas.height = layout.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, layout.width, layout.height)

    const c = coverCrop(photo.w, photo.h, layout.photo.w, layout.photo.h)
    ctx.drawImage(photo.el, c.sx, c.sy, c.sw, c.sh, layout.photo.x, layout.photo.y, layout.photo.w, layout.photo.h)

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

    if (layout.sig && sig) drawSignature(ctx, sig, layout.sig)
  }

  // Live preview; any change makes the last "Saved" note stale.
  useEffect(() => {
    if (previewRef.current) paint(previewRef.current)
    setSaved('')
    // paint() reads exactly these values
  }, [photo, sig, name, dateText, stripPct, width, height, sigW, sigH, joinSig]) // eslint-disable-line react-hooks/exhaustive-deps

  async function downloadPhoto() {
    if (!photo) return
    setError('')
    try {
      const canvas = document.createElement('canvas')
      paint(canvas)
      const blob = await toJpeg(canvas, quality)
      downloadBlob(blob, 'photo-with-name-date.jpg', 'image/jpeg')
      setSaved(`Saved photo-with-name-date.jpg — ${fmtBytes(blob.size)}`)
    } catch {
      setError('Could not create the JPEG in this browser.')
    }
  }

  async function downloadSignature() {
    if (!sig) return
    setError('')
    try {
      const canvas = document.createElement('canvas')
      canvas.width = sigW
      canvas.height = sigH
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no canvas')
      drawSignature(ctx, sig, { x: 0, y: 0, w: sigW, h: sigH })
      const blob = await toJpeg(canvas, quality)
      downloadBlob(blob, 'signature.jpg', 'image/jpeg')
      setSaved(`Saved signature.jpg — ${fmtBytes(blob.size)}`)
    } catch {
      setError('Could not create the JPEG in this browser.')
    }
  }

  return (
    <>
      {!photo && (
        <FileDrop
          onFiles={(f) => load(f, setPhoto)}
          accept="image/*"
          label="Drop your photo, or click to choose"
          hint="JPG · PNG · WebP — processed on your device"
        />
      )}
      {error && <Notice kind="error">{error}</Notice>}

      {photo && (
        <>
          <div style={{ marginTop: 14 }}>
            <FilePreview
              name={photo.name}
              meta={`${photo.w}×${photo.h}`}
              thumbUrl={photo.url}
              onRemove={() => {
                release(photo)
                setPhoto(null)
              }}
            />
          </div>

          <div className="toolbar" style={{ marginTop: 16 }}>
            <Field label="Name">
              <TextInput value={name} onChange={setName} placeholder="Name as on the form" />
            </Field>
            <Field label="Date" hint={dateText ? `Shows as ${dateText}` : undefined}>
              <input className="inp" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Toggle checked={showDate} onChange={setShowDate} label="Print the date" />
          </div>

          <div className="toolbar" style={{ marginTop: 12 }}>
            <Field label="Photo size">
              <Select value={preset} onChange={setPreset} options={PHOTO_PRESETS} />
            </Field>
            {preset === 'custom' && (
              <>
                <Field label="Width (px)">
                  <TextInput type="number" value={customW} onChange={setCustomW} />
                </Field>
                <Field label="Height (px)">
                  <TextInput type="number" value={customH} onChange={setCustomH} />
                </Field>
              </>
            )}
            <Field label={`Name/date strip — ${stripPct}% of height`}>
              <input
                type="range"
                min={0}
                max={35}
                value={stripPct}
                onChange={(e) => setStripPct(parseInt(e.target.value, 10))}
                style={{ accentColor: 'var(--accent)', width: 180 }}
              />
            </Field>
            <Field label={`JPEG quality — ${quality}%`}>
              <input
                type="range"
                min={30}
                max={100}
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                style={{ accentColor: 'var(--accent)', width: 180 }}
              />
            </Field>
          </div>

          <div style={{ marginTop: 16 }}>
            <span className="field-label">Signature (optional)</span>
            {!sig ? (
              <FileDrop
                onFiles={(f) => load(f, setSig)}
                accept="image/*"
                label="Drop a photo of your signature, or click to choose"
                hint="Sign on plain white paper for the cleanest result"
              />
            ) : (
              <>
                <FilePreview
                  name={sig.name}
                  meta={`${sig.w}×${sig.h}`}
                  thumbUrl={sig.url}
                  onRemove={() => {
                    release(sig)
                    setSig(null)
                  }}
                />
                <div className="toolbar" style={{ marginTop: 12 }}>
                  <Field label="Signature size">
                    <Select value={sigPreset} onChange={setSigPreset} options={SIG_PRESETS} />
                  </Field>
                  {sigPreset === 'custom' && (
                    <>
                      <Field label="Signature width (px)">
                        <TextInput type="number" value={sigCustomW} onChange={setSigCustomW} />
                      </Field>
                      <Field label="Signature height (px)">
                        <TextInput type="number" value={sigCustomH} onChange={setSigCustomH} />
                      </Field>
                    </>
                  )}
                  <Toggle checked={joinSig} onChange={setJoinSig} label="Join signature below photo" />
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <span className="field-label">Preview</span>
            <canvas
              ref={previewRef}
              aria-label="Preview of the stamped photo"
              style={{
                display: 'block',
                marginTop: 6,
                maxWidth: '100%',
                height: 'auto',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </div>

          <div className="toolbar" style={{ marginTop: 16 }}>
            <Button variant="primary" onClick={downloadPhoto}>
              Download photo
            </Button>
            {sig && !joinSig && <Button onClick={downloadSignature}>Download signature</Button>}
          </div>
          {saved && <Notice kind="success">{saved}</Notice>}
          <p style={{ color: 'var(--mute)', margin: '10px 0 0' }}>
            Check the exact size, file-size limit and format in your exam’s notice — they differ between
            forms. Lower the JPEG quality to make the file smaller.
          </p>
        </>
      )}
    </>
  )
}
