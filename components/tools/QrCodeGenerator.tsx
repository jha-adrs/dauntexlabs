'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, downloadBlob, Field, Notice, Select, TextArea, Toolbar } from '@/components/ui/kit'

const EC_OPTIONS = [
  { value: 'L', label: 'L — Low (7%)' },
  { value: 'M', label: 'M — Medium (15%)' },
  { value: 'Q', label: 'Q — Quartile (25%)' },
  { value: 'H', label: 'H — High (30%)' },
]

export default function QrCodeGenerator() {
  const [text, setText] = useState('')
  const [ecLevel, setEcLevel] = useState('M')
  const [cellSize, setCellSize] = useState(8)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Re-generate whenever inputs change
  useEffect(() => {
    if (!text.trim()) {
      setDataUrl(null)
      setError(null)
      return
    }

    let cancelled = false

    async function generate() {
      try {
        // Lazy import as required
        const qrcode = (await import('qrcode-generator')).default
        if (cancelled) return

        const qr = qrcode(0, ecLevel as 'L' | 'M' | 'Q' | 'H')
        qr.addData(text)
        qr.make()

        const margin = 4 // quiet-zone in modules
        const url = qr.createDataURL(cellSize, margin * cellSize)
        setDataUrl(url)
        setError(null)

        // Also draw onto canvas for crisp PNG download
        const canvas = canvasRef.current
        if (!canvas) return
        const count = qr.getModuleCount()
        const totalSize = (count + margin * 2) * cellSize
        canvas.width = totalSize
        canvas.height = totalSize
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        // White background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, totalSize, totalSize)
        // Dark modules
        ctx.fillStyle = '#000000'
        for (let row = 0; row < count; row++) {
          for (let col = 0; col < count; col++) {
            if (qr.isDark(row, col)) {
              ctx.fillRect(
                (col + margin) * cellSize,
                (row + margin) * cellSize,
                cellSize,
                cellSize,
              )
            }
          }
        }
      } catch (err) {
        if (cancelled) return
        setDataUrl(null)
        setError(
          'Could not generate QR code — the data may be too long for this error-correction level. ' +
          'Try a lower error-correction level (L) or shorten the input.',
        )
      }
    }

    generate()
    return () => {
      cancelled = true
    }
  }, [text, ecLevel, cellSize])

  function downloadPng() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(
      (blob) => {
        if (blob) downloadBlob(blob, 'qr.png', 'image/png')
      },
      'image/png',
    )
  }

  return (
    <>
      <Toolbar>
        <Field label="Error correction">
          <Select value={ecLevel} onChange={setEcLevel} options={EC_OPTIONS} />
        </Field>
        <Field label={`Module size: ${cellSize}px`}>
          <input
            type="range"
            min={4}
            max={16}
            value={cellSize}
            onChange={(e) => setCellSize(Number(e.target.value))}
            style={{ accentColor: 'var(--acid)', width: 220 }}
          />
        </Field>
      </Toolbar>

      <Field label="Content">
        <TextArea
          value={text}
          onChange={setText}
          placeholder="Enter text or a URL to encode…"
          rows={4}
        />
      </Field>

      {error && <Notice kind="error">{error}</Notice>}

      {!text.trim() && !error && (
        <p className="hint-inline" style={{ marginTop: 12 }}>
          Type or paste any text / URL above to generate a QR code.
        </p>
      )}

      {/* Hidden canvas for PNG download */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {dataUrl && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
          <div
            style={{
              background: '#fff',
              padding: 12,
              border: '1px solid var(--line)',
              borderRadius: 4,
              display: 'inline-block',
              lineHeight: 0,
            }}
          >
            <img src={dataUrl} alt="Generated QR code" style={{ display: 'block', imageRendering: 'pixelated' }} />
          </div>
          <Button variant="primary" onClick={downloadPng} disabled={!dataUrl}>
            Download PNG
          </Button>
        </div>
      )}
    </>
  )
}
