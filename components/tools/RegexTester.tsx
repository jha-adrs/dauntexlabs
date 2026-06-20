'use client'

import { useMemo, useState } from 'react'
import { Field, Toolbar, IO, Panel, TextInput, TextArea, Notice } from '@/components/ui/kit'

type MatchInfo = {
  match: string
  index: number
  groups: string[]
}

type Segment = { text: string; matched: boolean }

type Result = {
  error: string
  matches: MatchInfo[]
  segments: Segment[]
}

function runRegex(pattern: string, flags: string, test: string): Result {
  if (!pattern) {
    return { error: '', matches: [], segments: test ? [{ text: test, matched: false }] : [] }
  }

  let re: RegExp
  try {
    re = new RegExp(pattern, flags)
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Invalid regular expression.',
      matches: [],
      segments: [],
    }
  }

  const matches: MatchInfo[] = []
  const segments: Segment[] = []
  const global = flags.includes('g')

  if (!test) {
    return { error: '', matches: [], segments: [] }
  }

  let lastSliceEnd = 0
  let guard = 0
  // Iterate matches manually so we control lastIndex (zero-length-match guard).
  while (guard++ < 100000) {
    const m = re.exec(test)
    if (!m) break

    matches.push({
      match: m[0],
      index: m.index,
      groups: m.slice(1).map((g) => (g === undefined ? '' : g)),
    })

    // build highlight segments
    if (m.index > lastSliceEnd) {
      segments.push({ text: test.slice(lastSliceEnd, m.index), matched: false })
    }
    if (m[0].length > 0) {
      segments.push({ text: m[0], matched: true })
      lastSliceEnd = m.index + m[0].length
    }

    if (!global) break

    // zero-length match → advance lastIndex to avoid an infinite loop
    if (m[0].length === 0) {
      re.lastIndex = m.index + 1
    }
  }

  if (lastSliceEnd < test.length) {
    segments.push({ text: test.slice(lastSliceEnd), matched: false })
  }

  return { error: '', matches, segments }
}

const HL_STYLE: React.CSSProperties = {
  background: 'rgba(198,242,78,.25)',
  color: 'var(--acid)',
  borderRadius: 3,
  padding: '0 1px',
}

export default function RegexTester() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [test, setTest] = useState('')

  const { error, matches, segments } = useMemo(
    () => runRegex(pattern, flags, test),
    [pattern, flags, test],
  )

  return (
    <>
      <Toolbar>
        <Field label="pattern" hint="without slashes">
          <TextInput value={pattern} onChange={setPattern} placeholder="\d+" />
        </Field>
        <Field label="flags" hint="g i m s u y">
          <TextInput value={flags} onChange={setFlags} placeholder="gi" />
        </Field>
      </Toolbar>

      <IO>
        <Panel title="test string">
          <TextArea
            value={test}
            onChange={setTest}
            placeholder="Text to match against…"
            rows={12}
          />
        </Panel>
        <Panel title="result">
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : (
            <>
              <div
                className="mono"
                style={{ fontSize: '.82rem', color: 'var(--mute)', marginBottom: '.6rem' }}
              >
                {matches.length} match{matches.length === 1 ? '' : 'es'}
              </div>

              {test && (
                <pre
                  className="mono"
                  style={{
                    margin: '0 0 .8rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '.82rem',
                    lineHeight: 1.5,
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    padding: '.6rem',
                    overflow: 'auto',
                  }}
                >
                  {segments.length === 0 ? (
                    <span style={{ color: 'var(--mute)' }}>{test}</span>
                  ) : (
                    segments.map((s, i) =>
                      s.matched ? (
                        <mark key={i} style={HL_STYLE}>
                          {s.text}
                        </mark>
                      ) : (
                        <span key={i} style={{ color: 'var(--mute)' }}>
                          {s.text}
                        </span>
                      ),
                    )
                  )}
                </pre>
              )}

              {matches.length > 0 && (
                <ol
                  className="mono"
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                    fontSize: '.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '.4rem',
                  }}
                >
                  {matches.map((m, i) => (
                    <li
                      key={i}
                      style={{
                        border: '1px solid var(--line)',
                        borderRadius: 6,
                        padding: '.4rem .6rem',
                      }}
                    >
                      <span style={{ color: 'var(--mute)' }}>#{i + 1}</span>{' '}
                      <span style={{ color: 'var(--acid)' }}>{m.match || '(empty)'}</span>{' '}
                      <span style={{ color: 'var(--mute)' }}>@ {m.index}</span>
                      {m.groups.length > 0 && (
                        <div style={{ marginTop: '.25rem', color: 'var(--mute)' }}>
                          {m.groups.map((g, gi) => (
                            <div key={gi}>
                              group {gi + 1}:{' '}
                              <span style={{ color: 'var(--acid)' }}>
                                {g === '' ? '(empty)' : g}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </Panel>
      </IO>
    </>
  )
}
