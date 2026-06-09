'use client'
import { useMemo, useState } from 'react'
import {
  Select, Toggle, Toolbar, IO, Panel, TextArea, TextInput,
  CopyButton, DownloadButton, Notice, Field,
} from '@/components/ui/kit'

type Transform =
  | 'upper' | 'lower' | 'title' | 'trim-lines' | 'collapse-ws'
  | 'reverse' | 'dedup-lines' | 'sort-lines' | 'slugify'

const TRANSFORMS: { value: Transform; label: string }[] = [
  { value: 'upper',       label: 'UPPERCASE' },
  { value: 'lower',       label: 'lowercase' },
  { value: 'title',       label: 'Title Case' },
  { value: 'trim-lines',  label: 'Trim each line' },
  { value: 'collapse-ws', label: 'Collapse whitespace' },
  { value: 'reverse',     label: 'Reverse string' },
  { value: 'dedup-lines', label: 'Remove duplicate lines' },
  { value: 'sort-lines',  label: 'Sort lines' },
  { value: 'slugify',     label: 'Slugify' },
]

function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
}

function applyTransform(input: string, t: Transform): string {
  switch (t) {
    case 'upper':       return input.toUpperCase()
    case 'lower':       return input.toLowerCase()
    case 'title':       return toTitleCase(input)
    case 'trim-lines':  return input.split('\n').map(l => l.trim()).join('\n')
    case 'collapse-ws': return input.replace(/\s+/g, ' ').trim()
    case 'reverse':     return input.split('').reverse().join('')
    case 'dedup-lines': {
      const seen = new Set<string>()
      return input.split('\n').filter(l => { const k = l; return !seen.has(k) && seen.add(k) }).join('\n')
    }
    case 'sort-lines':  return input.split('\n').sort((a, b) => a.localeCompare(b)).join('\n')
    case 'slugify':     return slugify(input)
  }
}

export default function StringUtilities() {
  const [input, setInput]       = useState('')
  const [transform, setTransform] = useState<string>('upper')
  const [find, setFind]         = useState('')
  const [replace, setReplace]   = useState('')
  const [useRegex, setUseRegex] = useState(false)
  const [globalReplace, setGlobal] = useState(true)
  const [ignCase, setIgnCase]   = useState(false)

  // Stats
  const stats = useMemo(() => {
    const chars    = input.length
    const noSpaces = input.replace(/\s/g, '').length
    const words    = input.trim() === '' ? 0 : input.trim().split(/\s+/).length
    const lines    = input === '' ? 0 : input.split('\n').length
    const bytes    = new TextEncoder().encode(input).length
    return { chars, noSpaces, words, lines, bytes }
  }, [input])

  // Transform output
  const transformedOutput = useMemo(() => {
    if (!input) return ''
    try {
      return applyTransform(input, transform as Transform)
    } catch {
      return ''
    }
  }, [input, transform])

  // Find & Replace output
  const { frOutput, frError } = useMemo(() => {
    if (!input) return { frOutput: '', frError: '' }
    if (!find)  return { frOutput: input, frError: '' }
    try {
      if (useRegex) {
        const flags = (globalReplace ? 'g' : '') + (ignCase ? 'i' : '')
        const re = new RegExp(find, flags)
        return { frOutput: input.replace(re, replace), frError: '' }
      } else {
        const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const flags = (globalReplace ? 'g' : '') + (ignCase ? 'i' : '')
        const re = new RegExp(escaped, flags)
        return { frOutput: input.replace(re, replace), frError: '' }
      }
    } catch (e) {
      return { frOutput: '', frError: `Regex error: ${String(e)}` }
    }
  }, [input, find, replace, useRegex, globalReplace, ignCase])

  const statItems: { label: string; value: number }[] = [
    { label: 'Characters',             value: stats.chars },
    { label: 'Chars (no spaces)',      value: stats.noSpaces },
    { label: 'Words',                  value: stats.words },
    { label: 'Lines',                  value: stats.lines },
    { label: 'Bytes (UTF-8)',          value: stats.bytes },
  ]

  return (
    <>
      <IO>
        <Panel title="Input">
          <TextArea value={input} onChange={setInput} placeholder="Enter text…" rows={12} />
        </Panel>
        <Panel title="Stats">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
            {statItems.map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.5rem', borderRadius: 4, background: 'var(--ink-850)' }}>
                <span style={{ color: 'var(--mute)', fontSize: '0.8rem' }}>{label}</span>
                <code style={{ color: 'var(--acid)', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{value.toLocaleString()}</code>
              </div>
            ))}
          </div>
        </Panel>
      </IO>

      {/* Transform */}
      <div style={{ marginTop: '1rem' }}>
        <Toolbar>
          <Select
            value={transform}
            onChange={setTransform}
            options={TRANSFORMS as { value: string; label: string }[]}
          />
        </Toolbar>
        <Panel
          title="Transform output"
          actions={<><CopyButton text={transformedOutput} /><DownloadButton text={transformedOutput} filename="transformed.txt" /></>}
        >
          <TextArea value={transformedOutput} readOnly rows={6} placeholder="Result will appear here…" />
        </Panel>
      </div>

      {/* Find & Replace */}
      <div style={{ marginTop: '1rem' }}>
        <Toolbar>
          <Toggle checked={useRegex}      onChange={setUseRegex}  label="Regex" />
          <Toggle checked={globalReplace} onChange={setGlobal}    label="Global" />
          <Toggle checked={ignCase}       onChange={setIgnCase}   label="Ignore case" />
        </Toolbar>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Field label="Find">
            <TextInput value={find} onChange={setFind} placeholder={useRegex ? 'pattern…' : 'literal text…'} />
          </Field>
          <Field label="Replace">
            <TextInput value={replace} onChange={setReplace} placeholder="replacement…" />
          </Field>
        </div>
        <Panel
          title="Find & Replace output"
          actions={<><CopyButton text={frOutput} /><DownloadButton text={frOutput} filename="replaced.txt" /></>}
        >
          {frError
            ? <Notice kind="error">{frError}</Notice>
            : <TextArea value={frOutput} readOnly rows={6} placeholder="Result will appear here…" />
          }
        </Panel>
      </div>
    </>
  )
}
