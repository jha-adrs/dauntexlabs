'use client'

// Lossless metadata removal for photos and videos: the bytes are edited directly
// (lib/media-meta), never re-encoded, so image and video quality are unchanged.
// Each file is read and cleaned in the browser; no preview URLs are created.

import { useState } from 'react'
import { FileDrop, FilePreview, Button, Notice, Toolbar, downloadBlob } from '@/components/ui/kit'
import { inspectMedia, type MetaItem } from '@/lib/media-meta'

type Row = {
  id: number
  name: string
  bytes: number
  format?: string
  mime?: string
  items?: MetaItem[]
  none?: string
  warning?: string
  out?: Uint8Array
  error?: string
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

let nextId = 1

const TOO_LARGE = 'This file is too large for your browser\'s memory, so it was not changed.'

/** Out-of-memory errors from reading or copying a big file. */
const isMemoryError = (e: unknown) => e instanceof RangeError || (e instanceof Error && e.name === 'NotReadableError')

async function process(f: File): Promise<Row> {
  const row: Row = { id: nextId++, name: f.name, bytes: f.size }
  let b: Uint8Array
  try {
    b = new Uint8Array(await f.arrayBuffer())
  } catch (e) {
    return { ...row, error: isMemoryError(e) ? TOO_LARGE : 'This file could not be read.' }
  }
  try {
    const r = inspectMedia(b)
    if (!r)
      return { ...row, error: 'This file type is not supported. Use a JPEG, PNG, WebP, MP4 or MOV file (HEIC and AVIF are not supported).' }
    return { ...row, format: r.format, mime: r.mime, items: r.items, none: r.none, warning: r.warning, out: r.clean() }
  } catch (e) {
    return { ...row, error: isMemoryError(e) ? TOO_LARGE : 'This file looks damaged or incomplete, so it was not changed.' }
  }
}

export default function MetadataRemover() {
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(false)

  async function onFiles(files: File[]) {
    setBusy(true)
    const done: Row[] = []
    for (const f of files) done.push(await process(f))
    setRows((r) => [...r, ...done])
    setBusy(false)
  }

  return (
    <>
      <FileDrop
        onFiles={onFiles}
        multiple
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,.jpg,.jpeg,.png,.webp,.mp4,.mov,.m4v"
        label="Drop photos or videos, or click to choose"
        hint="JPEG · PNG · WebP · MP4 · MOV — processed on your device, no re-encoding"
      />
      {busy && <Notice>Reading files…</Notice>}

      {rows.length > 0 && (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {rows.map((r) => (
              <li key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <FilePreview
                  name={r.name}
                  meta={
                    r.out
                      ? `${r.format} · ${fmtBytes(r.bytes)} → ${fmtBytes(r.out.length)}`
                      : fmtBytes(r.bytes)
                  }
                  onRemove={() => setRows((all) => all.filter((x) => x.id !== r.id))}
                />
                {r.error && <Notice kind="error">{r.error}</Notice>}
                {r.items && (
                  <div style={{ fontSize: 14 }}>
                    {r.items.length === 0 ? (
                      <span style={{ color: 'var(--mute)' }}>{r.none}</span>
                    ) : (
                      <>
                        <div style={{ color: 'var(--mute)', marginBottom: 4 }}>Found and removed:</div>
                        <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '2px 12px', margin: 0 }}>
                          {r.items.map((i, k) => (
                            <div key={k} style={{ display: 'contents' }}>
                              <dt>{i.label}</dt>
                              <dd style={{ margin: 0, fontFamily: 'var(--font-mono)', overflowWrap: 'anywhere' }}>{i.value ?? '—'}</dd>
                            </div>
                          ))}
                        </dl>
                      </>
                    )}
                  </div>
                )}
                {r.warning && <Notice kind="error">{r.warning}</Notice>}
                {r.out && (
                  <Toolbar>
                    <Button variant="primary" onClick={() => downloadBlob(r.out!, r.name, r.mime)}>
                      Download
                    </Button>
                  </Toolbar>
                )}
              </li>
            ))}
          </ul>
          <Toolbar>
            <Button onClick={() => setRows([])}>Clear all</Button>
          </Toolbar>
        </>
      )}
    </>
  )
}
