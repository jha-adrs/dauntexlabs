'use client'

import { useMemo, useState } from 'react'
import { Toggle, Toolbar, IO, Panel, TextArea, CopyButton, DownloadButton } from '@/components/ui/kit'

/* Keywords that start a major clause and go on their own (un-indented) line. */
const NEWLINE_KEYWORDS: string[] = [
  'SELECT',
  'FROM',
  'WHERE',
  'INNER JOIN',
  'LEFT OUTER JOIN',
  'RIGHT OUTER JOIN',
  'FULL OUTER JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'FULL JOIN',
  'CROSS JOIN',
  'JOIN',
  'ON',
  'GROUP BY',
  'ORDER BY',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'UNION ALL',
  'UNION',
  'INSERT INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE FROM',
]

/* Boolean connectors that go on an indented new line. */
const INDENT_KEYWORDS: string[] = ['AND', 'OR']

/* Other words we recognise as keywords purely for casing. */
const OTHER_KEYWORDS: string[] = [
  'AS',
  'IN',
  'IS',
  'NOT',
  'NULL',
  'LIKE',
  'BETWEEN',
  'EXISTS',
  'DISTINCT',
  'ASC',
  'DESC',
  'BY',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'ALL',
  'INTO',
  'SET',
  'TRUE',
  'FALSE',
  'LEFT',
  'RIGHT',
  'INNER',
  'OUTER',
  'FULL',
  'CROSS',
  'JOIN',
]

/* Single-word keywords (for casing only) derived from every list above. */
const KEYWORD_WORDS = new Set<string>(
  [...NEWLINE_KEYWORDS, ...INDENT_KEYWORDS, ...OTHER_KEYWORDS]
    .flatMap((k) => k.split(' '))
    .map((w) => w.toUpperCase()),
)

const INDENT = '  '

type Token = { value: string; isString: boolean }

/**
 * Split SQL into tokens, keeping quoted strings (single/double) intact as a
 * single token so their contents are never reformatted, and treating
 * parentheses and commas as standalone tokens.
 */
function tokenize(sql: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const n = sql.length

  while (i < n) {
    const ch = sql[i]

    // whitespace — skip (tokens are joined with explicit spacing later)
    if (/\s/.test(ch)) {
      i++
      continue
    }

    // quoted string: ' or "
    if (ch === "'" || ch === '"') {
      const quote = ch
      let str = ch
      i++
      while (i < n) {
        str += sql[i]
        // handle doubled-quote escape ('' or "")
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) {
            str += sql[i + 1]
            i += 2
            continue
          }
          i++
          break
        }
        i++
      }
      tokens.push({ value: str, isString: true })
      continue
    }

    // punctuation that should stand alone
    if (ch === ',' || ch === '(' || ch === ')') {
      tokens.push({ value: ch, isString: false })
      i++
      continue
    }

    // a run of non-space, non-quote, non-punct characters
    let word = ''
    while (i < n && !/[\s'",()]/.test(sql[i])) {
      word += sql[i]
      i++
    }
    tokens.push({ value: word, isString: false })
  }

  return tokens
}

/** Casing for a single non-string token. */
function caseWord(word: string, uppercase: boolean): string {
  if (!uppercase) return word
  if (KEYWORD_WORDS.has(word.toUpperCase())) return word.toUpperCase()
  return word
}

/**
 * Try to match a multi-word newline/indent keyword starting at `idx`.
 * Returns the matched phrase (canonical, upper-cased) and how many tokens it
 * consumed, or null.
 */
function matchPhrase(tokens: Token[], idx: number, phrases: string[]): { phrase: string; len: number } | null {
  // Longest phrases first so "INNER JOIN" wins over "JOIN".
  const sorted = [...phrases].sort((a, b) => b.split(' ').length - a.split(' ').length)
  for (const phrase of sorted) {
    const parts = phrase.split(' ')
    let ok = true
    for (let k = 0; k < parts.length; k++) {
      const tk = tokens[idx + k]
      if (!tk || tk.isString || tk.value.toUpperCase() !== parts[k]) {
        ok = false
        break
      }
    }
    if (ok) return { phrase, len: parts.length }
  }
  return null
}

function formatSql(sql: string, uppercase: boolean): string {
  const tokens = tokenize(sql)
  if (!tokens.length) return ''

  let out = ''
  let depth = 0 // parenthesis nesting for indentation
  let atLineStart = true

  const pad = () => INDENT.repeat(depth)

  const newline = () => {
    out = out.replace(/[ \t]+$/, '')
    out += '\n' + pad()
    atLineStart = true
  }

  const append = (text: string, spaceBefore = true) => {
    if (!atLineStart && spaceBefore && !/\s$/.test(out)) out += ' '
    out += text
    atLineStart = false
  }

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i]

    if (tk.isString) {
      append(tk.value)
      continue
    }

    const upper = tk.value.toUpperCase()

    // major clause keyword → new line at current depth
    const major = matchPhrase(tokens, i, NEWLINE_KEYWORDS)
    if (major) {
      if (out.trim().length) newline()
      append(uppercase ? major.phrase : tokens.slice(i, i + major.len).map((t) => t.value).join(' '), false)
      i += major.len - 1
      continue
    }

    // AND / OR → indented new line (one level deeper than current depth)
    if (INDENT_KEYWORDS.includes(upper)) {
      out = out.replace(/[ \t]+$/, '')
      out += '\n' + pad() + INDENT
      atLineStart = true
      append(caseWord(tk.value, uppercase), false)
      continue
    }

    if (tk.value === ',') {
      // comma hugs the previous token, output stays compact
      out = out.replace(/[ \t]+$/, '')
      out += ','
      atLineStart = false
      continue
    }

    if (tk.value === '(') {
      append('(')
      depth++
      continue
    }

    if (tk.value === ')') {
      if (depth > 0) depth--
      append(')')
      continue
    }

    append(caseWord(tk.value, uppercase))
  }

  return out.trim()
}

export default function SqlFormatter() {
  const [input, setInput] = useState('')
  const [uppercase, setUppercase] = useState(true)

  const output = useMemo(() => {
    if (!input.trim()) return ''
    return formatSql(input, uppercase)
  }, [input, uppercase])

  return (
    <>
      <Toolbar>
        <Toggle checked={uppercase} onChange={setUppercase} label="Uppercase keywords" />
      </Toolbar>

      <IO>
        <Panel title="sql input">
          <TextArea
            value={input}
            onChange={setInput}
            placeholder="select a, b from t where x = 1 and y = 2"
            rows={16}
          />
          <span className="hint-inline">heuristic formatter · runs entirely in your browser</span>
        </Panel>

        <Panel
          title="formatted sql"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename="formatted.sql" mime="text/plain" />
            </>
          }
        >
          <TextArea value={output} readOnly placeholder="Formatted SQL will appear here…" rows={16} />
        </Panel>
      </IO>
    </>
  )
}
