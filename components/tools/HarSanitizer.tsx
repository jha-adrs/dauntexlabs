'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { DownloadButton, FileDrop, FilePreview, Notice, Panel, TextArea, Toggle } from '@/components/ui/kit'
import { CATEGORIES, analyzeHar, redactHar, type Category, type Finding } from '@/lib/har'

const LARGE = 50 * 1024 * 1024
const MAX_ROWS = 200

const th: CSSProperties = { padding: '0.4rem 0.5rem', fontWeight: 500, textAlign: 'left' }
const td: CSSProperties = { padding: '0.35rem 0.5rem', verticalAlign: 'top' }

export default function HarSanitizer() {
  const [pasted, setPasted] = useState('')
  const [file, setFile] = useState<{ name: string; size: number; text: string } | null>(null)
  const [readError, setReadError] = useState('')
  const [on, setOn] = useState<Set<Category>>(() => new Set<Category>(['cookies', 'auth', 'query', 'jwt']))

  const source = file ? file.text : pasted
  const result = useMemo(() => (source.trim() ? analyzeHar(source) : null), [source])
  const redacted = useMemo(() => (result?.ok ? redactHar(result.har, on) : null), [result, on])
  const groups = useMemo(() => {
    const m = new Map<Category, Finding[]>(CATEGORIES.map((c) => [c.id, []]))
    if (result?.ok) for (const f of result.findings) m.get(f.category)!.push(f)
    return m
  }, [result])

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f) return
    setReadError('')
    f.text().then(
      (text) => setFile({ name: f.name, size: f.size, text }),
      () => setReadError('Could not read that file.'),
    )
  }

  function toggle(c: Category, v: boolean) {
    const next = new Set(on)
    if (v) next.add(c)
    else next.delete(c)
    setOn(next)
  }

  const base = file ? file.name.replace(/\.(har|json)$/i, '') || 'session' : 'session'

  return (
    <>
      {file ? (
        <FilePreview name={file.name} meta={`${(file.size / 1024).toFixed(1)} KB`} onRemove={() => setFile(null)} />
      ) : (
        <>
          <FileDrop
            onFiles={onFiles}
            accept=".har,.json,application/json"
            label="Drop a .har file here, or click to choose"
            hint="Exported from the browser's Network panel — processed on your device"
          />
          <Panel title="HAR text">
            <TextArea value={pasted} onChange={setPasted} placeholder="…or paste HAR JSON ({ &quot;log&quot;: { &quot;entries&quot;: … } })" rows={6} />
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

      {result?.ok && redacted && (
        <Panel
          title="What will be redacted"
          actions={
            <DownloadButton
              text={redacted.text}
              filename={`${base}.sanitized.har`}
              mime="application/json"
              label="Download sanitized HAR"
            />
          }
        >
          <p style={{ margin: '0 0 0.75rem', fontWeight: 500 }}>
            {redacted.count} value{redacted.count === 1 ? '' : 's'} will be redacted
          </p>
          <p style={{ margin: '0 0 1rem', color: 'var(--mute)', fontSize: '0.875rem' }}>
            Values are shown masked. Check the sanitized file before sharing it — a secret stored under an unusual
            name may need removing by hand.
          </p>
          {CATEGORIES.map((c) => {
            const list = groups.get(c.id) ?? []
            return (
              <section key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.75rem 0' }}>
                <Toggle checked={on.has(c.id)} onChange={(v) => toggle(c.id, v)} label={c.label} />
                <div style={{ color: 'var(--mute)', fontSize: '0.8125rem', margin: '0.25rem 0 0.5rem' }}>
                  {c.hint} · {list.length} found
                </div>
                {list.length > 0 && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--line-strong)', color: 'var(--mute)' }}>
                          <th style={th}>Where</th>
                          <th style={th}>Name</th>
                          <th style={th}>Value (masked)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.slice(0, MAX_ROWS).map((f, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={td}>{f.where}</td>
                            <td style={{ ...td, fontFamily: 'var(--font-mono)' }}>{f.name}</td>
                            <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--mute)' }}>{f.preview}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {list.length > MAX_ROWS && (
                      <p style={{ margin: '0.5rem 0 0', color: 'var(--mute)', fontSize: '0.8125rem' }}>
                        …and {list.length - MAX_ROWS} more
                      </p>
                    )}
                  </div>
                )}
              </section>
            )
          })}
        </Panel>
      )}
    </>
  )
}
