'use client'

import { useMemo, useState } from 'react'
import {
  Toolbar,
  Select,
  Toggle,
  Field,
  TextArea,
  Notice,
  Panel,
  IO,
} from '@/components/ui/kit'

type Format = 'auto' | 'markdown' | 'html' | 'json' | 'xml' | 'csv' | 'yaml'

/* ---- HTML escaping -------------------------------------------------- */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/* ---- minimal, safe Markdown renderer -------------------------------
   Strategy: escape ALL raw HTML up front, then build markup from the
   escaped text only. The output therefore never contains attacker HTML. */

function renderInline(escaped: string): string {
  let s = escaped
  // inline code first (so other rules don't touch its contents much)
  s = s.replace(/`([^`]+)`/g, (_m, code) => `<code class="fv-code">${code}</code>`)
  // links: [text](url) — sanitize url scheme
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, url) => {
    const safeUrl = /^(https?:|mailto:|#|\/)/i.test(url) ? url : '#'
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`
  })
  // bold then italic
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
  return s
}

function markdownToHtml(raw: string): string {
  const escaped = escapeHtml(raw)
  const lines = escaped.split(/\r?\n/)
  const out: string[] = []
  let i = 0
  let inFence = false
  let fenceBuf: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let paraBuf: string[] = []

  const flushPara = () => {
    if (paraBuf.length) {
      out.push(`<p>${renderInline(paraBuf.join(' '))}</p>`)
      paraBuf = []
    }
  }
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`)
      listType = null
    }
  }

  while (i < lines.length) {
    const line = lines[i]

    // fenced code block
    if (/^```/.test(line.trim())) {
      if (!inFence) {
        flushPara()
        closeList()
        inFence = true
        fenceBuf = []
      } else {
        out.push(`<pre class="fv-pre"><code>${fenceBuf.join('\n')}</code></pre>`)
        inFence = false
      }
      i++
      continue
    }
    if (inFence) {
      fenceBuf.push(line)
      i++
      continue
    }

    // blank line
    if (line.trim() === '') {
      flushPara()
      closeList()
      i++
      continue
    }

    // horizontal rule
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushPara()
      closeList()
      out.push('<hr class="fv-hr" />')
      i++
      continue
    }

    // headings
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      flushPara()
      closeList()
      const level = h[1].length
      out.push(`<h${level} class="fv-h">${renderInline(h[2].trim())}</h${level}>`)
      i++
      continue
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      flushPara()
      closeList()
      out.push(`<blockquote class="fv-bq">${renderInline(line.replace(/^\s*>\s?/, ''))}</blockquote>`)
      i++
      continue
    }

    // unordered list
    const ul = line.match(/^\s*[-*+]\s+(.*)$/)
    if (ul) {
      flushPara()
      if (listType !== 'ul') {
        closeList()
        out.push('<ul class="fv-ul">')
        listType = 'ul'
      }
      out.push(`<li>${renderInline(ul[1])}</li>`)
      i++
      continue
    }

    // ordered list
    const ol = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ol) {
      flushPara()
      if (listType !== 'ol') {
        closeList()
        out.push('<ol class="fv-ol">')
        listType = 'ol'
      }
      out.push(`<li>${renderInline(ol[1])}</li>`)
      i++
      continue
    }

    // paragraph text
    closeList()
    paraBuf.push(line.trim())
    i++
  }

  if (inFence) out.push(`<pre class="fv-pre"><code>${fenceBuf.join('\n')}</code></pre>`)
  flushPara()
  closeList()
  return out.join('\n')
}

/* ---- XML pretty printer -------------------------------------------- */

function prettyXml(raw: string): { text: string; error: string } {
  const trimmed = raw.trim()
  try {
    const doc = new DOMParser().parseFromString(trimmed, 'application/xml')
    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      return { text: '', error: parserError.textContent || 'XML parse error.' }
    }
  } catch {
    /* fall through to text-based indenter */
  }
  // Token-based indenter (works even if DOMParser is lenient).
  const tokens = trimmed.replace(/>\s*</g, '>\n<').split('\n')
  let depth = 0
  const lines: string[] = []
  for (const tokRaw of tokens) {
    const tok = tokRaw.trim()
    if (!tok) continue
    const isClosing = /^<\//.test(tok)
    const isSelfClosing = /\/>$/.test(tok) || /^<\?/.test(tok) || /^<!/.test(tok)
    const isOpening = /^<[^/!?]/.test(tok) && !isSelfClosing
    const hasInlineClose = isOpening && /<\/[^>]+>$/.test(tok)
    if (isClosing) depth = Math.max(0, depth - 1)
    lines.push('  '.repeat(depth) + tok)
    if (isOpening && !hasInlineClose) depth++
  }
  return { text: lines.join('\n'), error: '' }
}

/* ---- CSV parser (quoted-field aware) ------------------------------- */

function parseCsv(raw: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else {
      if (c === '"') {
        inQuotes = true
      } else if (c === ',') {
        row.push(field)
        field = ''
      } else if (c === '\n') {
        row.push(field)
        rows.push(row)
        row = []
        field = ''
      } else {
        field += c
      }
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/* ---- best-effort YAML view ----------------------------------------- */

type YamlNode = { indent: number; key: string; value: string; isItem: boolean }

function yamlLines(raw: string): YamlNode[] {
  const out: YamlNode[] = []
  for (const lineRaw of raw.replace(/\r\n/g, '\n').split('\n')) {
    const line = lineRaw.replace(/\t/g, '  ')
    if (!line.trim()) continue
    if (/^\s*#/.test(line)) continue
    const indent = line.length - line.trimStart().length
    let content = line.trim()
    let isItem = false
    if (content.startsWith('- ')) {
      isItem = true
      content = content.slice(2).trim()
    } else if (content === '-') {
      isItem = true
      content = ''
    }
    const colon = content.indexOf(':')
    if (colon >= 0 && !content.startsWith('http')) {
      out.push({
        indent,
        key: content.slice(0, colon).trim(),
        value: content.slice(colon + 1).trim(),
        isItem,
      })
    } else {
      out.push({ indent, key: '', value: content, isItem })
    }
  }
  return out
}

/* ---- format auto-detection ----------------------------------------- */

function detectFormat(raw: string): Exclude<Format, 'auto'> {
  const t = raw.trim()
  if (!t) return 'markdown'
  if (t.startsWith('{') || t.startsWith('[')) {
    try {
      JSON.parse(t)
      return 'json'
    } catch {
      /* not strict JSON */
    }
  }
  if (/^<\?xml/i.test(t)) return 'xml'
  if (/^<!doctype html/i.test(t) || /<html[\s>]/i.test(t)) return 'html'
  if (/^</.test(t)) {
    // generic tag soup: html if it has common html tags, else xml
    return /<(div|span|p|a|body|head|table|ul|li|h[1-6]|img|br)[\s/>]/i.test(t) ? 'html' : 'xml'
  }
  // YAML-ish: key: value lines or list items, no commas dominating
  const lines = t.split('\n').filter((l) => l.trim())
  if (lines.length && lines.every((l) => /^\s*([\w.-]+\s*:|- )/.test(l))) return 'yaml'
  // CSV: has commas and multiple lines
  if (t.includes(',') && t.includes('\n')) return 'csv'
  if (/^#{1,6}\s|\*\*|`|^\s*[-*+]\s|\[[^\]]+\]\(/m.test(t)) return 'markdown'
  return 'markdown'
}

export default function FileViewer() {
  const [input, setInput] = useState('')
  const [format, setFormat] = useState<Format>('auto')
  const [fullscreen, setFullscreen] = useState(false)

  const effective = useMemo<Exclude<Format, 'auto'>>(
    () => (format === 'auto' ? detectFormat(input) : format),
    [format, input],
  )

  const previewHeight = fullscreen ? 720 : 400

  const cell: React.CSSProperties = {
    border: '1px solid var(--line-strong)',
    padding: '6px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    textAlign: 'left',
    verticalAlign: 'top',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }

  function renderPreview() {
    if (!input.trim()) {
      return <Notice kind="info">Paste content on the left to preview it here.</Notice>
    }

    if (effective === 'markdown') {
      return (
        <div
          className="fv-markdown"
          style={{ color: 'var(--bone)', fontSize: 14, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: markdownToHtml(input) }}
        />
      )
    }

    if (effective === 'html') {
      return (
        <iframe
          title="html-preview"
          srcDoc={input}
          sandbox=""
          style={{ width: '100%', height: previewHeight, border: '1px solid var(--line)', background: '#fff' }}
        />
      )
    }

    if (effective === 'json') {
      try {
        const pretty = JSON.stringify(JSON.parse(input), null, 2)
        return (
          <pre
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--bone)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {pretty}
          </pre>
        )
      } catch (e) {
        return (
          <Notice kind="error">
            Invalid JSON: {e instanceof Error ? e.message : 'parse error'}
          </Notice>
        )
      }
    }

    if (effective === 'xml') {
      const { text, error } = prettyXml(input)
      if (error) return <Notice kind="error">{error}</Notice>
      return (
        <pre
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--bone)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {text}
        </pre>
      )
    }

    if (effective === 'csv') {
      const rows = parseCsv(input)
      if (!rows.length) return <Notice kind="info">No rows detected.</Notice>
      const [header, ...body] = rows
      return (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                {header.map((h, i) => (
                  <th
                    key={i}
                    style={{ ...cell, color: 'var(--acid)', background: 'var(--ink-800)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri}>
                  {header.map((_h, ci) => (
                    <td key={ci} style={{ ...cell, color: 'var(--mute)' }}>
                      {r[ci] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (effective === 'yaml') {
      const nodes = yamlLines(input)
      return (
        <>
          <div className="hint-inline" style={{ marginBottom: 10 }}>
            best-effort structured view — not a full YAML parser (no anchors, multi-line scalars or flow style)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {nodes.map((n, i) => (
              <div
                key={i}
                style={{
                  paddingLeft: 12 + n.indent * 8,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  borderLeft: '1px solid var(--line)',
                }}
              >
                {n.isItem && <span style={{ color: 'var(--acid-dim)' }}>• </span>}
                {n.key && <span style={{ color: 'var(--acid)' }}>{n.key}: </span>}
                <span style={{ color: n.key ? 'var(--bone)' : 'var(--mute)' }}>{n.value}</span>
              </div>
            ))}
          </div>
        </>
      )
    }

    return null
  }

  return (
    <>
      <Toolbar>
        <Field label="Format">
          <Select
            value={format}
            onChange={(v) => setFormat(v as Format)}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'markdown', label: 'Markdown' },
              { value: 'html', label: 'HTML' },
              { value: 'json', label: 'JSON' },
              { value: 'xml', label: 'XML' },
              { value: 'csv', label: 'CSV' },
              { value: 'yaml', label: 'YAML' },
            ]}
          />
        </Field>
        <Toggle checked={fullscreen} onChange={setFullscreen} label="Tall preview" />
        {format === 'auto' && input.trim() && (
          <span className="hint-inline">detected: {effective}</span>
        )}
        <span className="hint-inline">HTML rendered in a sandboxed iframe · scripts disabled</span>
      </Toolbar>

      <IO>
        <Panel title="source">
          <TextArea
            value={input}
            onChange={setInput}
            placeholder="Paste Markdown, HTML, JSON, XML, CSV or YAML…"
            rows={fullscreen ? 30 : 18}
          />
        </Panel>
        <Panel title={`preview · ${effective}`}>
          <div
            style={{
              minHeight: previewHeight,
              maxHeight: fullscreen ? undefined : previewHeight + 80,
              overflow: 'auto',
              padding: effective === 'html' ? 0 : 4,
            }}
          >
            {renderPreview()}
          </div>
        </Panel>
      </IO>
    </>
  )
}
