'use client'

import { useMemo, useState } from 'react'
import {
  Toggle,
  Toolbar,
  IO,
  Panel,
  TextArea,
  TextInput,
  CopyButton,
  DownloadButton,
  Notice,
  Select,
  Field,
} from '@/components/ui/kit'

// CSV field serializer
function csvField(val: string, forceQuote: boolean, outputDelimiter: string): string {
  const needsQuote =
    forceQuote ||
    val.includes('"') ||
    val.includes(outputDelimiter) ||
    val.includes('\n') ||
    val.includes('\r')
  if (needsQuote) {
    return '"' + val.replace(/"/g, '""') + '"'
  }
  return val
}

const INPUT_DELIMITERS = [
  { value: 'whitespace', label: 'Whitespace' },
  { value: ',', label: 'Comma (,)' },
  { value: '\t', label: 'Tab' },
  { value: ';', label: 'Semicolon (;)' },
  { value: 'custom', label: 'Custom…' },
]

export default function TextToCsv() {
  const [input, setInput] = useState('')
  const [inputDelimiter, setInputDelimiter] = useState('whitespace')
  const [customDelimiter, setCustomDelimiter] = useState('')
  const [quoteAll, setQuoteAll] = useState(false)

  // Always output comma-separated CSV
  const OUTPUT_DELIMITER = ','

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      // Resolve actual delimiter to split on
      let delim: string | null
      if (inputDelimiter === 'whitespace') {
        delim = null // special case
      } else if (inputDelimiter === 'custom') {
        if (!customDelimiter) return { output: '', error: 'Enter a custom delimiter.' }
        delim = customDelimiter
      } else {
        delim = inputDelimiter
      }

      const lines = input.split(/\r?\n/)

      const csvRows = lines.map((line) => {
        let fields: string[]
        if (delim === null) {
          // split on any run of whitespace, trimming leading/trailing
          fields = line.trim() === '' ? [''] : line.trim().split(/\s+/)
        } else {
          fields = line.split(delim)
        }
        return fields
          .map((f) => csvField(f, quoteAll, OUTPUT_DELIMITER))
          .join(OUTPUT_DELIMITER)
      })

      // Drop trailing blank lines
      while (csvRows.length > 0 && csvRows[csvRows.length - 1] === '') {
        csvRows.pop()
      }

      return { output: csvRows.join('\n'), error: '' }
    } catch (e) {
      return { output: '', error: `Error: ${e instanceof Error ? e.message : String(e)}` }
    }
  }, [input, inputDelimiter, customDelimiter, quoteAll])

  return (
    <>
      <Toolbar>
        <Field label="Input column delimiter">
          <Select
            value={inputDelimiter}
            onChange={setInputDelimiter}
            options={INPUT_DELIMITERS}
          />
        </Field>
        {inputDelimiter === 'custom' && (
          <Field label="Custom delimiter">
            <TextInput
              value={customDelimiter}
              onChange={setCustomDelimiter}
              placeholder="e.g.  |"
            />
          </Field>
        )}
        <Toggle checked={quoteAll} onChange={setQuoteAll} label="Quote all fields" />
      </Toolbar>

      <IO>
        <Panel title="text input">
          <TextArea
            value={input}
            onChange={setInput}
            placeholder="Paste freeform text here (one row per line)…"
            rows={14}
          />
        </Panel>
        <Panel
          title="csv output"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename="output.csv" mime="text/csv" />
            </>
          }
        >
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : (
            <TextArea value={output} readOnly placeholder="CSV will appear here…" rows={14} />
          )}
        </Panel>
      </IO>
    </>
  )
}
