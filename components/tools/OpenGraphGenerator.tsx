'use client'

import { useMemo, useState } from 'react'
import {
  Field,
  TextInput,
  TextArea,
  Select,
  Toggle,
  IO,
  Panel,
  CopyButton,
  Notice,
} from '@/components/ui/kit'

/** Escape a string for safe use inside a double-quoted HTML attribute. */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const TYPE_OPTIONS = [
  { value: 'website', label: 'website' },
  { value: 'article', label: 'article' },
]

const CARD_OPTIONS = [
  { value: 'summary', label: 'summary' },
  { value: 'summary_large_image', label: 'summary (large image)' },
]

export default function OpenGraphGenerator() {
  const [ogTitle, setOgTitle] = useState('')
  const [ogDescription, setOgDescription] = useState('')
  const [ogType, setOgType] = useState('website')
  const [ogUrl, setOgUrl] = useState('')
  const [ogImage, setOgImage] = useState('')
  const [emitCard, setEmitCard] = useState(false)
  const [cardType, setCardType] = useState('summary_large_image')

  const output = useMemo(() => {
    // og:type carries a default, so it would never let the empty state show on
    // its own. Only emit anything once the user supplies real content.
    const hasContent =
      !!ogTitle.trim() || !!ogDescription.trim() || !!ogUrl.trim() || !!ogImage.trim()
    if (!hasContent) return ''

    const lines: string[] = []

    if (ogTitle.trim())
      lines.push(`<meta property="og:title" content="${escapeAttr(ogTitle)}">`)
    if (ogDescription.trim())
      lines.push(`<meta property="og:description" content="${escapeAttr(ogDescription)}">`)
    if (ogType.trim()) lines.push(`<meta property="og:type" content="${escapeAttr(ogType)}">`)
    if (ogUrl.trim()) lines.push(`<meta property="og:url" content="${escapeAttr(ogUrl)}">`)
    if (ogImage.trim()) lines.push(`<meta property="og:image" content="${escapeAttr(ogImage)}">`)

    if (emitCard) {
      lines.push(`<meta name="twitter:card" content="${escapeAttr(cardType)}">`)
      if (ogTitle.trim())
        lines.push(`<meta name="twitter:title" content="${escapeAttr(ogTitle)}">`)
      if (ogDescription.trim())
        lines.push(`<meta name="twitter:description" content="${escapeAttr(ogDescription)}">`)
      if (ogImage.trim())
        lines.push(`<meta name="twitter:image" content="${escapeAttr(ogImage)}">`)
    }

    return lines.join('\n')
  }, [ogTitle, ogDescription, ogType, ogUrl, ogImage, emitCard, cardType])

  return (
    <>
      <IO>
        <Panel title="open graph details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Field label="og:title">
              <TextInput value={ogTitle} onChange={setOgTitle} placeholder="My Page" />
            </Field>
            <Field label="og:description">
              <TextArea
                value={ogDescription}
                onChange={setOgDescription}
                placeholder="A short summary shown in link previews…"
                rows={3}
                mono={false}
              />
            </Field>
            <Field label="og:type">
              <Select value={ogType} onChange={setOgType} options={TYPE_OPTIONS} />
            </Field>
            <Field label="og:url">
              <TextInput
                value={ogUrl}
                onChange={setOgUrl}
                placeholder="https://example.com/page"
              />
            </Field>
            <Field label="og:image" hint="absolute URL, ~1200×630 recommended">
              <TextInput
                value={ogImage}
                onChange={setOgImage}
                placeholder="https://example.com/preview.png"
              />
            </Field>
            <Toggle checked={emitCard} onChange={setEmitCard} label="also emit social card tags" />
            {emitCard && (
              <Field label="card type">
                <Select value={cardType} onChange={setCardType} options={CARD_OPTIONS} />
              </Field>
            )}
          </div>
        </Panel>

        <Panel title="generated tags" actions={<CopyButton text={output} />}>
          {output ? (
            <TextArea value={output} readOnly placeholder="Tags appear here…" rows={12} />
          ) : (
            <Notice kind="info">
              Fill in at least one field to generate your tags.
            </Notice>
          )}
        </Panel>
      </IO>
    </>
  )
}
