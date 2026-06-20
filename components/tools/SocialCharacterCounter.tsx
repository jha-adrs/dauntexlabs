'use client'

import { useMemo, useState } from 'react'
import { Field, TextArea, Panel, IO, Notice } from '@/components/ui/kit'

type Preset = {
  label: string
  limit: number
}

const PRESETS: Preset[] = [
  { label: 'Microblog post', limit: 280 },
  { label: 'Short bio', limit: 160 },
  { label: 'Photo caption', limit: 2200 },
  { label: 'Headline', limit: 70 },
  { label: 'Meta description', limit: 160 },
]

function countWords(text: string): number {
  if (!text.trim()) return 0
  return text.trim().split(/\s+/).length
}

function countLines(text: string): number {
  if (!text) return 0
  return text.split('\n').length
}

export default function SocialCharacterCounter() {
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    const chars = text.length
    const words = countWords(text)
    const lines = countLines(text)
    return { chars, words, lines }
  }, [text])

  return (
    <>
      <IO>
        <Panel title="input text">
          <TextArea
            value={text}
            onChange={setText}
            placeholder="Paste or type your content here…"
            rows={14}
            mono={false}
          />
        </Panel>

        <Panel title="counts &amp; limits">
          {/* Live stats row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                padding: '0.75rem',
                background: 'var(--ink-800)',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--ff-mono)',
                  fontSize: '1.5rem',
                  color: 'var(--acid)',
                  lineHeight: 1,
                }}
              >
                {stats.chars.toLocaleString()}
              </div>
              <div
                style={{
                  fontFamily: 'var(--ff-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--ink-400)',
                  marginTop: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                chars
              </div>
            </div>

            <div
              style={{
                padding: '0.75rem',
                background: 'var(--ink-800)',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--ff-mono)',
                  fontSize: '1.5rem',
                  color: 'var(--acid)',
                  lineHeight: 1,
                }}
              >
                {stats.words.toLocaleString()}
              </div>
              <div
                style={{
                  fontFamily: 'var(--ff-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--ink-400)',
                  marginTop: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                words
              </div>
            </div>

            <div
              style={{
                padding: '0.75rem',
                background: 'var(--ink-800)',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--ff-mono)',
                  fontSize: '1.5rem',
                  color: 'var(--acid)',
                  lineHeight: 1,
                }}
              >
                {stats.lines.toLocaleString()}
              </div>
              <div
                style={{
                  fontFamily: 'var(--ff-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--ink-400)',
                  marginTop: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                lines
              </div>
            </div>
          </div>

          {/* Preset limit table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {PRESETS.map((preset) => {
              const remaining = preset.limit - stats.chars
              const within = remaining >= 0
              const pct = Math.min(100, (stats.chars / preset.limit) * 100)

              return (
                <div
                  key={`${preset.label}-${preset.limit}`}
                  style={{
                    padding: '0.6rem 0.75rem',
                    background: 'var(--ink-800)',
                    border: `1px solid ${within ? 'var(--line)' : 'rgba(255,80,80,0.35)'}`,
                    borderRadius: '4px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--ff-mono)',
                        fontSize: '0.7rem',
                        color: 'var(--ink-300)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {preset.label} — {preset.limit.toLocaleString()}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--ff-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: within ? 'var(--acid)' : 'rgb(255,100,100)',
                      }}
                      aria-label={`${Math.abs(remaining)} ${within ? 'remaining' : 'over'}`}
                    >
                      {within
                        ? `${remaining.toLocaleString()} left`
                        : `${Math.abs(remaining).toLocaleString()} over`}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: '3px',
                      background: 'var(--ink-700)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: within ? 'var(--acid)' : 'rgb(255,100,100)',
                        borderRadius: '2px',
                        transition: 'width 0.15s ease',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {!text && (
            <Notice kind="info" >Enter text to see character, word, and line counts.</Notice>
          )}
        </Panel>
      </IO>
    </>
  )
}
