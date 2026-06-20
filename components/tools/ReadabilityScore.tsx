'use client'

import { useMemo, useState } from 'react'
import { TextArea, Panel, IO, Notice } from '@/components/ui/kit'

function countSyllables(word: string): number {
  // Strip punctuation
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 0

  // Remove silent trailing 'e'
  const cleaned = w.replace(/e$/, '')

  // Count vowel groups
  const groups = cleaned.match(/[aeiouy]+/g)
  const count = groups ? groups.length : 0

  // At least 1 syllable per word
  return Math.max(count, 1)
}

function easeLabel(score: number): string {
  if (score >= 90) return 'Very Easy'
  if (score >= 80) return 'Easy'
  if (score >= 70) return 'Fairly Easy'
  if (score >= 60) return 'Standard'
  if (score >= 50) return 'Fairly Difficult'
  if (score >= 30) return 'Difficult'
  return 'Very Confusing'
}

function analyze(text: string) {
  // Split into sentences: ends with . ! ?
  const rawSentences = text
    .trim()
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const sentences = rawSentences.length || 1

  // Split into words: non-whitespace tokens
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.replace(/[^a-zA-Z]/g, '').length > 0)

  const wordCount = words.length
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0)

  if (wordCount === 0) {
    return null
  }

  const wordsPerSentence = wordCount / sentences
  const syllablesPerWord = syllableCount / wordCount

  const fleschEase = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord
  const fleschGrade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59

  return {
    words: wordCount,
    sentences,
    syllables: syllableCount,
    fleschEase: Math.round(fleschEase * 10) / 10,
    fleschGrade: Math.round(fleschGrade * 10) / 10,
    label: easeLabel(fleschEase),
  }
}

export default function ReadabilityScore() {
  const [text, setText] = useState('')

  const result = useMemo(() => {
    if (!text.trim()) return null
    return analyze(text)
  }, [text])

  return (
    <>
      <IO>
        <Panel title="input text">
          <TextArea
            value={text}
            onChange={setText}
            placeholder="Paste or type your text here…"
            rows={14}
            mono={false}
          />
        </Panel>

        <Panel title="readability scores">
          {!text.trim() ? (
            <Notice kind="info">Enter some text to see readability scores.</Notice>
          ) : result === null ? (
            <Notice kind="error">Could not parse text — try adding at least one word.</Notice>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Flesch Reading Ease */}
              <div
                style={{
                  background: 'var(--ink-800)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--ff-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '0.35rem',
                  }}
                >
                  Flesch Reading Ease
                </div>
                <div
                  style={{
                    fontFamily: 'var(--ff-display)',
                    fontSize: '2.5rem',
                    color: 'var(--acid)',
                    lineHeight: 1,
                  }}
                >
                  {result.fleschEase}
                </div>
                <div
                  style={{
                    marginTop: '0.4rem',
                    fontFamily: 'var(--ff-mono)',
                    fontSize: '0.8rem',
                    color: 'var(--bone)',
                  }}
                >
                  {result.label}
                </div>
                <div
                  style={{
                    marginTop: '0.25rem',
                    fontSize: '0.75rem',
                    color: 'var(--muted)',
                  }}
                >
                  Higher = easier to read (0–100 scale)
                </div>
              </div>

              {/* Flesch-Kincaid Grade */}
              <div
                style={{
                  background: 'var(--ink-800)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--ff-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '0.35rem',
                  }}
                >
                  Flesch-Kincaid Grade Level
                </div>
                <div
                  style={{
                    fontFamily: 'var(--ff-display)',
                    fontSize: '2.5rem',
                    color: 'var(--bone)',
                    lineHeight: 1,
                  }}
                >
                  {result.fleschGrade}
                </div>
                <div
                  style={{
                    marginTop: '0.25rem',
                    fontSize: '0.75rem',
                    color: 'var(--muted)',
                  }}
                >
                  Approximate U.S. school grade level
                </div>
              </div>

              {/* Counts */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                }}
              >
                {[
                  { label: 'Words', value: result.words },
                  { label: 'Sentences', value: result.sentences },
                  { label: 'Syllables', value: result.syllables },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      background: 'var(--ink-800)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--ff-display)',
                        fontSize: '1.5rem',
                        color: 'var(--bone)',
                      }}
                    >
                      {value}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--ff-mono)',
                        fontSize: '0.65rem',
                        color: 'var(--muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginTop: '0.2rem',
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </IO>
    </>
  )
}
