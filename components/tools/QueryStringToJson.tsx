'use client'

import { useMemo, useState } from 'react'
import { Segmented, Toolbar, IO, Panel, TextArea, CopyButton, Notice } from '@/components/ui/kit'

function parseQueryString(input: string): Record<string, string | string[]> {
  // Strip leading URL if present — grab just the query string portion
  let qs = input.trim()
  try {
    const url = new URL(qs)
    qs = url.search.slice(1) // drop leading '?'
  } catch {
    // Not a full URL — strip a leading '?' if present
    if (qs.startsWith('?')) qs = qs.slice(1)
  }

  const params = new URLSearchParams(qs)
  const result: Record<string, string | string[]> = {}

  for (const key of params.keys()) {
    const vals = params.getAll(key)
    result[key] = vals.length === 1 ? vals[0] : vals
  }

  return result
}

function jsonToQueryString(input: string): string {
  const obj = JSON.parse(input)
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error('Top-level value must be a JSON object.')
  }

  const parts: string[] = []
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (Array.isArray(val)) {
      for (const item of val) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`)
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`)
    }
  }
  return parts.join('&')
}

export default function QueryStringToJson() {
  const [mode, setMode] = useState('q2j')
  const [input, setInput] = useState('')

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      if (mode === 'q2j') {
        const obj = parseQueryString(input)
        return { output: JSON.stringify(obj, null, 2), error: '' }
      } else {
        const qs = jsonToQueryString(input)
        return { output: qs, error: '' }
      }
    } catch (e) {
      return { output: '', error: (e as Error).message || 'Invalid input.' }
    }
  }, [input, mode])

  const inputPlaceholder =
    mode === 'q2j'
      ? 'a=1&b=hello&a=3  or  https://example.com?q=foo&lang=en'
      : '{"key": "value", "arr": ["1", "2"]}'

  const outputPlaceholder = mode === 'q2j' ? '{"a": ["1","3"], "b": "hello"}' : 'a=1&b=hello'

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'q2j', label: 'Query → JSON' },
            { value: 'j2q', label: 'JSON → Query' },
          ]}
        />
      </Toolbar>

      <IO>
        <Panel title={mode === 'q2j' ? 'query string / URL' : 'JSON object'}>
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={inputPlaceholder}
            rows={12}
          />
        </Panel>
        <Panel
          title={mode === 'q2j' ? 'JSON' : 'query string'}
          actions={<CopyButton text={output} />}
        >
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : (
            <TextArea value={output} readOnly placeholder={outputPlaceholder} rows={12} />
          )}
        </Panel>
      </IO>
    </>
  )
}
