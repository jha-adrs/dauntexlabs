'use client'

// Manual redaction on a native Canvas — no OCR, no auto-detect, no libraries.
// The image lives only in memory (an object URL, revoked on remove/unmount) and
// the download is re-encoded through canvas.toBlob, which also drops EXIF/GPS.

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { FileDrop, FilePreview, Field, Button, Notice, Segmented, Toggle, downloadBlob } from '@/components/ui/kit'
import { applyRedactions, guideRect, normalizeRect, type Point, type Rect, type RedactColor } from '@/lib/redact'

type Loaded = { name: string; url: string; el: HTMLImageElement; w: number; h: number }
type Format = 'png' | 'jpg'

const MIN_BOX = 2 // natural px — smaller than this is a stray click, not a box

export default function AadhaarMasker() {
  const [img, setImg] = useState<Loaded | null>(null)
  const [rects, setRects] = useState<Rect[]>([])
  const [draft, setDraft] = useState<Rect | null>(null)
  const [color, setColor] = useState<RedactColor>('black')
  const [guide, setGuide] = useState(false)
  const [format, setFormat] = useState<Format>('png')
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const startRef = useRef<Point | null>(null)
  const urlRef = useRef<string | null>(null)

  function release() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
  }

  // Release the in-memory image when the tool unmounts.
  useEffect(() => release, [])

  function reset() {
    release()
    setImg(null)
    setRects([])
    setDraft(null)
    startRef.current = null
  }

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f) return
    setError('')
    if (f.type === 'application/pdf') {
      setError('PDFs aren’t supported. Open the PDF, take a screenshot of the page, and load that image instead.')
      return
    }
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG or WebP).')
      return
    }
    reset()
    const url = URL.createObjectURL(f)
    urlRef.current = url
    const el = new Image()
    el.onload = () => setImg({ name: f.name, url, el, w: el.naturalWidth, h: el.naturalHeight })
    el.onerror = () => {
      reset()
      setError('Could not read that image.')
    }
    el.src = url
  }

  // Redraw the preview: image, boxes (plus the one being dragged), optional guide.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!img || !canvas) return
    canvas.width = img.w
    canvas.height = img.h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img.el, 0, 0)
    applyRedactions(ctx, draft ? [...rects, draft] : rects, color)
    if (guide) {
      const g = guideRect(img.w, img.h)
      const lw = Math.max(2, Math.round(img.w / 300))
      ctx.save()
      ctx.lineWidth = lw
      ctx.strokeStyle = '#ffffff'
      ctx.strokeRect(g.x, g.y, g.w, g.h)
      ctx.setLineDash([lw * 3, lw * 2])
      ctx.strokeStyle = '#000000'
      ctx.strokeRect(g.x, g.y, g.w, g.h)
      ctx.restore()
    }
  }, [img, rects, draft, color, guide])

  // Pointer position in displayed CSS px, plus the display→natural scale.
  function locate(e: PointerEvent<HTMLCanvasElement>): { p: Point; scale: Point } | null {
    if (!img) return null
    const box = e.currentTarget.getBoundingClientRect()
    const x = Number.isFinite(e.clientX) ? e.clientX - box.left : 0
    const y = Number.isFinite(e.clientY) ? e.clientY - box.top : 0
    const scale = {
      x: box.width > 0 ? img.w / box.width : 1,
      y: box.height > 0 ? img.h / box.height : 1,
    }
    return { p: { x, y }, scale }
  }

  function onDown(e: PointerEvent<HTMLCanvasElement>) {
    if (e.button > 0) return
    const at = locate(e)
    if (!at) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    startRef.current = at.p
    setDraft(null)
  }

  function onMove(e: PointerEvent<HTMLCanvasElement>) {
    const start = startRef.current
    const at = locate(e)
    if (!start || !at || !img) return
    setDraft(normalizeRect(start, at.p, at.scale, { w: img.w, h: img.h }))
  }

  function onUp(e: PointerEvent<HTMLCanvasElement>) {
    const start = startRef.current
    const at = locate(e)
    startRef.current = null
    setDraft(null)
    if (!start || !at || !img) return
    const r = normalizeRect(start, at.p, at.scale, { w: img.w, h: img.h })
    if (r.w >= MIN_BOX && r.h >= MIN_BOX) setRects((rs) => [...rs, r])
  }

  function onCancel() {
    startRef.current = null
    setDraft(null)
  }

  async function exportImage() {
    if (!img || rects.length === 0) return
    setError('')
    try {
      const canvas = document.createElement('canvas')
      canvas.width = img.w
      canvas.height = img.h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no canvas')
      if (format === 'jpg') {
        // JPEG has no transparency — start from white.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, img.w, img.h)
      }
      ctx.drawImage(img.el, 0, 0)
      applyRedactions(ctx, rects, color) // the guide is a hint only — never exported
      const mime = format === 'png' ? 'image/png' : 'image/jpeg'
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), mime, format === 'jpg' ? 0.92 : undefined),
      )
      downloadBlob(blob, `masked.${format}`, mime)
    } catch {
      setError('Could not create the image. Your browser may not support this format.')
    }
  }

  const count = rects.length

  return (
    <>
      <Notice kind="info">
        Masking is manual. You choose what to cover: drag a box over the first 8 digits of the Aadhaar
        number and anything else you don’t want to share, then check the preview before you download. The
        image is processed in your browser.
      </Notice>

      {!img && (
        <div style={{ marginTop: 14 }}>
          <FileDrop
            onFiles={onFiles}
            accept="image/*"
            label="Drop a photo or scan of the card, or click to choose"
            hint="JPG · PNG · WebP — processed on your device. PDFs: take a screenshot first."
          />
        </div>
      )}
      {error && <Notice kind="error">{error}</Notice>}

      {img && (
        <>
          <div style={{ marginTop: 14 }}>
            <FilePreview name={img.name} meta={`${img.w}×${img.h}`} onRemove={reset} />
          </div>

          <div className="toolbar" style={{ marginTop: 16 }}>
            <Field label="Box colour">
              <Segmented
                value={color}
                onChange={(v) => setColor(v as RedactColor)}
                options={[
                  { value: 'black', label: 'Black' },
                  { value: 'white', label: 'White' },
                ]}
              />
            </Field>
            <Toggle checked={guide} onChange={setGuide} label="Show 8-digit guide" />
            <Button onClick={() => setRects((rs) => rs.slice(0, -1))} disabled={count === 0}>
              Undo
            </Button>
            <Button onClick={() => setRects([])} disabled={count === 0}>
              Clear boxes
            </Button>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--mute)' }}>
              {count === 1 ? '1 box' : `${count} boxes`}
            </span>
          </div>

          {guide && (
            <p style={{ color: 'var(--mute)', margin: '10px 0 0' }}>
              The dashed outline shows where the first 8 digits often sit on the front of a card. Layouts
              vary — it’s only a hint, so draw your own box over the real digits.
            </p>
          )}

          <canvas
            ref={canvasRef}
            aria-label="Image preview — drag to draw a box"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onCancel}
            style={{
              display: 'block',
              marginTop: 12,
              width: '100%',
              maxWidth: img.w,
              height: 'auto',
              touchAction: 'none',
              cursor: 'crosshair',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
            }}
          />

          <div className="toolbar" style={{ marginTop: 16 }}>
            <Field label="Download as">
              <Segmented
                value={format}
                onChange={(v) => setFormat(v as Format)}
                options={[
                  { value: 'png', label: 'PNG' },
                  { value: 'jpg', label: 'JPG' },
                ]}
              />
            </Field>
            <Button variant="primary" onClick={exportImage} disabled={count === 0}>
              Download
            </Button>
          </div>
          <p style={{ color: 'var(--mute)', margin: '10px 0 0' }}>
            Tip: the QR code on the card can carry your details too — cover it as well if you don’t need to
            share it.
          </p>
        </>
      )}
    </>
  )
}
