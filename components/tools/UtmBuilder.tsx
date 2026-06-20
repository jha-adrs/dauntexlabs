'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, IO, Panel, CopyButton, Notice, Toolbar } from '@/components/ui/kit'

function buildUtmUrl(
  base: string,
  source: string,
  medium: string,
  campaign: string,
  term: string,
  content: string,
): { url: string; error: string } {
  const trimmed = base.trim()
  if (!trimmed) return { url: '', error: '' }

  // Basic URL validation — must have a protocol-like prefix or at least a dot
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    // Try prepending https:// and see if it parses
    try {
      parsed = new URL('https://' + trimmed)
    } catch {
      return { url: '', error: 'Base URL is not valid. Include the protocol, e.g. https://example.com' }
    }
    return { url: '', error: 'Base URL is not valid. Include the protocol, e.g. https://example.com' }
  }

  if (!parsed.protocol.startsWith('http')) {
    return { url: '', error: 'Base URL must use http or https.' }
  }

  const params: [string, string][] = []
  if (source.trim()) params.push(['utm_source', source.trim()])
  if (medium.trim()) params.push(['utm_medium', medium.trim()])
  if (campaign.trim()) params.push(['utm_campaign', campaign.trim()])
  if (term.trim()) params.push(['utm_term', term.trim()])
  if (content.trim()) params.push(['utm_content', content.trim()])

  for (const [k, v] of params) {
    parsed.searchParams.set(k, v)
  }

  return { url: parsed.toString(), error: '' }
}

export default function UtmBuilder() {
  const [baseUrl, setBaseUrl] = useState('')
  const [source, setSource] = useState('')
  const [medium, setMedium] = useState('')
  const [campaign, setCampaign] = useState('')
  const [term, setTerm] = useState('')
  const [content, setContent] = useState('')

  const { url, error } = useMemo(
    () => buildUtmUrl(baseUrl, source, medium, campaign, term, content),
    [baseUrl, source, medium, campaign, term, content],
  )

  return (
    <>
      <Toolbar>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-400)', fontFamily: 'var(--ff-mono)' }}>
          utm parameters are URL-encoded automatically
        </span>
      </Toolbar>

      <IO>
        <Panel title="parameters">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field label="Base URL *">
              <TextInput
                value={baseUrl}
                onChange={setBaseUrl}
                placeholder="https://example.com/landing"
              />
            </Field>
            <Field label="utm_source *">
              <TextInput value={source} onChange={setSource} placeholder="google" />
            </Field>
            <Field label="utm_medium *">
              <TextInput value={medium} onChange={setMedium} placeholder="cpc" />
            </Field>
            <Field label="utm_campaign *">
              <TextInput value={campaign} onChange={setCampaign} placeholder="spring_sale" />
            </Field>
            <Field label="utm_term (optional)">
              <TextInput value={term} onChange={setTerm} placeholder="running shoes" />
            </Field>
            <Field label="utm_content (optional)">
              <TextInput value={content} onChange={setContent} placeholder="hero_banner" />
            </Field>
          </div>
        </Panel>

        <Panel
          title="tagged URL"
          actions={<CopyButton text={url} />}
        >
          {error ? (
            <Notice kind="error">{error}</Notice>
          ) : url ? (
            <div
              style={{
                fontFamily: 'var(--ff-mono)',
                fontSize: 'var(--text-sm)',
                color: 'var(--bone)',
                wordBreak: 'break-all',
                lineHeight: 1.6,
                padding: '0.75rem',
                background: 'var(--ink-800)',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                minHeight: '6rem',
              }}
            >
              {url}
            </div>
          ) : (
            <div
              style={{
                fontFamily: 'var(--ff-mono)',
                fontSize: 'var(--text-sm)',
                color: 'var(--ink-500)',
                padding: '0.75rem',
                minHeight: '6rem',
              }}
            >
              Fill in Base URL + at least one parameter…
            </div>
          )}
        </Panel>
      </IO>
    </>
  )
}
