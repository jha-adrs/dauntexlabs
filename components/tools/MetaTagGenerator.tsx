'use client'

import { useMemo, useState } from 'react'
import {
  Field,
  TextInput,
  TextArea,
  Select,
  Toggle,
  Toolbar,
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

/** Escape a string for safe use inside HTML text content (e.g. <title>). */
function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const ROBOTS_OPTIONS = [
  { value: 'index, follow', label: 'index, follow' },
  { value: 'noindex, nofollow', label: 'noindex, nofollow' },
  { value: 'index, nofollow', label: 'index, nofollow' },
  { value: 'noindex, follow', label: 'noindex, follow' },
  { value: 'noarchive', label: 'noarchive' },
  { value: 'nosnippet', label: 'nosnippet' },
]

export default function MetaTagGenerator() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [author, setAuthor] = useState('')
  const [canonical, setCanonical] = useState('')
  const [robots, setRobots] = useState('index, follow')
  const [viewport, setViewport] = useState(true)

  const output = useMemo(() => {
    // The robots and viewport tags carry defaults, so on their own they would
    // never let the empty state show. Only emit anything once the user has
    // supplied at least one piece of page content.
    const hasContent =
      !!title.trim() ||
      !!description.trim() ||
      !!keywords.trim() ||
      !!author.trim() ||
      !!canonical.trim()
    if (!hasContent) return ''

    const lines: string[] = []

    if (title.trim()) lines.push(`<title>${escapeText(title)}</title>`)
    if (description.trim())
      lines.push(`<meta name="description" content="${escapeAttr(description)}">`)
    if (keywords.trim()) lines.push(`<meta name="keywords" content="${escapeAttr(keywords)}">`)
    if (author.trim()) lines.push(`<meta name="author" content="${escapeAttr(author)}">`)
    if (robots.trim()) lines.push(`<meta name="robots" content="${escapeAttr(robots)}">`)
    if (canonical.trim()) lines.push(`<link rel="canonical" href="${escapeAttr(canonical)}">`)
    if (viewport)
      lines.push(`<meta name="viewport" content="width=device-width, initial-scale=1">`)

    return lines.join('\n')
  }, [title, description, keywords, author, canonical, robots, viewport])

  return (
    <>
      <IO>
        <Panel title="page details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Field label="page title">
              <TextInput value={title} onChange={setTitle} placeholder="My Page" />
            </Field>
            <Field label="meta description" hint="~155 characters is ideal">
              <TextArea
                value={description}
                onChange={setDescription}
                placeholder="A short, descriptive summary of the page…"
                rows={3}
                mono={false}
              />
            </Field>
            <Field label="keywords" hint="comma-separated">
              <TextInput
                value={keywords}
                onChange={setKeywords}
                placeholder="keyword one, keyword two"
              />
            </Field>
            <Field label="author">
              <TextInput value={author} onChange={setAuthor} placeholder="Jane Doe" />
            </Field>
            <Field label="canonical URL">
              <TextInput
                value={canonical}
                onChange={setCanonical}
                placeholder="https://example.com/page"
              />
            </Field>
            <Field label="robots">
              <Select value={robots} onChange={setRobots} options={ROBOTS_OPTIONS} />
            </Field>
            <Toggle checked={viewport} onChange={setViewport} label="responsive viewport tag" />
          </div>
        </Panel>

        <Panel title="generated tags" actions={<CopyButton text={output} />}>
          {output ? (
            <TextArea
              value={output}
              readOnly
              placeholder="Tags appear here…"
              rows={12}
            />
          ) : (
            <Notice kind="info">
              Fill in at least one field to generate your meta tags.
            </Notice>
          )}
        </Panel>
      </IO>
    </>
  )
}
