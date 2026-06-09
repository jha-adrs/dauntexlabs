'use client'

import { useMemo, useState } from 'react'
import {
  Segmented,
  Toggle,
  Toolbar,
  IO,
  Panel,
  Field,
  TextArea,
  CopyButton,
  DownloadButton,
  Notice,
} from '@/components/ui/kit'

type QueryRow = { key: string; value: string }

/** Parse a full URL or a bare query string into key/value rows. */
function parseQuery(raw: string): { rows: QueryRow[]; base: string } {
  const trimmed = raw.trim()
  let queryPart = trimmed
  let base = ''

  // If it looks like a full URL, lean on the URL parser to isolate the query.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    const u = new URL(trimmed)
    base = `${u.protocol}//${u.host}${u.pathname}`
    queryPart = u.search // includes leading '?'
  } else {
    // Could be "path?a=1" or "?a=1" or "a=1&b=2" or just a hash fragment.
    const qIndex = trimmed.indexOf('?')
    if (qIndex >= 0) {
      base = trimmed.slice(0, qIndex)
      queryPart = trimmed.slice(qIndex)
    }
  }

  // Strip a leading '?' and any trailing hash fragment for clean parsing.
  let cleaned = queryPart.replace(/^\?/, '')
  const hashIndex = cleaned.indexOf('#')
  if (hashIndex >= 0) cleaned = cleaned.slice(0, hashIndex)

  const params = new URLSearchParams(cleaned)
  const rows: QueryRow[] = []
  params.forEach((value, key) => rows.push({ key, value }))
  return { rows, base }
}

export default function UrlEncodeDecode() {
  const [mode, setMode] = useState('encode')
  const [input, setInput] = useState('')
  const [wholeUri, setWholeUri] = useState(false)

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: '' }
    try {
      if (mode === 'encode') {
        return {
          output: wholeUri ? encodeURI(input) : encodeURIComponent(input),
          error: '',
        }
      }
      // decode
      try {
        return { output: decodeURIComponent(input), error: '' }
      } catch {
        // decodeURIComponent throws on malformed sequences — fall back.
        return { output: decodeURI(input), error: '' }
      }
    } catch {
      return {
        output: '',
        error: 'Could not process this input. Check for malformed percent-encoding.',
      }
    }
  }, [input, mode, wholeUri])

  const query = useMemo(() => {
    if (mode !== 'query') return null
    if (!input.trim()) return { rows: [] as QueryRow[], base: '', error: '' }
    try {
      const { rows, base } = parseQuery(input)
      return { rows, base, error: '' }
    } catch {
      return { rows: [] as QueryRow[], base: '', error: 'Invalid URL or query string.' }
    }
  }, [input, mode])

  const cellStyle: React.CSSProperties = {
    border: '1px solid var(--line)',
    padding: '6px 10px',
    textAlign: 'left',
    verticalAlign: 'top',
    wordBreak: 'break-word',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
  }

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'encode', label: 'Encode' },
            { value: 'decode', label: 'Decode' },
            { value: 'query', label: 'Parse query' },
          ]}
        />
        {mode === 'encode' && (
          <Toggle
            checked={wholeUri}
            onChange={setWholeUri}
            label="encode whole URI (encodeURI)"
          />
        )}
        <span className="hint-inline">on-device · no network</span>
      </Toolbar>

      {mode !== 'query' ? (
        <IO>
          <Panel title={mode === 'encode' ? 'plain text' : 'encoded'}>
            <TextArea
              value={input}
              onChange={setInput}
              placeholder={
                mode === 'encode'
                  ? wholeUri
                    ? 'https://example.com/path with spaces?a=b'
                    : 'value with spaces & symbols'
                  : 'value%20with%20spaces'
              }
              rows={12}
            />
          </Panel>
          <Panel
            title={mode === 'encode' ? 'encoded' : 'decoded'}
            actions={
              <>
                <CopyButton text={output} />
                <DownloadButton
                  text={output}
                  filename={mode === 'encode' ? 'encoded.txt' : 'decoded.txt'}
                />
              </>
            }
          >
            {error ? (
              <Notice kind="error">{error}</Notice>
            ) : (
              <TextArea value={output} readOnly placeholder="Result…" rows={12} />
            )}
          </Panel>
        </IO>
      ) : (
        <div style={{ marginTop: 12 }}>
          <Field
            label="URL or query string"
            hint="Paste a full URL or a bare query string (e.g. a=1&b=hello world)."
          >
            <TextArea
              value={input}
              onChange={setInput}
              placeholder="https://example.com/search?q=hello+world&page=2"
              rows={4}
            />
          </Field>

          {query?.error ? (
            <Notice kind="error">{query.error}</Notice>
          ) : !input.trim() ? (
            <Notice kind="info">Enter a URL or query string to list its parameters.</Notice>
          ) : query && query.rows.length === 0 ? (
            <Notice kind="info">No query parameters found.</Notice>
          ) : (
            query && (
              <div style={{ marginTop: 14 }}>
                {query.base && (
                  <div
                    className="hint-inline"
                    style={{ marginBottom: 10, wordBreak: 'break-all' }}
                  >
                    base: {query.base}
                  </div>
                )}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1px solid var(--line-strong)',
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          ...cellStyle,
                          color: 'var(--acid)',
                          background: 'var(--ink-800)',
                          width: '32%',
                          fontFamily: 'inherit',
                        }}
                      >
                        key
                      </th>
                      <th
                        style={{
                          ...cellStyle,
                          color: 'var(--acid)',
                          background: 'var(--ink-800)',
                          fontFamily: 'inherit',
                        }}
                      >
                        value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.rows.map((r, i) => (
                      <tr key={`${r.key}-${i}`}>
                        <td style={{ ...cellStyle, color: 'var(--bone)' }}>{r.key}</td>
                        <td style={{ ...cellStyle, color: 'var(--mute)' }}>
                          {r.value === '' ? (
                            <span style={{ color: 'var(--mute-2)' }}>(empty)</span>
                          ) : (
                            r.value
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </>
  )
}
