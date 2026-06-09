'use client'

import { useMemo, useState } from 'react'
import {
  Segmented,
  Select,
  Toolbar,
  IO,
  Panel,
  TextArea,
  CopyButton,
  DownloadButton,
  Notice,
  Field,
} from '@/components/ui/kit'

type Lang = 'json' | 'css' | 'html' | 'js'
type Mode = 'beautify' | 'minify'

const LANGS = [
  { value: 'json', label: 'JSON' },
  { value: 'css', label: 'CSS' },
  { value: 'html', label: 'HTML/XML' },
  { value: 'js', label: 'JavaScript' },
]

const MODES = [
  { value: 'beautify', label: 'Beautify' },
  { value: 'minify', label: 'Minify' },
]

const INDENTS = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
  { value: 'tab', label: 'Tab' },
]

const META: Record<Lang, { filename: string; mime: string }> = {
  json: { filename: 'formatted.json', mime: 'application/json' },
  css: { filename: 'formatted.css', mime: 'text/css' },
  html: { filename: 'formatted.html', mime: 'text/html' },
  js: { filename: 'formatted.js', mime: 'text/javascript' },
}

function indentUnit(opt: string): string {
  if (opt === 'tab') return '\t'
  return ' '.repeat(Number(opt))
}

function jsonIndentArg(opt: string): string | number {
  return opt === 'tab' ? '\t' : Number(opt)
}

/* ---- JSON --------------------------------------------------------- */

function formatJson(src: string, mode: Mode, opt: string): string {
  const parsed = JSON.parse(src)
  return mode === 'minify'
    ? JSON.stringify(parsed)
    : JSON.stringify(parsed, null, jsonIndentArg(opt))
}

/* ---- CSS ---------------------------------------------------------- */

/** Strip /* ... *\/ comments (string-literal aware enough for CSS values). */
function stripCssComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '')
}

function minifyCss(src: string): string {
  return stripCssComments(src)
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim()
}

function beautifyCss(src: string, unit: string): string {
  // Normalise: drop comments, then tokenise around structural characters.
  const clean = stripCssComments(src).replace(/\s+/g, ' ').trim()
  let out = ''
  let depth = 0
  let buf = ''

  const pad = (n: number) => unit.repeat(Math.max(0, n))

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (ch === '{') {
      out += pad(depth) + buf.trim() + ' {\n'
      buf = ''
      depth++
    } else if (ch === '}') {
      const decl = buf.trim()
      if (decl) out += pad(depth) + decl + (decl.endsWith(';') ? '' : ';') + '\n'
      buf = ''
      depth--
      out += pad(depth) + '}\n'
    } else if (ch === ';') {
      const decl = buf.trim()
      if (decl) out += pad(depth) + decl + ';\n'
      buf = ''
    } else {
      buf += ch
    }
  }
  if (buf.trim()) out += pad(depth) + buf.trim() + '\n'
  return out.replace(/\n{2,}/g, '\n').trimEnd() + '\n'
}

/* ---- HTML / XML --------------------------------------------------- */

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])
// Tags whose text content should not be re-indented.
const RAW_TAGS = new Set(['pre', 'script', 'style', 'textarea'])

function minifyHtml(src: string): string {
  return src
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function beautifyHtml(src: string, unit: string): string {
  // Split into tag / text tokens.
  const tokens = src.replace(/>\s+</g, '><').match(/<[^>]+>|[^<]+/g) || []
  let depth = 0
  const lines: string[] = []
  const pad = (n: number) => unit.repeat(Math.max(0, n))
  let rawTag: string | null = null

  for (const tokRaw of tokens) {
    const tok = tokRaw
    // Inside a raw-content element: emit verbatim until its close tag.
    if (rawTag) {
      const closeRe = new RegExp(`^</${rawTag}\\b`, 'i')
      if (closeRe.test(tok.trim())) {
        depth--
        lines.push(pad(depth) + tok.trim())
        rawTag = null
      } else {
        lines.push(pad(depth + 1) + tok.replace(/\n/g, '\n' + pad(depth + 1)).trimEnd())
      }
      continue
    }

    const t = tok.trim()
    if (!t) continue

    if (t.startsWith('<!--')) {
      lines.push(pad(depth) + t)
    } else if (t.startsWith('<!') || t.startsWith('<?')) {
      // doctype / xml prolog
      lines.push(pad(depth) + t)
    } else if (/^<\//.test(t)) {
      depth--
      lines.push(pad(depth) + t)
    } else if (/^</.test(t)) {
      const nameMatch = t.match(/^<\s*([a-zA-Z0-9:-]+)/)
      const name = nameMatch ? nameMatch[1].toLowerCase() : ''
      const selfClosing = /\/>$/.test(t) || VOID_TAGS.has(name)
      lines.push(pad(depth) + t)
      if (!selfClosing) {
        if (RAW_TAGS.has(name)) {
          rawTag = name
        }
        depth++
      }
    } else {
      // text node
      lines.push(pad(depth) + t)
    }
  }
  return lines.join('\n').trimEnd() + '\n'
}

/* ---- JavaScript --------------------------------------------------- */

/** Walk JS char-by-char with awareness of strings, template literals, regex
 *  and comments so transforms don't corrupt literal contents. Returns a list
 *  of {type, text} tokens where "code" segments are safe to reformat. */
type JsTok = { type: 'code' | 'string' | 'comment'; text: string }

function tokenizeJs(src: string): JsTok[] {
  const toks: JsTok[] = []
  let i = 0
  const n = src.length
  let code = ''
  const flushCode = () => {
    if (code) {
      toks.push({ type: 'code', text: code })
      code = ''
    }
  }

  // Track previous significant char to disambiguate `/` (regex vs divide).
  let prevSig = ''

  while (i < n) {
    const ch = src[i]
    const next = src[i + 1]

    // line comment
    if (ch === '/' && next === '/') {
      flushCode()
      let j = i + 2
      while (j < n && src[j] !== '\n') j++
      toks.push({ type: 'comment', text: src.slice(i, j) })
      i = j
      continue
    }
    // block comment
    if (ch === '/' && next === '*') {
      flushCode()
      let j = i + 2
      while (j < n && !(src[j] === '*' && src[j + 1] === '/')) j++
      j = Math.min(j + 2, n)
      toks.push({ type: 'comment', text: src.slice(i, j) })
      i = j
      continue
    }
    // strings + template literals
    if (ch === '"' || ch === "'" || ch === '`') {
      flushCode()
      const quote = ch
      let j = i + 1
      while (j < n) {
        if (src[j] === '\\') {
          j += 2
          continue
        }
        if (src[j] === quote) {
          j++
          break
        }
        j++
      }
      toks.push({ type: 'string', text: src.slice(i, j) })
      prevSig = quote
      i = j
      continue
    }
    // regex literal (heuristic: `/` where a value cannot precede it)
    if (ch === '/' && (prevSig === '' || '(,=:[!&|?{};+-*%~^<>'.includes(prevSig))) {
      flushCode()
      let j = i + 1
      let inClass = false
      while (j < n) {
        const c = src[j]
        if (c === '\\') {
          j += 2
          continue
        }
        if (c === '[') inClass = true
        else if (c === ']') inClass = false
        else if (c === '/' && !inClass) {
          j++
          break
        } else if (c === '\n') break
        j++
      }
      // consume flags
      while (j < n && /[a-z]/i.test(src[j])) j++
      toks.push({ type: 'string', text: src.slice(i, j) })
      prevSig = '/'
      i = j
      continue
    }

    code += ch
    if (!/\s/.test(ch)) prevSig = ch
    i++
  }
  flushCode()
  return toks
}

function minifyJs(src: string): string {
  const toks = tokenizeJs(src)
  let out = ''
  for (const tok of toks) {
    if (tok.type === 'comment') continue
    if (tok.type === 'string') {
      out += tok.text
      continue
    }
    // collapse whitespace runs in code to single spaces; trim around punctuation
    let c = tok.text.replace(/\s+/g, ' ')
    c = c.replace(/\s*([{}();,:=<>+\-*/%&|!?[\]])\s*/g, '$1')
    out += c
  }
  return out.trim()
}

function beautifyJs(src: string, unit: string): string {
  // Rebuild a normalised single-line-ish stream from tokens, inserting newline
  // markers after `;` and `{`, and around `}`. Literals/comments pass through.
  const toks = tokenizeJs(src)
  let stream = ''
  for (const tok of toks) {
    if (tok.type === 'string') {
      stream += tok.text
      continue
    }
    if (tok.type === 'comment') {
      // keep comments on their own line
      stream += '\n' + tok.text + '\n'
      continue
    }
    let c = tok.text.replace(/[\t ]+/g, ' ')
    c = c.replace(/\s*\n\s*/g, '\n')
    stream += c
  }

  // Now walk the stream and indent on brace/bracket/paren structure.
  // Use the tokenizer again on the stream so inserted newlines respect literals.
  const streamToks = tokenizeJs(stream)
  let depth = 0
  const pad = (n: number) => unit.repeat(Math.max(0, n))
  const lines: string[] = []
  let cur = ''

  const pushLine = () => {
    const trimmed = cur.trim()
    if (trimmed) lines.push(pad(depth) + trimmed)
    cur = ''
  }

  for (const tok of streamToks) {
    if (tok.type === 'string') {
      cur += tok.text
      continue
    }
    if (tok.type === 'comment') {
      pushLine()
      lines.push(pad(depth) + tok.text.trim())
      continue
    }
    for (const ch of tok.text) {
      if (ch === '{' || ch === '[' || ch === '(') {
        cur += ch
        if (ch === '{') {
          pushLine()
          depth++
        }
      } else if (ch === '}' || ch === ']' || ch === ')') {
        if (ch === '}') {
          pushLine()
          depth--
          cur = ch
          pushLine()
        } else {
          cur += ch
        }
      } else if (ch === ';') {
        cur += ch
        pushLine()
      } else if (ch === '\n') {
        pushLine()
      } else {
        cur += ch
      }
    }
  }
  pushLine()

  return lines
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l, idx, arr) => !(l === '' && arr[idx - 1] === ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd() + '\n'
}

/* ---- component ---------------------------------------------------- */

export default function CodeFormatter() {
  const [input, setInput] = useState('')
  const [lang, setLang] = useState<Lang>('json')
  const [mode, setMode] = useState<Mode>('beautify')
  const [indent, setIndent] = useState('2')

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    const unit = indentUnit(indent)
    try {
      let out = ''
      if (lang === 'json') {
        out = formatJson(input, mode, indent)
      } else if (lang === 'css') {
        out = mode === 'minify' ? minifyCss(input) : beautifyCss(input, unit)
      } else if (lang === 'html') {
        out = mode === 'minify' ? minifyHtml(input) : beautifyHtml(input, unit)
      } else {
        out = mode === 'minify' ? minifyJs(input) : beautifyJs(input, unit)
      }
      return { output: out, error: '' }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { output: '', error: `Formatting failed: ${msg}` }
    }
  }, [input, lang, mode, indent])

  const meta = META[lang]

  const hint =
    lang === 'js'
      ? 'JavaScript formatting is heuristic (brace/literal-aware, no full parse) — complex one-liners or unusual regex may format imperfectly.'
      : lang === 'html'
        ? 'HTML/XML uses a tag-based indenter (best effort); pre/script/style contents are kept verbatim.'
        : lang === 'css'
          ? 'CSS formatting strips comments on minify and re-lays declarations on beautify.'
          : 'JSON is parsed and re-serialised, so output is canonical.'

  return (
    <>
      <Toolbar>
        <Field label="Language">
          <Select value={lang} onChange={(v) => setLang(v as Lang)} options={LANGS} />
        </Field>
        <Segmented value={mode} onChange={(v) => setMode(v as Mode)} options={MODES} />
        <Field label="Indent">
          <Select value={indent} onChange={setIndent} options={INDENTS} />
        </Field>
      </Toolbar>

      <IO>
        <Panel title="source">
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={`Paste ${LANGS.find((l) => l.value === lang)?.label} here…`}
            rows={16}
          />
          <span className="hint-inline">{hint}</span>
        </Panel>

        <Panel
          title="formatted"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename={meta.filename} mime={meta.mime} />
            </>
          }
        >
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : (
            <>
              <TextArea
                value={output}
                readOnly
                placeholder="Formatted code will appear here…"
                rows={16}
              />
              {output && (
                <span className="hint-inline">
                  {input.length.toLocaleString()} chars in → {output.length.toLocaleString()} chars out
                </span>
              )}
            </>
          )}
        </Panel>
      </IO>
    </>
  )
}
