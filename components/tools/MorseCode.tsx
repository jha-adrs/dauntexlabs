'use client'

import { useMemo, useState } from 'react'
import { Segmented, Toolbar, IO, Panel, TextArea, CopyButton, Notice } from '@/components/ui/kit'

// International Morse Code map — letter/digit → morse
const CHAR_TO_MORSE: Record<string, string> = {
  A: '.-',    B: '-...',  C: '-.-.',  D: '-..',
  E: '.',     F: '..-.',  G: '--.',   H: '....',
  I: '..',    J: '.---',  K: '-.-',   L: '.-..',
  M: '--',    N: '-.',    O: '---',   P: '.--.',
  Q: '--.-',  R: '.-.',   S: '...',   T: '-',
  U: '..-',   V: '...-',  W: '.--',   X: '-..-',
  Y: '-.--',  Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.',
}

// Reverse map: morse → letter/digit
const MORSE_TO_CHAR: Record<string, string> = Object.fromEntries(
  Object.entries(CHAR_TO_MORSE).map(([k, v]) => [v, k])
)

function encode(text: string): { output: string; error: string } {
  if (!text) return { output: '', error: '' }
  const upper = text.toUpperCase()
  const words = upper.split(/\s+/).filter(Boolean)
  const encoded = words.map((word) => {
    const letters: string[] = []
    for (const ch of word) {
      const code = CHAR_TO_MORSE[ch]
      if (!code) {
        return null // unknown char
      }
      letters.push(code)
    }
    return letters.join(' ')
  })
  if (encoded.some((w) => w === null)) {
    return {
      output: '',
      error: 'Some characters are not in International Morse (A–Z, 0–9 only). Remove or replace them.',
    }
  }
  return { output: (encoded as string[]).join(' / '), error: '' }
}

function decode(morse: string): { output: string; error: string } {
  if (!morse.trim()) return { output: '', error: '' }
  const words = morse.split(/\s*\/\s*/)
  const decoded = words.map((word) => {
    const letters = word.trim().split(/\s+/).filter(Boolean)
    const chars = letters.map((code) => {
      const ch = MORSE_TO_CHAR[code]
      return ch ?? null
    })
    if (chars.some((c) => c === null)) return null
    return chars.join('')
  })
  if (decoded.some((w) => w === null)) {
    return {
      output: '',
      error: 'Unrecognized morse sequence. Letters separated by spaces, words by " / ".',
    }
  }
  return { output: (decoded as string[]).join(' '), error: '' }
}

export default function MorseCode() {
  const [mode, setMode] = useState('encode')
  const [input, setInput] = useState('')

  const { output, error } = useMemo(() => {
    return mode === 'encode' ? encode(input) : decode(input)
  }, [input, mode])

  const inputPlaceholder =
    mode === 'encode'
      ? 'Type text to encode, e.g. SOS…'
      : 'Enter morse code, e.g. ... --- ...'

  const inputTitle = mode === 'encode' ? 'text input' : 'morse input'
  const outputTitle = mode === 'encode' ? 'morse output' : 'text output'

  return (
    <>
      <Toolbar>
        <Segmented
          value={mode}
          onChange={(v) => {
            setMode(v)
            setInput('')
          }}
          options={[
            { value: 'encode', label: 'Encode' },
            { value: 'decode', label: 'Decode' },
          ]}
        />
      </Toolbar>

      <IO>
        <Panel title={inputTitle}>
          <TextArea
            value={input}
            onChange={setInput}
            placeholder={inputPlaceholder}
            rows={10}
          />
        </Panel>
        <Panel
          title={outputTitle}
          actions={<CopyButton text={output} />}
        >
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : (
            <TextArea value={output} readOnly placeholder="Result…" rows={10} />
          )}
        </Panel>
      </IO>
    </>
  )
}
