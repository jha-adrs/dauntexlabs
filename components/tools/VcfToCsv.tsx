'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { DownloadButton, FileDrop, FilePreview, Notice, Panel, Segmented, TextArea, Toolbar } from '@/components/ui/kit'
import { contactsToCsv, parseVcards, type CsvPreset } from '@/lib/vcard'

const LARGE = 50 * 1024 * 1024
const PREVIEW_ROWS = 20

const PRESETS: { value: CsvPreset; label: string }[] = [
  { value: 'generic', label: 'Generic' },
  { value: 'google', label: 'Google Contacts' },
  { value: 'outlook', label: 'Outlook' },
]

const th: CSSProperties = { padding: '0.4rem 0.5rem', fontWeight: 500, textAlign: 'left' }
const td: CSSProperties = { padding: '0.35rem 0.5rem', verticalAlign: 'top' }

export default function VcfToCsv() {
  const [pasted, setPasted] = useState('')
  const [file, setFile] = useState<{ name: string; size: number; text: string } | null>(null)
  const [readError, setReadError] = useState('')
  const [preset, setPreset] = useState<CsvPreset>('generic')

  const source = file ? file.text : pasted
  const result = useMemo(() => (source.trim() ? parseVcards(source) : null), [source])
  const contacts = result?.ok ? result.contacts : []
  const csv = useMemo(() => (contacts.length ? contactsToCsv(contacts, preset) : ''), [contacts, preset])

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f) return
    setReadError('')
    f.text().then(
      (text) => setFile({ name: f.name, size: f.size, text }),
      () => setReadError('Could not read that file.'),
    )
  }

  const base = file ? file.name.replace(/\.(vcf|vcard)$/i, '') || 'contacts' : 'contacts'

  return (
    <>
      <Toolbar>
        <Segmented value={preset} onChange={(v) => setPreset(v as CsvPreset)} options={PRESETS} />
      </Toolbar>

      {file ? (
        <FilePreview
          name={file.name}
          meta={`${(file.size / 1024).toFixed(1)} KB`}
          onRemove={() => setFile(null)}
        />
      ) : (
        <>
          <FileDrop
            onFiles={onFiles}
            accept=".vcf,.vcard,text/vcard,text/x-vcard"
            label="Drop a .vcf file here, or click to choose"
            hint="vCard 2.1, 3.0 and 4.0 — processed on your device"
          />
          <Panel title="vCard text">
            <TextArea value={pasted} onChange={setPasted} placeholder="…or paste vCard text (BEGIN:VCARD …)" rows={6} />
          </Panel>
        </>
      )}

      {file && file.size > LARGE && (
        <Notice>
          This file is over 50 MB. It is processed in memory in your browser, so the page may be slow for a moment.
        </Notice>
      )}
      {readError && <Notice kind="error">{readError}</Notice>}
      {result && !result.ok && <Notice kind="error">{result.error}</Notice>}

      {result?.ok && (
        <Panel
          title="Contacts"
          actions={
            <DownloadButton
              text={csv ? '﻿' + csv : ''}
              filename={`${base}.csv`}
              mime="text/csv;charset=utf-8"
              label="Download CSV"
            />
          }
        >
          <p style={{ margin: '0 0 0.75rem', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
            {contacts.length} contact{contacts.length === 1 ? '' : 's'}
            {result.skipped > 0 && ` · ${result.skipped} skipped (incomplete or empty cards)`}
            {contacts.length > PREVIEW_ROWS && ` · showing first ${PREVIEW_ROWS}`}
          </p>
          {contacts.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line-strong)', color: 'var(--mute)' }}>
                    <th style={th}>Name</th>
                    <th style={th}>Email</th>
                    <th style={th}>Phone</th>
                    <th style={th}>Organization</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.slice(0, PREVIEW_ROWS).map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={td}>{c.fn}</td>
                      <td style={td}>{c.emails[0] ?? ''}</td>
                      <td style={td}>{c.phones[0]?.value ?? ''}</td>
                      <td style={td}>{c.org}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </>
  )
}
