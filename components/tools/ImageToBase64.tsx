'use client'

// FileReader.readAsDataURL produces a base64 data-URI entirely in the browser —
// no upload. Useful for embedding small images inline in HTML/CSS.

import { useState } from 'react'
import { FileDrop, FilePreview, Field, TextArea, CopyButton, Notice } from '@/components/ui/kit'

type Loaded = { name: string; bytes: number; dataUri: string }

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export default function ImageToBase64() {
  const [img, setImg] = useState<Loaded | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f) return
    setError('')
    setImg(null)
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    setBusy(true)
    const reader = new FileReader()
    reader.onload = () => {
      setBusy(false)
      const dataUri = typeof reader.result === 'string' ? reader.result : ''
      if (!dataUri) {
        setError('Could not read that image.')
        return
      }
      setImg({ name: f.name, bytes: f.size, dataUri })
    }
    reader.onerror = () => {
      setBusy(false)
      setError('Could not read that image.')
    }
    reader.readAsDataURL(f)
  }

  const imgTag = img ? `<img src="${img.dataUri}" alt="${img.name}" />` : ''
  const cssRule = img ? `background-image: url("${img.dataUri}");` : ''

  return (
    <>
      <FileDrop
        onFiles={onFiles}
        accept="image/*"
        label="Drop an image, or click to choose"
        hint="encoded on your device — nothing is uploaded"
      />
      {error && <Notice kind="error">{error}</Notice>}
      {busy && (
        <div style={{ marginTop: 12 }}>
          <Notice kind="info">Encoding…</Notice>
        </div>
      )}

      {img && (
        <>
          <div style={{ marginTop: 14 }}>
            <FilePreview
              name={img.name}
              meta={`${fmtBytes(img.bytes)} → ${fmtBytes(img.dataUri.length)} as data-URI`}
              thumbUrl={img.dataUri}
              onRemove={() => setImg(null)}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <Notice kind="info">
              Data-URIs are ~33% larger than the binary (base64 overhead). Best for small icons; large
              images bloat your HTML/CSS.
            </Notice>
          </div>

          <div style={{ marginTop: 16 }}>
            <Field
              label="Data URI"
              hint={`${img.dataUri.length.toLocaleString()} characters`}
            >
              <TextArea value={img.dataUri} readOnly rows={6} />
            </Field>
            <div className="toolbar" style={{ marginTop: 8 }}>
              <CopyButton text={img.dataUri} label="copy data URI" />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <Field label="HTML <img> tag">
              <TextArea value={imgTag} readOnly rows={4} />
            </Field>
            <div className="toolbar" style={{ marginTop: 8 }}>
              <CopyButton text={imgTag} label="copy <img>" />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <Field label="CSS background-image">
              <TextArea value={cssRule} readOnly rows={4} />
            </Field>
            <div className="toolbar" style={{ marginTop: 8 }}>
              <CopyButton text={cssRule} label="copy CSS" />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <Field label="Preview">
              <img
                src={img.dataUri}
                alt="decoded preview"
                style={{ maxWidth: '100%', border: '1px solid var(--line)' }}
              />
            </Field>
          </div>
        </>
      )}
    </>
  )
}
