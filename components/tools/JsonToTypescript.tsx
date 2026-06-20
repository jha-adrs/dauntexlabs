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

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^[a-z]/, (c) => c.toUpperCase())
    || 'Field'
}

function inferType(
  value: unknown,
  keyName: string,
  interfaces: Map<string, string>,
): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'string') return 'string'

  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]'
    const elementTypes = new Set<string>()
    let mergedObject: Record<string, unknown> | null = null

    for (const item of value) {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        mergedObject = mergedObject ?? {}
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
          if (!(k in mergedObject)) mergedObject[k] = v
        }
      } else {
        elementTypes.add(inferType(item, keyName + 'Item', interfaces))
      }
    }

    if (mergedObject !== null) {
      const innerName = toPascalCase(keyName) + 'Item'
      buildInterface(innerName, mergedObject, interfaces)
      return innerName + '[]'
    }

    const types = [...elementTypes]
    if (types.length === 1) return types[0] + '[]'
    return '(' + types.join(' | ') + ')[]'
  }

  if (typeof value === 'object') {
    const innerName = toPascalCase(keyName)
    buildInterface(innerName, value as Record<string, unknown>, interfaces)
    return innerName
  }

  return 'unknown'
}

function buildInterface(
  name: string,
  obj: Record<string, unknown>,
  interfaces: Map<string, string>,
) {
  // Avoid duplicate interface names by appending suffix if needed
  let finalName = name
  let suffix = 2
  while (interfaces.has(finalName) && interfaces.get(finalName) !== '##pending##') {
    finalName = name + suffix++
  }

  // Mark as pending to handle circular-ish refs
  interfaces.set(finalName, '##pending##')

  const lines: string[] = [`export interface ${finalName} {`]
  for (const [key, val] of Object.entries(obj)) {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
    const typeName = inferType(val, key, interfaces)
    lines.push(`  ${safeKey}: ${typeName};`)
  }
  lines.push('}')

  interfaces.set(finalName, lines.join('\n'))
}

function generateInterfaces(json: unknown): string {
  const interfaces = new Map<string, string>()

  if (json !== null && typeof json === 'object' && !Array.isArray(json)) {
    buildInterface('Root', json as Record<string, unknown>, interfaces)
  } else if (Array.isArray(json)) {
    // Top-level array: infer element type
    const merged: Record<string, unknown> = {}
    for (const item of json) {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
          if (!(k in merged)) merged[k] = v
        }
      }
    }
    buildInterface('Root', merged, interfaces)
  } else {
    return `// Primitive value: ${typeof json}`
  }

  // Output nested interfaces first (not Root), then Root last
  const root = interfaces.get('Root')
  const others = [...interfaces.entries()]
    .filter(([k]) => k !== 'Root')
    .map(([, v]) => v)

  return [...others, root].filter(Boolean).join('\n\n')
}

export default function JsonToTypescript() {
  const [input, setInput] = useState('')

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      const parsed = JSON.parse(input)
      const ts = generateInterfaces(parsed)
      return { output: ts, error: '' }
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
          title="TypeScript interfaces"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename="types.ts" mime="text/typescript" />
            </>
          }
        >
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : (
            <TextArea value={output} readOnly placeholder="Generated interfaces…" rows={14} />
          )}
        </Panel>
      </IO>
    </>
  )
}
