'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, Notice } from '@/components/ui/kit'

interface ParsedUrl {
  protocol: string
  username: string
  password: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
  origin: string
  href: string
  params: { key: string; value: string }[]
}

function parseUrl(raw: string): ParsedUrl {
  const url = new URL(raw.trim())
  const params: { key: string; value: string }[] = []
  url.searchParams.forEach((value, key) => {
    params.push({ key, value })
  })
  return {
    protocol: url.protocol,
    username: url.username,
    password: url.password,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    origin: url.origin,
    href: url.href,
    params,
  }
}

const FIELDS: { key: keyof ParsedUrl; label: string }[] = [
  { key: 'href', label: 'Full URL' },
  { key: 'origin', label: 'Origin' },
  { key: 'protocol', label: 'Protocol' },
  { key: 'hostname', label: 'Hostname' },
  { key: 'port', label: 'Port' },
  { key: 'pathname', label: 'Pathname' },
  { key: 'search', label: 'Search' },
  { key: 'hash', label: 'Hash' },
  { key: 'username', label: 'Username' },
  { key: 'password', label: 'Password' },
]

export default function UrlParser() {
  const [input, setInput] = useState('')

  const result = useMemo(() => {
    if (!input.trim()) return { parsed: null, error: '' }
    try {
      return { parsed: parseUrl(input), error: '' }
    } catch {
      return { parsed: null, error: 'Invalid URL. Make sure to include the protocol (e.g. https://).' }
    }
  }, [input])

  const cellStyle: React.CSSProperties = {
    padding: '0.45rem 0.75rem',
    borderBottom: '1px solid var(--line)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.82rem',
    verticalAlign: 'top',
    wordBreak: 'break-all',
  }

  const labelStyle: React.CSSProperties = {
    ...cellStyle,
    color: 'var(--mute)',
    whiteSpace: 'nowrap',
    width: '9rem',
    minWidth: '9rem',
  }

  const valueStyle: React.CSSProperties = {
    ...cellStyle,
    color: 'var(--bone)',
  }

  const emptyStyle: React.CSSProperties = {
    ...cellStyle,
    color: 'var(--mute-2)',
    fontStyle: 'italic',
  }

  return (
    <>
      <Field label="URL">
        <TextInput
          value={input}
          onChange={setInput}
          placeholder="https://user:pw@example.com:8080/path?q=1#section"
        />
      </Field>

      {result.error && <Notice kind="error">{result.error}</Notice>}

      {result.parsed && (
        <>
          <div
            style={{
              marginTop: '1.5rem',
              border: '1px solid var(--line)',
              background: 'var(--ink-850)',
              overflowX: 'auto',
            }}
          >
            <table
              style={{ width: '100%', borderCollapse: 'collapse' }}
              aria-label="URL components"
            >
              <tbody>
                {FIELDS.map(({ key, label }) => {
                  const val = result.parsed![key]
                  if (key === 'params') return null // rendered separately
                  const display = typeof val === 'string' ? val : ''
                  const isEmpty = display === ''
                  return (
                    <tr key={key}>
                      <td style={labelStyle}>{label}</td>
                      <td style={isEmpty ? emptyStyle : valueStyle}>
                        {isEmpty ? '—' : display}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {result.parsed.params.length > 0 && (
            <div
              style={{
                marginTop: '1.5rem',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--mute)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.5rem',
                }}
              >
                Query Parameters ({result.parsed.params.length})
              </div>
              <div
                style={{
                  border: '1px solid var(--line)',
                  background: 'var(--ink-850)',
                  overflowX: 'auto',
                }}
              >
                <table
                  style={{ width: '100%', borderCollapse: 'collapse' }}
                  aria-label="Query parameters"
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          ...labelStyle,
                          color: 'var(--mute)',
                          fontWeight: 400,
                          textAlign: 'left',
                        }}
                      >
                        Key
                      </th>
                      <th
                        style={{
                          ...cellStyle,
                          color: 'var(--mute)',
                          fontWeight: 400,
                          textAlign: 'left',
                        }}
                      >
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.parsed.params.map(({ key, value }, i) => (
                      <tr key={i}>
                        <td style={{ ...labelStyle, color: 'var(--acid)' }}>{key}</td>
                        <td style={valueStyle}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
