'use client'

import { useMemo, useState } from 'react'
import { Segmented, Toggle, Toolbar, IO, Panel, TextArea, CopyButton, Notice } from '@/components/ui/kit'

const NAMED_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&mdash;': '—',
  '&ndash;': '–',
  '&laquo;': '«',
  '&raquo;': '»',
  '&hellip;': '…',
  '&euro;': '€',
  '&pound;': '£',
  '&yen;': '¥',
  '&cent;': '¢',
  '&deg;': '°',
  '&plusmn;': '±',
  '&times;': '×',
  '&divide;': '÷',
  '&frac12;': '½',
  '&frac14;': '¼',
  '&frac34;': '¾',
  '&acute;': '´',
  '&grave;': '`',
  '&circ;': 'ˆ',
  '&tilde;': '˜',
  '&uml;': '¨',
  '&cedil;': '¸',
  '&alpha;': 'α',
  '&beta;': 'β',
  '&gamma;': 'γ',
  '&delta;': 'δ',
  '&epsilon;': 'ε',
  '&pi;': 'π',
  '&sigma;': 'σ',
  '&mu;': 'μ',
  '&omega;': 'ω',
  '&Omega;': 'Ω',
  '&infin;': '∞',
  '&sum;': '∑',
  '&radic;': '√',
  '&le;': '≤',
  '&ge;': '≥',
  '&ne;': '≠',
  '&asymp;': '≈',
  '&and;': '∧',
  '&or;': '∨',
  '&not;': '¬',
  '&forall;': '∀',
  '&exist;': '∃',
  '&empty;': '∅',
  '&isin;': '∈',
  '&notin;': '∉',
  '&sub;': '⊂',
  '&sup;': '⊃',
  '&cup;': '∪',
  '&cap;': '∩',
  '&larr;': '←',
  '&uarr;': '↑',
  '&rarr;': '→',
  '&darr;': '↓',
  '&harr;': '↔',
  '&bull;': '•',
  '&middot;': '·',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&ldquo;': '“',
  '&rdquo;': '”',
}

// Build reverse map for encoding named entities
const CHAR_TO_ENTITY: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function encodeEntities(input: string, nonAscii: boolean): string {
  let out = ''
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    const cp = input.codePointAt(i)!
    // Surrogate pair — advance extra
    const charLen = cp > 0xffff ? 2 : 1
    if (CHAR_TO_ENTITY[ch]) {
      out += CHAR_TO_ENTITY[ch]
    } else if (nonAscii && cp > 127) {
      out += `&#${cp};`
      if (charLen === 2) i++ // skip low surrogate
    } else {
      out += ch
      if (charLen === 2) {
        out += input[i + 1]
        i++
      }
    }
  }
  return out
}

function decodeEntities(input: string): string {
  // Replace all &name; named entities from our map
  let out = input.replace(/&[a-zA-Z]+;/g, (match) => NAMED_ENTITIES[match] ?? match)
  // Replace decimal numeric &#NNN;
  out = out.replace(/&#(\d+);/g, (_, dec) => {
    const cp = parseInt(dec, 10)
    try { return String.fromCodePoint(cp) } catch { return _ }
  })
  // Replace hex numeric &#xHH; or &#XHH;
  out = out.replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => {
    const cp = parseInt(hex, 16)
    try { return String.fromCodePoint(cp) } catch { return _ }
  })
  return out
}

export default function HtmlEntities() {
  const [mode, setMode] = useState('encode')
  const [nonAscii, setNonAscii] = useState(false)
  const [input, setInput] = useState('')

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: '' }
    try {
      if (mode === 'encode') {
        return { output: encodeEntities(input, nonAscii), error: '' }
      }
      return { output: decodeEntities(input), error: '' }
    } catch (e) {
      return { output: '', error: String(e) }
    }
  }, [input, mode, nonAscii])

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'encode', label: 'Encode' },
            { value: 'decode', label: 'Decode' },
          ]}
        />
        {mode === 'encode' && (
          <Toggle
            checked={nonAscii}
            onChange={setNonAscii}
            label="Encode non-ASCII"
          />
        )}
      </Toolbar>

      <IO>
        <Panel title={mode === 'encode' ? 'plain text' : 'HTML entities'}>
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={
              mode === 'encode'
                ? 'Enter text to encode, e.g. <a href="x">…'
                : 'Enter HTML entities to decode, e.g. &lt;a&gt;…'
            }
            rows={12}
          />
        </Panel>
        <Panel
          title={mode === 'encode' ? 'HTML entities' : 'plain text'}
          actions={<CopyButton text={output} />}
        >
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : (
            <TextArea value={output} readOnly placeholder="Result…" rows={12} />
          )}
        </Panel>
      </IO>
    </>
  )
}
