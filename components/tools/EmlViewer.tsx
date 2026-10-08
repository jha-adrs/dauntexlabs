'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { Button, FileDrop, FilePreview, Notice, Panel, Segmented, TextArea, downloadBlob } from '@/components/ui/kit'
import { parseEml, safeSrcdoc } from '@/lib/eml'

const LARGE = 50 * 1024 * 1024

const th: CSSProperties = { padding: '0.35rem 0.75rem 0.35rem 0', fontWeight: 500, textAlign: 'left', color: 'var(--mute)', verticalAlign: 'top', whiteSpace: 'nowrap' }
const td: CSSProperties = { padding: '0.35rem 0', verticalAlign: 'top', wordBreak: 'break-word' }

function size(n: number): string {
  return n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`
}

export default function EmlViewer() {
  const [pasted, setPasted] = useState('')
  const [file, setFile] = useState<{ name: string; size: number; bytes: Uint8Array } | null>(null)
  const [readError, setReadError] = useState('')
  const [view, setView] = useState<'html' | 'text'>('html')
  const [allHeaders, setAllHeaders] = useState(false)

  const result = useMemo(
    () => (file ? parseEml(file.bytes) : pasted.trim() ? parseEml(pasted) : null),
    [file, pasted],
  )
  const email = result?.ok ? result.email : null
  const srcdoc = useMemo(() => (email?.html ? safeSrcdoc(email.html) : ''), [email])
  const showHtml = !!email?.html && (view === 'html' || !email.text)

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f) return
    setReadError('')
    f.arrayBuffer().then(
      (buf) => setFile({ name: f.name, size: f.size, bytes: new Uint8Array(buf) }),
      () => setReadError('Could not read that file.'),
    )
  }

  const summary: [string, string][] = email
    ? [
        ['Subject', email.subject],
        ['From', email.from],
        ['To', email.to],
        ['Date', email.date],
      ]
    : []

  return (
    <>
      {file ? (
        <FilePreview name={file.name} meta={size(file.size)} onRemove={() => setFile(null)} />
      ) : (
        <>
          <FileDrop
            onFiles={onFiles}
            accept=".eml,message/rfc822"
            label="Drop an .eml file here, or click to choose"
            hint="Emails saved from Outlook, Gmail, Apple Mail, Thunderbird — processed on your device"
          />
          <Panel title="Email source">
            <TextArea value={pasted} onChange={setPasted} placeholder="…or paste the raw email source (headers and body)" rows={6} />
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

      {email && (
        <>
          <Notice>Remote images and trackers in this email are blocked.</Notice>

          <Panel
            title="Headers"
            actions={
              <Button onClick={() => setAllHeaders(!allHeaders)}>
                {allHeaders ? 'Show summary' : `Show all ${email.headers.length}`}
              </Button>
            }
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <tbody>
                {(allHeaders ? email.headers.map((h) => [h.name, h.value] as [string, string]) : summary).map(([k, v], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                    <th scope="row" style={th}>{k}</th>
                    <td style={{ ...td, fontFamily: allHeaders ? 'var(--font-mono)' : undefined }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel
            title="Message"
            actions={
              email.html && email.text ? (
                <Segmented
                  value={view}
                  onChange={(v) => setView(v as 'html' | 'text')}
                  options={[
                    { value: 'html', label: 'Formatted' },
                    { value: 'text', label: 'Plain text' },
                  ]}
                />
              ) : undefined
            }
          >
            {showHtml ? (
              <iframe
                title="Email body"
                sandbox=""
                srcDoc={srcdoc}
                referrerPolicy="no-referrer"
                style={{ width: '100%', height: 480, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)' }}
              />
            ) : (
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                {email.text || '(no text body)'}
              </pre>
            )}
          </Panel>

          {email.attachments.length > 0 && (
            <Panel title={`Attachments (${email.attachments.length})`}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {email.attachments.map((a, i) => (
                  <li
                    key={i}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', borderBottom: '1px solid var(--line)' }}
                  >
                    <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-all' }}>{a.filename}</span>
                    <span style={{ color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>
                      {a.mime} · {size(a.bytes.length)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      aria-label={`Download ${a.filename}`}
                      onClick={() => downloadBlob(a.bytes, a.filename, a.mime)}
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
    </>
  )
}
