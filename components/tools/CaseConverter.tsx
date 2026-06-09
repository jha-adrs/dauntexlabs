'use client'
import { useMemo, useState } from 'react'
import { Panel, TextArea, CopyButton } from '@/components/ui/kit'

// ---------------------------------------------------------------------------
// Word splitter: handles spaces, hyphens, underscores, dots, and camelCase
// boundaries (lowerUPPER and UPPERLower transitions).
// ---------------------------------------------------------------------------
function splitWords(input: string): string[] {
  // Insert a space before camelCase transitions
  const expanded = input
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')       // camelCase → camel Case
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')   // ABCDef → ABC Def

  // Split on any non-alphanumeric run
  return expanded
    .split(/[^a-zA-Z0-9]+/)
    .filter(w => w.length > 0)
}

// ---------------------------------------------------------------------------
// Case converters
// ---------------------------------------------------------------------------
function toCamel(words: string[]): string {
  return words
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join('')
}

function toPascal(words: string[]): string {
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
}

function toSnake(words: string[]): string {
  return words.map(w => w.toLowerCase()).join('_')
}

function toConstant(words: string[]): string {
  return words.map(w => w.toUpperCase()).join('_')
}

function toKebab(words: string[]): string {
  return words.map(w => w.toLowerCase()).join('-')
}

function toTitleCase(words: string[]): string {
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

function toSentence(words: string[]): string {
  const joined = words.map(w => w.toLowerCase()).join(' ')
  return joined.charAt(0).toUpperCase() + joined.slice(1)
}

function toLower(words: string[]): string {
  return words.map(w => w.toLowerCase()).join(' ')
}

function toUpper(words: string[]): string {
  return words.map(w => w.toUpperCase()).join(' ')
}

function toDot(words: string[]): string {
  return words.map(w => w.toLowerCase()).join('.')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type CaseEntry = { label: string; value: string }

export default function CaseConverter() {
  const [input, setInput] = useState('')

  const cases: CaseEntry[] = useMemo(() => {
    if (!input.trim()) {
      const labels = [
        'camelCase', 'PascalCase', 'snake_case', 'CONSTANT_CASE',
        'kebab-case', 'Title Case', 'Sentence case', 'lower case',
        'UPPER CASE', 'dot.case',
      ]
      return labels.map(label => ({ label, value: '' }))
    }

    const words = splitWords(input)
    return [
      { label: 'camelCase',      value: toCamel(words)    },
      { label: 'PascalCase',     value: toPascal(words)   },
      { label: 'snake_case',     value: toSnake(words)    },
      { label: 'CONSTANT_CASE',  value: toConstant(words) },
      { label: 'kebab-case',     value: toKebab(words)    },
      { label: 'Title Case',     value: toTitleCase(words)},
      { label: 'Sentence case',  value: toSentence(words) },
      { label: 'lower case',     value: toLower(words)    },
      { label: 'UPPER CASE',     value: toUpper(words)    },
      { label: 'dot.case',       value: toDot(words)      },
    ]
  }, [input])

  return (
    <>
      <Panel title="Input">
        <TextArea
          value={input}
          onChange={setInput}
          placeholder="Enter text to convert — e.g. hello world, helloWorld, hello-world…"
          rows={4}
        />
      </Panel>

      <Panel title="All Cases">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
          {cases.map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 4,
                background: 'var(--ink-850)',
                border: '1px solid var(--line)',
                minHeight: '2.4rem',
              }}
            >
              <span
                style={{
                  width: '8.5rem',
                  flexShrink: 0,
                  color: 'var(--mute)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.02em',
                }}
              >
                {label}
              </span>
              <code
                style={{
                  flex: 1,
                  color: 'var(--bone)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  wordBreak: 'break-all',
                  minWidth: 0,
                }}
              >
                {value || <span style={{ color: 'var(--mute-2)' }}>—</span>}
              </code>
              <div style={{ flexShrink: 0 }}>
                <CopyButton text={value} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}
