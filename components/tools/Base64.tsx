'use client'

import { useMemo, useState } from 'react'
import {
  Segmented,
  Toggle,
  Toolbar,
  IO,
  Panel,
  TextArea,
  CopyButton,
  DownloadButton,
  Notice,
} from '@/components/ui/kit'

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export default function Base64() {
  const [mode, setMode] = useState('encode')
  const [urlSafe, setUrlSafe] = useState(false)
  const [input, setInput] = useState('')

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: '' }
    try {
      if (mode === 'encode') {
        let b64 = bytesToBase64(new TextEncoder().encode(input))
        if (urlSafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        return { output: b64, error: '' }
      }
      // decode
      let b64 = input.trim().replace(/-/g, '+').replace(/_/g, '/')
      while (b64.length % 4) b64 += '='
      const text = new TextDecoder('utf-8', { fatal: false }).decode(base64ToBytes(b64))
      return { output: text, error: '' }
    } catch {
      return { output: '', error: 'Invalid input for this mode. Check the data and try again.' }
    }
  }, [input, mode, urlSafe])

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'encode', label: 'Encode' },
            { value: 'decode', label: 'Decode' },
          ]}
        />
        <Toggle checked={urlSafe} onChange={setUrlSafe} label="URL-safe" />
      </Toolbar>

      <IO>
        <Panel title={mode === 'encode' ? 'plain text' : 'base64'}>
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={mode === 'encode' ? 'Text to encode…' : 'Base64 to decode…'}
            rows={12}
          />
        </Panel>
        <Panel
          title={mode === 'encode' ? 'base64' : 'plain text'}
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
    </>
  )
}
