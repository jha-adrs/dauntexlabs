'use client'

import { useMemo, useState } from 'react'
import {
  Segmented,
  Toolbar,
  IO,
  Panel,
  TextArea,
  CopyButton,
  DownloadButton,
  Notice,
} from '@/components/ui/kit'

function envToJson(env: string): string {
  const result: Record<string, string> = {}
  for (const raw of env.split('\n')) {
    const line = raw.trimEnd()
    // Skip blank lines and comments
    if (!line || line.trimStart().startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    if (!key) continue
    let value = line.slice(eq + 1)
    // Strip surrounding single or double quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return JSON.stringify(result, null, 2)
}

function jsonToEnv(json: string): string {
  const parsed = JSON.parse(json)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Input must be a JSON object (key-value pairs)')
  }
  const lines: string[] = []
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      throw new Error(`Value for key "${key}" must be a string, number, or boolean`)
    }
    const str = String(value)
    // Quote if contains spaces, #, quotes, or backslash
    const needsQuotes = /[\s#"'\\]/.test(str)
    lines.push(needsQuotes ? `${key}="${str.replace(/"/g, '\\"')}"` : `${key}=${str}`)
  }
  return lines.join('\n')
}

export default function EnvToJson() {
  const [mode, setMode] = useState<'env-to-json' | 'json-to-env'>('env-to-json')
  const [input, setInput] = useState('')

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      if (mode === 'env-to-json') {
        return { output: envToJson(input), error: '' }
      } else {
        return { output: jsonToEnv(input), error: '' }
      }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input, mode])

  const isEnvMode = mode === 'env-to-json'

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'env-to-json' | 'json-to-env')}
          options={[
            { value: 'env-to-json', label: '.env → JSON' },
            { value: 'json-to-env', label: 'JSON → .env' },
          ]}
        />
      </Toolbar>

      <IO>
        <Panel title={isEnvMode ? '.env input' : 'JSON input'}>
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={
              isEnvMode
                ? 'KEY=value\n# comment\nANOTHER_KEY="quoted value"'
                : '{\n  "KEY": "value",\n  "PORT": "3000"\n}'
            }
            rows={14}
          />
        </Panel>
        <Panel
          title={isEnvMode ? 'JSON output' : '.env output'}
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton
                text={output}
                filename={isEnvMode ? 'output.json' : '.env'}
                mime={isEnvMode ? 'application/json' : 'text/plain'}
              />
            </>
          }
        >
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : (
            <TextArea value={output} readOnly placeholder="Converted output…" rows={14} />
          )}
        </Panel>
      </IO>
    </>
  )
}
