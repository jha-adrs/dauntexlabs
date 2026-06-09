'use client'

import { useMemo, useState } from 'react'
import {
  Segmented,
  Select,
  Toggle,
  Toolbar,
  IO,
  Panel,
  TextArea,
  CopyButton,
  DownloadButton,
  Notice,
  Field,
} from '@/components/ui/kit'

type Mode = 'beautify' | 'minify' | 'validate'

const MODES = [
  { value: 'beautify', label: 'Beautify' },
  { value: 'minify', label: 'Minify' },
  { value: 'validate', label: 'Validate' },
]

const INDENTS = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
  { value: 'tab', label: 'Tab' },
]

/** Map an indent option to the value JSON.stringify expects. */
function indentValue(opt: string): string | number {
  if (opt === 'tab') return '\t'
  return Number(opt)
}

/** Recursively sort object keys (arrays keep order, elements sorted within). */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeys((value as Record<string, unknown>)[key])
    }
    return out
  }
  return value
}

/**
 * Best-effort attempt to surface a 1-based line/column from a thrown parse
 * error. V8 errors carry "position N"; some engines carry "line L column C".
 */
function locateError(message: string, source: string): string {
  const posMatch = message.match(/position\s+(\d+)/i)
  if (posMatch) {
    const pos = Number(posMatch[1])
    let line = 1
    let col = 1
    for (let i = 0; i < pos && i < source.length; i++) {
      if (source[i] === '\n') {
        line++
        col = 1
      } else {
        col++
      }
    }
    return `${message} (line ${line}, column ${col})`
  }
  // Already contains line/column info from the engine.
  if (/line\s+\d+/i.test(message)) return message
  return message
}

/** Parse strict JSON or — when loose is on — a JS object literal expression. */
function parseInput(input: string, loose: boolean): unknown {
  if (loose) {
    // Runs only in the user's own browser, on their own pasted input. The
    // parenthesised wrapper lets `{...}` be read as an object literal rather
    // than a block statement, and tolerates unquoted keys, single quotes,
    // trailing commas and comments.
    // eslint-disable-next-line no-new-func
    return new Function('return (' + input + ')')()
  }
  return JSON.parse(input)
}

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode>('beautify')
  const [indent, setIndent] = useState('2')
  const [sort, setSort] = useState(false)
  const [loose, setLoose] = useState(false)

  const { output, error, valid } = useMemo(() => {
    if (!input.trim()) {
      return { output: '', error: '', valid: false }
    }
    try {
      let value = parseInput(input, loose)
      if (sort) value = sortKeys(value)

      if (mode === 'validate') {
        return { output: '', error: '', valid: true }
      }
      if (mode === 'minify') {
        return { output: JSON.stringify(value), error: '', valid: true }
      }
      // beautify
      return {
        output: JSON.stringify(value, null, indentValue(indent)),
        error: '',
        valid: true,
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { output: '', error: locateError(msg, input), valid: false }
    }
  }, [input, mode, indent, sort, loose])

  const inChars = input.length
  const outChars = output.length

  return (
    <>
      <Toolbar>
        <Segmented value={mode} onChange={(v) => setMode(v as Mode)} options={MODES} />
        <Field label="Indent">
          <Select
            value={indent}
            onChange={setIndent}
            options={INDENTS}
          />
        </Field>
        <Toggle checked={sort} onChange={setSort} label="Sort keys" />
        <Toggle checked={loose} onChange={setLoose} label="Parse JS objects (loose)" />
      </Toolbar>

      <IO>
        <Panel title="json input">
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={
              loose
                ? "Paste JSON or a loose JS object: { foo: 'bar', /* comment */ list: [1, 2,], }"
                : 'Paste JSON here…'
            }
            rows={16}
          />
          <span className="hint-inline">
            {loose
              ? 'loose mode: unquoted keys, single quotes, trailing commas & comments allowed · evaluated in your browser only'
              : 'strict JSON.parse'}
          </span>
        </Panel>

        <Panel
          title={mode === 'validate' ? 'validation' : 'json output'}
          actions={
            mode !== 'validate' ? (
              <>
                <CopyButton text={output} />
                <DownloadButton
                  text={output}
                  filename="formatted.json"
                  mime="application/json"
                />
              </>
            ) : undefined
          }
        >
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : mode === 'validate' ? (
            valid ? (
              <Notice kind="success">Valid JSON</Notice>
            ) : (
              <Notice kind="info">Paste JSON to validate.</Notice>
            )
          ) : (
            <>
              <TextArea
                value={output}
                readOnly
                placeholder="Formatted JSON will appear here…"
                rows={16}
              />
              {output && (
                <span className="hint-inline">
                  {inChars.toLocaleString()} chars in → {outChars.toLocaleString()} chars out
                </span>
              )}
            </>
          )}
        </Panel>
      </IO>
    </>
  )
}
