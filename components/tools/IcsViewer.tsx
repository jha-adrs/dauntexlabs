'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { DownloadButton, Field, FileDrop, FilePreview, Notice, Panel, Select, TextArea, Toolbar } from '@/components/ui/kit'
import { describeRrule, eventsToCsv, formatInZone, parseIcs } from '@/lib/ics'

const LARGE = 50 * 1024 * 1024

function zoneOptions(current: string): { value: string; label: string }[] {
  let list: string[] = []
  try {
    const sv = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf
    list = sv ? sv('timeZone') : []
  } catch {
    /* older browser: fall back to the short list below */
  }
  const all = Array.from(new Set(['UTC', current, 'Asia/Kolkata', 'America/New_York', 'Europe/London', ...list])).sort()
  return all.map((z) => ({ value: z, label: z.replace(/_/g, ' ') }))
}

function defaultZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

const th: CSSProperties = { padding: '0.4rem 0.5rem', fontWeight: 500, textAlign: 'left' }
const td: CSSProperties = { padding: '0.35rem 0.5rem', verticalAlign: 'top' }

export default function IcsViewer() {
  const [pasted, setPasted] = useState('')
  const [file, setFile] = useState<{ name: string; size: number; text: string } | null>(null)
  const [readError, setReadError] = useState('')
  const [zone, setZone] = useState(defaultZone)
  const [asc, setAsc] = useState(true)
  const options = useMemo(() => zoneOptions(zone), [zone])

  const source = file ? file.text : pasted
  const result = useMemo(() => (source.trim() ? parseIcs(source) : null), [source])
  const events = useMemo(() => {
    const list = result?.ok ? [...result.events] : []
    // Events without a start sort last either way.
    const key = (t: Date | null) => (t ? t.getTime() : asc ? Infinity : -Infinity)
    return list.sort((a, b) => (asc ? key(a.start) - key(b.start) : key(b.start) - key(a.start)))
  }, [result, asc])
  const csv = useMemo(() => (events.length ? eventsToCsv(events, zone) : ''), [events, zone])

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f) return
    setReadError('')
    f.text().then(
      (text) => setFile({ name: f.name, size: f.size, text }),
      () => setReadError('Could not read that file.'),
    )
  }

  const base = file ? file.name.replace(/\.(ics|ical|ifb)$/i, '') || 'calendar' : 'calendar'

  return (
    <>
      <Toolbar>
        <Field label="Time zone">
          <Select value={zone} onChange={setZone} options={options} />
        </Field>
      </Toolbar>

      {file ? (
        <FilePreview name={file.name} meta={`${(file.size / 1024).toFixed(1)} KB`} onRemove={() => setFile(null)} />
      ) : (
        <>
          <FileDrop
            onFiles={onFiles}
            accept=".ics,.ical,.ifb,text/calendar"
            label="Drop an .ics file here, or click to choose"
            hint="Calendar exports from Google, Outlook, Apple — processed on your device"
          />
          <Panel title="Calendar text">
            <TextArea value={pasted} onChange={setPasted} placeholder="…or paste calendar text (BEGIN:VCALENDAR …)" rows={6} />
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
          title="Events"
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
            {events.length} event{events.length === 1 ? '' : 's'}
            {result.skipped > 0 && ` · ${result.skipped} skipped (incomplete)`}
            {' · times shown in '}
            {zone.replace(/_/g, ' ')}
          </p>
          {events.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line-strong)', color: 'var(--mute)' }}>
                    <th style={th}>Summary</th>
                    <th style={th} aria-sort={asc ? 'ascending' : 'descending'}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setAsc(!asc)}
                        title="Sort by start time"
                      >
                        Start {asc ? '↑' : '↓'}
                      </button>
                    </th>
                    <th style={th}>End</th>
                    <th style={th}>All day</th>
                    <th style={th}>Location</th>
                    <th style={th}>Repeats</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={td}>
                        {e.summary}
                        {e.unknownZone && (
                          <div style={{ fontSize: 12.5, color: 'var(--warn)', marginTop: 2 }}>
                            Time zone “{e.unknownZone}” not recognised — times shown as written in
                            the file.
                          </div>
                        )}
                      </td>
                      <td style={{ ...td, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                        {formatInZone(e, 'start', zone)}
                      </td>
                      <td style={{ ...td, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                        {formatInZone(e, 'end', zone)}
                      </td>
                      <td style={td}>{e.allDay ? 'Yes' : 'No'}</td>
                      <td style={td}>{e.location}</td>
                      <td style={td}>{e.rrule ? describeRrule(e.rrule) : ''}</td>
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
