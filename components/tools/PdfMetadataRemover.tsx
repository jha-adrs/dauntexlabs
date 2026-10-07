'use client'

// lib/pdf-metadata.ts imports pdf-lib lazily inside its functions, so pdf-lib only
// downloads once a file is chosen.

import { useState } from 'react'
import { FileDrop, FilePreview, Field, TextInput, Button, Notice, Toolbar, downloadBlob } from '@/components/ui/kit'
import type { PdfMeta, TextField } from '@/lib/pdf-metadata'

const LABELS: Record<TextField, string> = {
  title: 'Title', author: 'Author', subject: 'Subject',
  keywords: 'Keywords', creator: 'Creator (app that made it)', producer: 'Producer (PDF library)',
}

function fmtDate(iso: string) {
  return iso ? new Date(iso).toLocaleString() : '—'
}

export default function PdfMetadataRemover() {
  const [file, setFile] = useState<{ name: string; data: ArrayBuffer } | null>(null)
  const [meta, setMeta] = useState<PdfMeta | null>(null)
  const [hasXmp, setHasXmp] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [busy, setBusy] = useState(false)

  async function onFiles(files: File[]) {
    setError('')
    setDone('')
    setMeta(null)
    setFile(null)
    const f = files[0]
    if (!f || !(f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))) {
      setError('Please choose a PDF file.')
      return
    }
    const data = await f.arrayBuffer()
    const { readPdfMetadata } = await import('@/lib/pdf-metadata')
    const r = await readPdfMetadata(data.slice(0))
    if (!r.ok) {
      setError(r.error)
      return
    }
    setFile({ name: f.name, data })
    setMeta(r.meta)
    setHasXmp(r.hasXmp)
  }

  async function save(mode: 'remove' | 'edit') {
    if (!file || !meta) return
    setBusy(true)
    setError('')
    setDone('')
    const { cleanPdf } = await import('@/lib/pdf-metadata')
    const r = await cleanPdf(file.data.slice(0), mode === 'remove' ? { mode } : { mode, fields: meta })
    setBusy(false)
    if (!r.ok) {
      setError(r.error)
      return
    }
    downloadBlob(r.bytes, file.name.replace(/\.pdf$/i, '') + '-clean.pdf', 'application/pdf')
    setDone(mode === 'remove' ? 'Metadata removed. Your cleaned PDF has been downloaded.' : 'Saved with your edits.')
  }

  return (
    <>
      <FileDrop
        onFiles={onFiles}
        accept="application/pdf"
        label="Drop a PDF, or click to choose"
        hint="Processed on your device"
      />
      {error && <Notice kind="error">{error}</Notice>}

      {file && meta && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          <FilePreview
            name={file.name}
            meta={`${(file.data.byteLength / 1024).toFixed(1)} KB`}
            onRemove={() => {
              setFile(null)
              setMeta(null)
              setDone('')
            }}
          />
          {hasXmp && (
            <Notice>
              XMP metadata stream found. It is removed whenever you save, because it repeats these fields.
            </Notice>
          )}
          {(Object.keys(LABELS) as TextField[]).map((k) => (
            <Field key={k} label={LABELS[k]}>
              <TextInput
                value={meta[k]}
                onChange={(v) => setMeta({ ...meta, [k]: v })}
                placeholder="(empty)"
              />
            </Field>
          ))}
          <div style={{ color: 'var(--mute)', fontSize: 14 }}>
            Created: {fmtDate(meta.creationDate)} · Modified: {fmtDate(meta.modDate)}. Dates are kept when
            you save edits; Remove all clears them.
          </div>
          <Toolbar>
            <Button variant="primary" onClick={() => save('remove')} disabled={busy}>
              Remove all metadata
            </Button>
            <Button onClick={() => save('edit')} disabled={busy}>
              Save with edits
            </Button>
          </Toolbar>
          {done && <Notice kind="success">{done}</Notice>}
        </div>
      )}
    </>
  )
}
