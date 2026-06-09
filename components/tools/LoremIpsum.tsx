'use client'

import { useCallback, useState } from 'react'
import { Button, CopyButton, DownloadButton, Field, Notice, Panel, Segmented, TextArea, TextInput, Toggle, Toolbar } from '@/components/ui/kit'

/* ---- word bank ---------------------------------------------------- */

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'eu', 'fugiat', 'nulla', 'pariatur', 'excepteur',
  'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui',
  'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'at', 'vero',
  'eos', 'accusamus', 'iusto', 'odio', 'dignissimos', 'ducimus', 'blanditiis',
  'praesentium', 'voluptatum', 'deleniti', 'atque', 'corrupti', 'quos', 'quas',
  'perspiciatis', 'unde', 'omnis', 'iste', 'natus', 'error', 'totam', 'rem',
  'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo', 'inventore', 'veritatis',
  'quasi', 'architecto', 'beatae', 'vitae', 'dicta', 'explicabo', 'nemo',
  'ipsam', 'quia', 'voluptas', 'aspernatur', 'odit', 'fugit', 'consequuntur',
  'magni', 'dolores', 'ratione', 'sequi', 'nesciunt', 'neque', 'porro',
  'quisquam', 'dolorem', 'numquam', 'eius', 'modi', 'tempora', 'incidunt',
  'magnam', 'quaerat', 'soluta', 'nobis', 'eligendi', 'optio', 'cumque',
  'impedit', 'quo', 'maxime', 'placeat', 'facere', 'possimus', 'assumenda',
  'repellendus', 'temporibus', 'autem', 'quibusdam', 'officiis', 'debitis',
  'necessitatibus', 'saepe', 'eveniet', 'voluptates', 'repudiandae', 'recusandae',
  'itaque', 'earum', 'hic', 'tenetur', 'sapiente', 'delectus', 'reiciendis',
  'voluptatibus', 'maiores', 'alias', 'perferendis', 'doloremque', 'laudantium',
]

const CLASSIC_START = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'

function rand(max: number): number {
  return Math.floor(Math.random() * max)
}

function pick<T>(arr: T[]): T {
  return arr[rand(arr.length)]
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function generateWord(): string {
  return pick(LOREM_WORDS)
}

function generateSentence(): string {
  const wordCount = 8 + rand(12) // 8-19 words
  const words: string[] = []
  for (let i = 0; i < wordCount; i++) words.push(generateWord())
  // occasionally add a comma
  for (let i = 2; i < words.length - 1; i++) {
    if (rand(5) === 0) words[i] = words[i] + ','
  }
  return capitalize(words.join(' ').replace(/,\s*$/, '')) + '.'
}

function generateParagraph(): string {
  const sentenceCount = 3 + rand(5) // 3-7 sentences
  const sentences: string[] = []
  for (let i = 0; i < sentenceCount; i++) sentences.push(generateSentence())
  return sentences.join(' ')
}

function generate(unit: string, count: number, startWithClassic: boolean): string {
  const n = Math.max(1, Math.min(500, count))

  if (unit === 'words') {
    const words: string[] = []
    if (startWithClassic) {
      // extract first N classic words
      const classicWords = CLASSIC_START.replace(/[^a-z ]/gi, '').toLowerCase().split(/\s+/)
      for (let i = 0; i < Math.min(n, classicWords.length); i++) words.push(classicWords[i])
    }
    while (words.length < n) words.push(generateWord())
    return words.slice(0, n).join(' ')
  }

  if (unit === 'sentences') {
    const sentences: string[] = []
    if (startWithClassic) sentences.push(CLASSIC_START)
    while (sentences.length < n) sentences.push(generateSentence())
    return sentences.slice(0, n).join(' ')
  }

  // paragraphs
  const paragraphs: string[] = []
  if (startWithClassic) paragraphs.push(CLASSIC_START + ' ' + generateSentence() + ' ' + generateSentence())
  while (paragraphs.length < n) paragraphs.push(generateParagraph())
  return paragraphs.slice(0, n).join('\n\n')
}

/* ---- component ---------------------------------------------------- */

export default function LoremIpsum() {
  const [unit, setUnit] = useState('paragraphs')
  const [count, setCount] = useState('3')
  const [classic, setClassic] = useState(true)
  const [output, setOutput] = useState(() => generate('paragraphs', 3, true))

  const countNum = parseInt(count, 10)
  const countValid = Number.isFinite(countNum) && countNum >= 1

  const handleGenerate = useCallback(() => {
    if (!countValid) return
    setOutput(generate(unit, countNum, classic))
  }, [unit, countNum, classic, countValid])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Toolbar>
        <Segmented
          value={unit}
          onChange={(v) => setUnit(v)}
          options={[
            { value: 'paragraphs', label: 'Paragraphs' },
            { value: 'sentences', label: 'Sentences' },
            { value: 'words', label: 'Words' },
          ]}
        />
        <Toggle checked={classic} onChange={setClassic} label={'Start with “Lorem ipsum…”'} />
      </Toolbar>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <Field label="Count">
          <TextInput value={count} onChange={setCount} type="number" />
        </Field>
        <Button variant="primary" onClick={handleGenerate} disabled={!countValid}>
          Generate
        </Button>
      </div>

      {!countValid && (
        <Notice kind="error">Enter a whole number ≥ 1.</Notice>
      )}

      <Panel
        title="output"
        actions={
          <>
            <CopyButton text={output} />
            <DownloadButton text={output} filename="lorem-ipsum.txt" mime="text/plain" />
          </>
        }
      >
        <TextArea value={output} readOnly rows={18} placeholder="Press Generate to create text…" />
      </Panel>
    </div>
  )
}
