'use client'

import { useMemo, useState } from 'react'
import {
  IO,
  Panel,
  TextArea,
  CopyButton,
  DownloadButton,
  Notice,
} from '@/components/ui/kit'

// Go-style common initialisms: exported names use all-caps for these (golint).
const INITIALISMS = new Set([
  'ID',
  'URL',
  'URI',
  'API',
  'HTTP',
  'HTTPS',
  'JSON',
  'XML',
  'HTML',
  'SQL',
  'UUID',
  'UI',
  'IP',
  'TCP',
  'CPU',
  'RAM',
])

/** PascalCase a JSON key with Go initialism rules, e.g. "user_id" -> "UserID". */
function toPascalCase(str: string): string {
  // split on any non-alphanumeric boundary or camelCase humps
  const words = str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)

  let name = words
    .map((w) => {
      const upper = w.toUpperCase()
      if (INITIALISMS.has(upper)) return upper
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join('')

  // strip a leading digit run so the identifier is valid Go
  name = name.replace(/^[^a-zA-Z]+/, '')
  return name || 'Field'
}

/** Go scalar type for a JS primitive. */
function scalarType(value: unknown): string {
  if (value === null) return 'interface{}'
  if (typeof value === 'boolean') return 'bool'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'int64' : 'float64'
  }
  return 'interface{}'
}

type Structs = Map<string, string>

/** Merge an array of objects into one key->value map (union of keys). */
function mergeObjects(items: unknown[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const item of items) {
    if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
      for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
        // prefer a non-null sample so type inference is more accurate
        if (!(k in merged) || (merged[k] === null && v !== null)) merged[k] = v
      }
    }
  }
  return merged
}

/** Resolve the Go type for a value living under `keyName`, emitting named structs as needed. */
function goType(value: unknown, keyName: string, structs: Structs): string {
  if (value === null) return 'interface{}'
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]interface{}'

    const hasObject = value.some(
      (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
    )
    if (hasObject) {
      const merged = mergeObjects(value)
      const structName = buildStruct(keyName, merged, structs)
      return '[]' + structName
    }
    // arrays of arrays / scalars: infer from the first element
    return '[]' + goType(value[0], keyName, structs)
  }

  if (typeof value === 'object') {
    const structName = buildStruct(keyName, value as Record<string, unknown>, structs)
    return structName
  }

  return scalarType(value)
}

/** Create (or reuse) a named struct for `obj`; returns the struct's Go type name. */
function buildStruct(keyName: string, obj: Record<string, unknown>, structs: Structs): string {
  const base = toPascalCase(keyName)

  // de-duplicate identical names by suffixing
  let name = base
  let suffix = 2
  while (structs.has(name) && structs.get(name) !== '##pending##') {
    name = base + suffix++
  }
  structs.set(name, '##pending##')

  const lines: string[] = [`type ${name} struct {`]
  for (const [key, val] of Object.entries(obj)) {
    const fieldName = toPascalCase(key)
    const fieldType = goType(val, key, structs)
    lines.push(`\t${fieldName} ${fieldType} \`json:"${key}"\``)
  }
  lines.push('}')

  structs.set(name, lines.join('\n'))
  return name
}

function generateGo(json: unknown): string {
  const structs: Structs = new Map()

  if (json !== null && typeof json === 'object' && !Array.isArray(json)) {
    buildStruct('Root', json as Record<string, unknown>, structs)
  } else if (Array.isArray(json)) {
    if (json.length === 0) {
      return 'type Root []interface{}'
    }
    const hasObject = json.some(
      (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
    )
    if (hasObject) {
      const merged = mergeObjects(json)
      const inner = buildStruct('Root', merged, structs)
      const root = structs.get(inner)
      const others = [...structs.entries()]
        .filter(([k]) => k !== inner)
        .map(([, v]) => v)
      return [`type RootList []${inner}`, ...others, root].filter(Boolean).join('\n\n')
    }
    return `type Root []${goType(json[0], 'RootItem', structs)}`
  } else {
    // primitive top-level value
    return `type Root ${scalarType(json)}`
  }

  // Root struct first, then nested structs (so the entry point reads top-down).
  const root = structs.get('Root')
  const others = [...structs.entries()]
    .filter(([k]) => k !== 'Root')
    .map(([, v]) => v)
  return [root, ...others].filter(Boolean).join('\n\n')
}

export default function JsonToGo() {
  const [input, setInput] = useState('')

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      const parsed = JSON.parse(input)
      return { output: generateGo(parsed), error: '' }
    } catch (e) {
      return { output: '', error: `Invalid JSON: ${(e as Error).message}` }
    }
  }, [input])

  return (
    <>
      <IO>
        <Panel title="JSON input">
          <TextArea
            value={input}
            onChange={setInput}
            placeholder='Paste JSON here…  e.g. {"id":1,"name":"Alice"}'
            rows={14}
          />
        </Panel>
        <Panel
          title="Go structs"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename="types.go" mime="text/x-go" />
            </>
          }
        >
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : (
            <TextArea value={output} readOnly placeholder="Generated structs…" rows={14} />
          )}
        </Panel>
      </IO>
    </>
  )
}
