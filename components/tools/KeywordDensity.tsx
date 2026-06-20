'use client'

import { useMemo, useState } from 'react'
import { Toolbar, Toggle, IO, Panel, TextArea, Select, Notice } from '@/components/ui/kit'

// Common English stop words
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'not',
  'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'this', 'that',
  'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you',
  'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their',
  'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why', 'if',
  'then', 'than', 'because', 'while', 'although', 'though', 'since',
  'until', 'unless', 'after', 'before', 'about', 'above', 'below',
  'between', 'into', 'through', 'during', 'without', 'within', 'along',
  'following', 'across', 'behind', 'beyond', 'plus', 'except', 'up',
  'out', 'around', 'down', 'off', 'over', 'under', 'again', 'further',
  'once', 'here', 'there', 'all', 'each', 'every', 'few', 'more',
  'most', 'other', 'some', 'such', 'only', 'own', 'same', 'also', 'just',
  'now', 's', 't', 've', 'll', 're', 'd', 'm',
])

type WordEntry = { word: string; count: number; density: number }

function analyze(
  text: string,
  ignoreStop: boolean,
  minLen: number,
): { words: WordEntry[]; total: number } {
  if (!text.trim()) return { words: [], total: 0 }

  // Tokenize: lowercase, strip punctuation, split on whitespace
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^['\-]+|['\-]+$/g, ''))
    .filter((w) => w.length > 0)

  const total = tokens.length
  if (total === 0) return { words: [], total: 0 }

  const freq: Map<string, number> = new Map()
  for (const token of tokens) {
    if (token.length < minLen) continue
    if (ignoreStop && STOP_WORDS.has(token)) continue
    freq.set(token, (freq.get(token) ?? 0) + 1)
  }

  const entries: WordEntry[] = Array.from(freq.entries())
    .map(([word, count]) => ({
      word,
      count,
      density: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))

  return { words: entries, total }
}

const TOP_N_OPTIONS = [
  { value: '10', label: 'Top 10' },
  { value: '20', label: 'Top 20' },
  { value: '50', label: 'Top 50' },
  { value: '100', label: 'Top 100' },
]

const MIN_LEN_OPTIONS = [
  { value: '1', label: 'Min 1 char' },
  { value: '2', label: 'Min 2 chars' },
  { value: '3', label: 'Min 3 chars' },
  { value: '4', label: 'Min 4 chars' },
  { value: '5', label: 'Min 5 chars' },
]

export default function KeywordDensity() {
  const [text, setText] = useState('')
  const [ignoreStop, setIgnoreStop] = useState(false)
  const [topN, setTopN] = useState('20')
  const [minLen, setMinLen] = useState('2')

  const { words, total } = useMemo(
    () => analyze(text, ignoreStop, parseInt(minLen, 10)),
    [text, ignoreStop, minLen],
  )

  const displayed = words.slice(0, parseInt(topN, 10))

  return (
    <>
      <Toolbar>
        <Select value={topN} onChange={setTopN} options={TOP_N_OPTIONS} />
        <Select value={minLen} onChange={setMinLen} options={MIN_LEN_OPTIONS} />
        <Toggle checked={ignoreStop} onChange={setIgnoreStop} label="Ignore stop words" />
      </Toolbar>

      <IO>
        <Panel title="content">
          <TextArea
            value={text}
            onChange={setText}
            placeholder="Paste your content here…"
            rows={16}
            mono={false}
          />
        </Panel>

        <Panel title="keyword density">
          {!text.trim() ? (
            <Notice kind="info">Paste content on the left to analyse keyword density.</Notice>
          ) : total === 0 || words.length === 0 ? (
            <Notice kind="info">No words found with current filters.</Notice>
          ) : (
            <>
              <div
                style={{
                  marginBottom: '0.75rem',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--ink-400)',
                  fontFamily: 'var(--ff-mono)',
                }}
              >
                {total} total words &bull; {words.length} unique (filtered)
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontFamily: 'var(--ff-mono)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid var(--line-strong)',
                        color: 'var(--ink-400)',
                        textAlign: 'left',
                      }}
                    >
                      <th style={{ padding: '0.4rem 0.5rem', fontWeight: 500 }}>#</th>
                      <th style={{ padding: '0.4rem 0.5rem', fontWeight: 500 }}>Keyword</th>
                      <th style={{ padding: '0.4rem 0.5rem', fontWeight: 500, textAlign: 'right' }}>Count</th>
                      <th style={{ padding: '0.4rem 0.5rem', fontWeight: 500, textAlign: 'right' }}>Density</th>
                      <th style={{ padding: '0.4rem 0.75rem', fontWeight: 500 }}>Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((entry, i) => (
                      <tr
                        key={entry.word}
                        style={{
                          borderBottom: '1px solid var(--line)',
                          color: i === 0 ? 'var(--acid)' : 'var(--bone)',
                        }}
                      >
                        <td style={{ padding: '0.35rem 0.5rem', color: 'var(--ink-500)' }}>{i + 1}</td>
                        <td style={{ padding: '0.35rem 0.5rem' }}>{entry.word}</td>
                        <td style={{ padding: '0.35rem 0.5rem', textAlign: 'right' }}>{entry.count}</td>
                        <td style={{ padding: '0.35rem 0.5rem', textAlign: 'right' }}>
                          {entry.density.toFixed(2)}%
                        </td>
                        <td style={{ padding: '0.35rem 0.75rem', minWidth: '80px' }}>
                          <div
                            style={{
                              height: '6px',
                              background: 'var(--ink-700)',
                              borderRadius: '3px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(100, (entry.count / (displayed[0]?.count || 1)) * 100)}%`,
                                background: 'var(--acid)',
                                borderRadius: '3px',
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Panel>
      </IO>
    </>
  )
}
