'use client'

// Native Canvas — no libraries. The source image is drawn "cover"-style into a
// set of square canvases, then encoded to PNG. The .ico is assembled by hand
// (ICONDIR + ICONDIRENTRY records wrapping PNG payloads) — all in the browser.

import { useState } from 'react'
import { FileDrop, FilePreview, Button, Notice, downloadBlob } from '@/components/ui/kit'

type Loaded = { name: string; url: string; bytes: number; w: number; h: number }
type Rendered = { size: number; dataUrl: string }

const SIZES = [16, 32, 48, 180, 192, 512] as const
const ICO_SIZES = [16, 32, 48] as const

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

/** Draw `im` into a size×size canvas using object-fit: cover (centered). */
function drawCover(im: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no canvas context')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  const sw = im.naturalWidth
  const sh = im.naturalHeight
  const scale = Math.max(size / sw, size / sh)
  const dw = sw * scale
  const dh = sh * scale
  ctx.drawImage(im, (size - dw) / 2, (size - dh) / 2, dw, dh)
  return canvas
}

function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/png'),
  ).then((b) => b.arrayBuffer()).then((ab) => new Uint8Array(ab))
}

/** Build a multi-image .ico that embeds PNG payloads (Vista+ PNG-in-ICO). */
function buildIco(images: { size: number; png: Uint8Array }[]): Uint8Array {
  const count = images.length
  const headerSize = 6
  const entrySize = 16
  const dirSize = headerSize + entrySize * count
  let total = dirSize
  for (const img of images) total += img.png.length

  const out = new Uint8Array(total)
  const view = new DataView(out.buffer)

  // ICONDIR
  view.setUint16(0, 0, true) // reserved
  view.setUint16(2, 1, true) // type: 1 = icon
  view.setUint16(4, count, true) // image count

  let offset = dirSize
  for (let i = 0; i < count; i++) {
    const { size, png } = images[i]
    const entry = headerSize + i * entrySize
    out[entry + 0] = size >= 256 ? 0 : size // width (0 = 256)
    out[entry + 1] = size >= 256 ? 0 : size // height (0 = 256)
    out[entry + 2] = 0 // color count (0 = no palette)
    out[entry + 3] = 0 // reserved
    view.setUint16(entry + 4, 1, true) // color planes
    view.setUint16(entry + 6, 32, true) // bits per pixel
    view.setUint32(entry + 8, png.length, true) // bytes in resource
    view.setUint32(entry + 12, offset, true) // image data offset
    out.set(png, offset)
    offset += png.length
  }
  return out
}

export default function FaviconGenerator() {
  const [img, setImg] = useState<Loaded | null>(null)
  const [renders, setRenders] = useState<Rendered[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function render(loaded: Loaded) {
    setBusy(true)
    setError('')
    try {
      const im = new Image()
      await new Promise<void>((res, rej) => {
        im.onload = () => res()
        im.onerror = () => rej(new Error('load'))
        im.src = loaded.url
      })
      const out: Rendered[] = SIZES.map((size) => ({
        size,
        dataUrl: drawCover(im, size).toDataURL('image/png'),
      }))
      setRenders(out)
    } catch {
      setError('Could not render favicons from that image.')
    } finally {
      setBusy(false)
    }
  }

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f) return
    setError('')
    setRenders([])
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    const url = URL.createObjectURL(f)
    const im = new Image()
    im.onload = () => {
      const loaded: Loaded = { name: f.name, url, bytes: f.size, w: im.naturalWidth, h: im.naturalHeight }
      setImg(loaded)
      void render(loaded)
    }
    im.onerror = () => setError('Could not read that image.')
    im.src = url
  }

  async function downloadPng(size: number) {
    if (!img) return
    try {
      const im = new Image()
      await new Promise<void>((res, rej) => {
        im.onload = () => res()
        im.onerror = () => rej(new Error('load'))
        im.src = img.url
      })
      const png = await canvasToPngBytes(drawCover(im, size))
      downloadBlob(png, `favicon-${size}x${size}.png`, 'image/png')
    } catch {
      setError(`Could not export the ${size}×${size} PNG.`)
    }
  }

  async function downloadIco() {
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
      const images: { size: number; png: Uint8Array }[] = []
      for (const size of ICO_SIZES) {
        const png = await canvasToPngBytes(drawCover(im, size))
        images.push({ size, png })
      }
      const ico = buildIco(images)
      downloadBlob(ico, 'favicon.ico', 'image/x-icon')
    } catch {
      setError('Could not build the .ico file.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <FileDrop
        onFiles={onFiles}
        accept="image/*"
        label="Drop an image, or click to choose"
        hint="square images work best — generated on your device"
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
                setRenders([])
              }}
            />
          </div>

          {busy && renders.length === 0 && (
            <div style={{ marginTop: 12 }}>
              <Notice kind="info">Rendering favicons…</Notice>
            </div>
          )}

          {renders.length > 0 && (
            <>
              <div className="toolbar" style={{ marginTop: 16 }}>
                <Button variant="primary" onClick={downloadIco} disabled={busy}>
                  {busy ? 'Building…' : 'Download favicon.ico (16·32·48)'}
                </Button>
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 14,
                }}
              >
                {renders.map((r) => (
                  <div
                    key={r.size}
                    style={{
                      border: '1px solid var(--line)',
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 10,
                      background: 'var(--ink-850)',
                    }}
                  >
                    <img
                      src={r.dataUrl}
                      alt={`${r.size}×${r.size} favicon`}
                      width={Math.min(r.size, 96)}
                      height={Math.min(r.size, 96)}
                      style={{
                        imageRendering: r.size <= 48 ? 'pixelated' : 'auto',
                        border: '1px solid var(--line)',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--mute)',
                      }}
                    >
                      {r.size}×{r.size}
                    </span>
                    <Button onClick={() => downloadPng(r.size)}>PNG</Button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14 }}>
                <Notice kind="info">
                  16/32/48 are classic favicon sizes (and bundled into the .ico); 180 is the
                  Apple touch icon; 192/512 are PWA manifest icons. Non-square images are
                  center-cropped (cover).
                </Notice>
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
