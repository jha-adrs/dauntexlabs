'use client'
import { useMemo, useState } from 'react'
import {
  Select, Toggle, Toolbar, IO, Panel, TextArea, CopyButton, DownloadButton, Notice,
} from '@/components/ui/kit'

type Op =
  | 'union' | 'intersect' | 'diff' | 'symdiff' | 'concat'
  | 'dedupe' | 'sort' | 'reverse'

const OPS: { value: Op; label: string }[] = [
  { value: 'union',    label: 'Union (A ∪ B)' },
  { value: 'intersect',label: 'Intersection (A ∩ B)' },
  { value: 'diff',     label: 'Difference (A − B)' },
  { value: 'symdiff',  label: 'Symmetric Difference' },
  { value: 'concat',   label: 'Concatenate (A then B)' },
  { value: 'dedupe',   label: 'Deduplicate A' },
  { value: 'sort',     label: 'Sort A' },
  { value: 'reverse',  label: 'Reverse A' },
]

function parseLines(raw: string, trim: boolean, ignoreEmpty: boolean): string[] {
  let lines = raw.split('\n')
  if (trim) lines = lines.map(l => l.trim())
  if (ignoreEmpty) lines = lines.filter(l => l.length > 0)
  return lines
}

export default function ListUtilities() {
  const [a, setA]           = useState('')
  const [b, setB]           = useState('')
  const [op, setOp]         = useState<string>('union')
  const [trim, setTrim]     = useState(true)
  const [ignCase, setIgnCase] = useState(false)
  const [noEmpty, setNoEmpty] = useState(true)

  const { output, count, error } = useMemo(() => {
    try {
      const linesA = parseLines(a, trim, noEmpty)
      const linesB = parseLines(b, trim, noEmpty)

      const key = (s: string) => ignCase ? s.toLowerCase() : s

      let result: string[] = []

      if (op === 'union') {
        const seen = new Set<string>()
        for (const line of [...linesA, ...linesB]) {
          const k = key(line)
          if (!seen.has(k)) { seen.add(k); result.push(line) }
        }
      } else if (op === 'intersect') {
        const setB2 = new Set(linesB.map(key))
        const seen = new Set<string>()
        for (const line of linesA) {
          const k = key(line)
          if (setB2.has(k) && !seen.has(k)) { seen.add(k); result.push(line) }
        }
      } else if (op === 'diff') {
        const setB2 = new Set(linesB.map(key))
        const seen = new Set<string>()
        for (const line of linesA) {
          const k = key(line)
          if (!setB2.has(k) && !seen.has(k)) { seen.add(k); result.push(line) }
        }
      } else if (op === 'symdiff') {
        const setA2 = new Set(linesA.map(key))
        const setB2 = new Set(linesB.map(key))
        const seen = new Set<string>()
        for (const line of linesA) {
          const k = key(line)
          if (!setB2.has(k) && !seen.has(k)) { seen.add(k); result.push(line) }
        }
        for (const line of linesB) {
          const k = key(line)
          if (!setA2.has(k) && !seen.has(k)) { seen.add(k); result.push(line) }
        }
      } else if (op === 'concat') {
        result = [...linesA, ...linesB]
      } else if (op === 'dedupe') {
        const seen = new Set<string>()
        for (const line of linesA) {
          const k = key(line)
          if (!seen.has(k)) { seen.add(k); result.push(line) }
        }
      } else if (op === 'sort') {
        result = [...linesA].sort((x, y) => key(x).localeCompare(key(y)))
      } else if (op === 'reverse') {
        result = [...linesA].reverse()
      }

      const outputText = result.join('\n')
      return { output: outputText, count: result.length, error: '' }
    } catch (e) {
      return { output: '', count: 0, error: String(e) }
    }
  }, [a, b, op, trim, ignCase, noEmpty])

  const usesB = !['dedupe', 'sort', 'reverse'].includes(op)

  return (
    <>
      <Toolbar>
        <Select
          value={op}
          onChange={setOp}
          options={OPS as { value: string; label: string }[]}
        />
        <Toggle checked={trim}    onChange={setTrim}    label="Trim lines" />
        <Toggle checked={ignCase} onChange={setIgnCase} label="Ignore case" />
        <Toggle checked={noEmpty} onChange={setNoEmpty} label="Remove empty lines" />
      </Toolbar>

      <IO>
        <Panel title="List A">
          <TextArea value={a} onChange={setA} placeholder="one item per line…" rows={12} />
        </Panel>
        <Panel title={usesB ? 'List B' : 'List B (not used for this operation)'}>
          <TextArea
            value={b}
            onChange={setB}
            placeholder="one item per line…"
            rows={12}
          />
        </Panel>
      </IO>

      <Panel
        title={`Output — ${count} item${count !== 1 ? 's' : ''}`}
        actions={<><CopyButton text={output} /><DownloadButton text={output} filename="list-output.txt" /></>}
      >
        {error
          ? <Notice kind="error">{error}</Notice>
          : <TextArea value={output} readOnly rows={10} placeholder="Result will appear here…" />
        }
      </Panel>
    </>
  )
}
