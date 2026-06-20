'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, TextArea, IO, Panel, Notice } from '@/components/ui/kit'

const TITLE_LIMIT = 60
const DESC_LIMIT = 160

/** Truncate `text` to `limit` characters, appending an ellipsis when cut. */
function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text
  return text.slice(0, limit).trimEnd() + '…'
}

/** Render a URL as a search engine breadcrumb-style display line. */
function formatUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return 'https://example.com'
  try {
    const u = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    const path = u.pathname === '/' ? '' : u.pathname.replace(/\/$/, '')
    const crumbs = path.split('/').filter(Boolean)
    return [u.hostname, ...crumbs].join(' › ')
  } catch {
    return trimmed
  }
}

function CharCount({ count, limit, label }: { count: number; limit: number; label: string }) {
  const over = count > limit
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
        color: over ? '#f7768e' : 'var(--mute)',
      }}
    >
      {label}: {count} / {limit}
    </span>
  )
}

export default function SerpPreview() {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')

  const titleCount = title.length
  const descCount = description.length
  const titleOver = titleCount > TITLE_LIMIT
  const descOver = descCount > DESC_LIMIT

  const { displayUrl, displayTitle, displayDesc } = useMemo(
    () => ({
      displayUrl: formatUrl(url),
      displayTitle: truncate(title.trim() || 'Your page title appears here', TITLE_LIMIT),
      displayDesc: truncate(
        description.trim() ||
          'Your meta description appears here. Aim for a clear, compelling summary of the page so it stands out in search results.',
        DESC_LIMIT,
      ),
    }),
    [url, title, description],
  )

  return (
    <>
      <IO>
        <Panel title="page details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Field label="title">
              <TextInput value={title} onChange={setTitle} placeholder="My Page — Brand" />
              <span style={{ marginTop: '0.3rem', display: 'inline-block' }}>
                <CharCount count={titleCount} limit={TITLE_LIMIT} label="title" />
              </span>
            </Field>
            <Field label="URL">
              <TextInput
                value={url}
                onChange={setUrl}
                placeholder="https://example.com/page"
              />
            </Field>
            <Field label="meta description">
              <TextArea
                value={description}
                onChange={setDescription}
                placeholder="A short, descriptive summary of the page…"
                rows={4}
                mono={false}
              />
              <span style={{ marginTop: '0.3rem', display: 'inline-block' }}>
                <CharCount count={descCount} limit={DESC_LIMIT} label="description" />
              </span>
            </Field>

            {titleOver && (
              <Notice kind="error">
                Title is over the {TITLE_LIMIT}-character limit and may be truncated in results.
              </Notice>
            )}
            {descOver && (
              <Notice kind="error">
                Description is over the {DESC_LIMIT}-character limit and may be truncated in
                results.
              </Notice>
            )}
          </div>
        </Panel>

        <Panel title="search result preview">
          <div
            style={{
              background: 'var(--ink-850)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '1rem 1.1rem',
              maxWidth: '600px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--mute)',
                marginBottom: '0.35rem',
                wordBreak: 'break-all',
              }}
            >
              {displayUrl}
            </div>
            <div
              style={{
                color: '#8ab4f8',
                fontSize: '1.15rem',
                lineHeight: 1.3,
                marginBottom: '0.4rem',
              }}
            >
              {displayTitle}
            </div>
            <div
              style={{
                color: 'var(--mute-2)',
                fontSize: '0.88rem',
                lineHeight: 1.5,
              }}
            >
              {displayDesc}
            </div>
          </div>
        </Panel>
      </IO>
    </>
  )
}
