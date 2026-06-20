'use client'

import { useMemo, useState } from 'react'
import { Toolbar, Toggle, IO, Panel, TextArea, CopyButton, Notice } from '@/components/ui/kit'

function toHashtag(phrase: string, camelCase: boolean): string {
  // Strip non-alphanumeric characters (keep spaces for splitting)
  const cleaned = phrase.replace(/[^a-zA-Z0-9\s]/g, ' ').trim()
  if (!cleaned) return ''

  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''

  let tag: string
  if (camelCase && words.length > 1) {
    // CamelCase: capitalize first letter of each word after the first
    tag = words[0].toLowerCase() + words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
  } else {
    // Concatenate all words lowercase
    tag = words.join('').toLowerCase()
  }

  return '#' + tag
}

function generateHashtags(input: string, camelCase: boolean): string[] {
  if (!input.trim()) return []

  // Split on commas or newlines to get individual phrases
  const phrases = input
    .split(/[\n,]+/)
    .map((p) => p.trim())
    .filter(Boolean)

  const seen = new Set<string>()
  const tags: string[] = []

  for (const phrase of phrases) {
    const tag = toHashtag(phrase, camelCase)
    if (tag && !seen.has(tag.toLowerCase())) {
      seen.add(tag.toLowerCase())
      tags.push(tag)
    }
  }

  return tags
}

export default function HashtagGenerator() {
  const [input, setInput] = useState('')
  const [camelCase, setCamelCase] = useState(true)

  const tags = useMemo(() => generateHashtags(input, camelCase), [input, camelCase])
  const output = tags.join(' ')

  return (
    <>
      <Toolbar>
        <Toggle
          checked={camelCase}
          onChange={setCamelCase}
          label="CamelCase multi-word phrases"
        />
      </Toolbar>

      <IO>
        <Panel title="keywords / phrases">
          <TextArea
            value={input}
            onChange={setInput}
            placeholder="social media, marketing, content creation"
            rows={12}
            mono={false}
          />
          <div
            style={{
              marginTop: '0.5rem',
              fontSize: 'var(--text-xs)',
              color: 'var(--ink-500)',
              fontFamily: 'var(--ff-mono)',
            }}
          >
            One keyword or phrase per line, or comma-separated
          </div>
        </Panel>

        <Panel
          title="hashtags"
          actions={<CopyButton text={output} />}
        >
          {!input.trim() ? (
            <Notice kind="info">Enter keywords or phrases on the left to generate hashtags.</Notice>
          ) : tags.length === 0 ? (
            <Notice kind="info">No valid hashtags could be generated from the input.</Notice>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                {tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontFamily: 'var(--ff-mono)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--acid)',
                      background: 'var(--ink-800)',
                      border: '1px solid var(--line)',
                      borderRadius: '4px',
                      padding: '0.2rem 0.5rem',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div
                style={{
                  fontFamily: 'var(--ff-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--ink-500)',
                  borderTop: '1px solid var(--line)',
                  paddingTop: '0.5rem',
                }}
              >
                {tags.length} hashtag{tags.length !== 1 ? 's' : ''} &bull; {output.length} chars
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <TextArea value={output} readOnly rows={3} placeholder="hashtags…" />
              </div>
            </>
          )}
        </Panel>
      </IO>
    </>
  )
}
