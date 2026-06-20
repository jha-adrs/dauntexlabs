'use client'

import { useMemo, useState } from 'react'
import { Toolbar, IO, Panel, TextArea } from '@/components/ui/kit'

function computeStats(text: string) {
  if (!text) {
    return {
      charsWithSpaces: 0,
      charsNoSpaces: 0,
      words: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      readingTime: 0,
    }
  }

  const charsWithSpaces = text.length
  const charsNoSpaces = text.replace(/\s/g, '').length

  // Words: split on whitespace, filter empty
  const wordMatches = text.trim().match(/\S+/g)
  const words = wordMatches ? wordMatches.length : 0

  // Sentences: end with . ! ? (allow trailing spaces/newlines)
  const sentenceMatches = text.match(/[^.!?]*[.!?]+/g)
  const sentences = sentenceMatches ? sentenceMatches.filter((s) => s.trim().length > 0).length : 0

  // Paragraphs: blocks separated by one or more blank lines
  const paragraphBlocks = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
  const paragraphs = paragraphBlocks.length

  // Lines: split by newline
  const lines = text.split('\n').length

  // Reading time @ 200 wpm
  const readingTime = Math.ceil(words / 200)

  return { charsWithSpaces, charsNoSpaces, words, sentences, paragraphs, lines, readingTime }
}

const statStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: '12px',
  padding: '16px',
}

const cardStyle: React.CSSProperties = {
  background: 'var(--ink-850)',
  border: '1px solid var(--line)',
  borderRadius: '6px',
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
}

const valueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '1.5rem',
  color: 'var(--acid)',
  lineHeight: 1,
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  color: 'var(--mute)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

export default function WordCounter() {
  const [input, setInput] = useState('')

  const stats = useMemo(() => computeStats(input), [input])

  const statItems = [
    { label: 'Characters (with spaces)', value: stats.charsWithSpaces },
    { label: 'Characters (no spaces)', value: stats.charsNoSpaces },
    { label: 'Words', value: stats.words },
    { label: 'Sentences', value: stats.sentences },
    { label: 'Paragraphs', value: stats.paragraphs },
    { label: 'Lines', value: stats.lines },
    { label: 'Reading time', value: `${stats.readingTime} min` },
  ]

  return (
    <>
      <IO>
        <Panel title="text input">
          <TextArea
            value={input}
            onChange={setInput}
            placeholder="Paste or type your text here…"
            rows={14}
            mono={false}
          />
        </Panel>
        <Panel title="statistics">
          <div style={statStyle}>
            {statItems.map(({ label, value }) => (
              <div key={label} style={cardStyle}>
                <span style={valueStyle}>{value}</span>
                <span style={labelStyle}>{label}</span>
              </div>
            ))}
          </div>
        </Panel>
      </IO>
    </>
  )
}
