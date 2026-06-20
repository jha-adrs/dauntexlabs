'use client'

import { useMemo, useState } from 'react'
import { Toolbar, IO, Panel, TextArea, TextInput, Select, Toggle, CopyButton } from '@/components/ui/kit'

function toSlug(text: string, separator: string, lowercase: boolean): string {
  if (!text) return ''

  // Normalize to NFKD to decompose combined characters (e.g. é → e + combining accent)
  let result = text.normalize('NFKD')
  // Remove combining diacritical marks (Unicode category Mn)
  result = result.replace(/[̀-ͯ]/g, '')
  // Optionally lowercase
  if (lowercase) result = result.toLowerCase()
  // Replace runs of non-alphanumeric characters with the separator
  result = result.replace(/[^a-zA-Z0-9]+/g, separator)
  // Trim leading/trailing separators
  const escaped = separator.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
  result = result.replace(new RegExp(`^${escaped}+|${escaped}+$`, 'g'), '')

  return result
}

export default function SlugGenerator() {
  const [input, setInput] = useState('')
  const [separator, setSeparator] = useState('-')
  const [lowercase, setLowercase] = useState(true)

  const slug = useMemo(() => toSlug(input, separator, lowercase), [input, separator, lowercase])

  return (
    <>
      <Toolbar>
        <Select
          value={separator}
          onChange={setSeparator}
          options={[
            { value: '-', label: 'Hyphen ( - )' },
            { value: '_', label: 'Underscore ( _ )' },
          ]}
        />
        <Toggle checked={lowercase} onChange={setLowercase} label="Lowercase" />
      </Toolbar>

      <IO>
        <Panel title="input text">
          <TextArea
            value={input}
            onChange={setInput}
            placeholder="Hello, World! Café au lait…"
            rows={10}
            mono={false}
          />
        </Panel>
        <Panel
          title="slug"
          actions={<CopyButton text={slug} />}
        >
          <TextArea value={slug} readOnly placeholder="Result…" rows={10} />
        </Panel>
      </IO>
    </>
  )
}
