'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, Segmented, Toolbar, IO, Panel, Notice, CopyButton } from '@/components/ui/kit'

type Style = 'APA' | 'MLA' | 'Chicago'
type SourceType = 'Book' | 'Website'

function italics(s: string): string {
  // We render as plain text; asterisks can't show real italics, so we just return s
  return s
}

function buildApaBook(author: string, year: string, title: string, publisher: string): string {
  // APA 7th: Author, A. A. (Year). *Title of work*. Publisher.
  const parts: string[] = []
  if (author) parts.push(author.trim().replace(/\.?$/, '.'))
  if (year) parts.push(`(${year.trim()}).`)
  if (title) parts.push(`${italics(title.trim())}.`)
  if (publisher) parts.push(`${publisher.trim()}.`)
  return parts.join(' ')
}

function buildMlaBook(author: string, title: string, publisher: string, year: string): string {
  // MLA 9th: Author. *Title*. Publisher, Year.
  const parts: string[] = []
  if (author) parts.push(author.trim().replace(/\.?$/, '.'))
  if (title) parts.push(`${italics(title.trim())}.`)
  if (publisher && year) parts.push(`${publisher.trim()}, ${year.trim()}.`)
  else if (publisher) parts.push(`${publisher.trim()}.`)
  else if (year) parts.push(`${year.trim()}.`)
  return parts.join(' ')
}

function buildChicagoBook(author: string, title: string, publisher: string, year: string): string {
  // Chicago Notes-Bibliography: Author. *Title*. Publisher, Year.
  const parts: string[] = []
  if (author) parts.push(author.trim().replace(/\.?$/, '.'))
  if (title) parts.push(`${italics(title.trim())}.`)
  if (publisher && year) parts.push(`${publisher.trim()}, ${year.trim()}.`)
  else if (publisher) parts.push(`${publisher.trim()}.`)
  else if (year) parts.push(`${year.trim()}.`)
  return parts.join(' ')
}

function buildApaWebsite(
  author: string,
  year: string,
  title: string,
  siteName: string,
  url: string,
  accessDate: string,
): string {
  // APA 7th website: Author, A. A. (Year, Month Day). Title. Site Name. URL
  const parts: string[] = []
  if (author) parts.push(author.trim().replace(/\.?$/, '.'))
  if (year) parts.push(`(${year.trim()}).`)
  if (title) parts.push(`${title.trim()}.`)
  if (siteName) parts.push(`${italics(siteName.trim())}.`)
  if (url) parts.push(url.trim())
  // APA doesn't require access date unless content can change, but we include if provided
  if (accessDate) parts.push(`Retrieved ${accessDate.trim()}.`)
  return parts.join(' ')
}

function buildMlaWebsite(
  author: string,
  title: string,
  siteName: string,
  url: string,
  accessDate: string,
  year: string,
): string {
  // MLA 9th: Author. "Title." Site Name, Publisher/Year, URL. Accessed Date.
  const parts: string[] = []
  if (author) parts.push(author.trim().replace(/\.?$/, '.'))
  if (title) parts.push(`"${title.trim()}."`)
  const siteYear = [siteName && italics(siteName.trim()), year && year.trim()]
    .filter(Boolean)
    .join(', ')
  if (siteYear) parts.push(`${siteYear},`)
  if (url) parts.push(`${url.trim()}.`)
  if (accessDate) parts.push(`Accessed ${accessDate.trim()}.`)
  return parts.join(' ')
}

function buildChicagoWebsite(
  author: string,
  title: string,
  siteName: string,
  url: string,
  accessDate: string,
  year: string,
): string {
  // Chicago: Author. "Title." Site Name. Month Day, Year. Accessed Date. URL.
  const parts: string[] = []
  if (author) parts.push(author.trim().replace(/\.?$/, '.'))
  if (title) parts.push(`"${title.trim()}."`)
  if (siteName) parts.push(`${italics(siteName.trim())}.`)
  if (year) parts.push(`${year.trim()}.`)
  if (accessDate) parts.push(`Accessed ${accessDate.trim()}.`)
  if (url) parts.push(`${url.trim()}.`)
  return parts.join(' ')
}

export default function CitationGenerator() {
  const [style, setStyle] = useState<Style>('APA')
  const [sourceType, setSourceType] = useState<SourceType>('Book')

  // Shared fields
  const [author, setAuthor] = useState('')
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')

  // Book fields
  const [publisher, setPublisher] = useState('')

  // Website fields
  const [siteName, setSiteName] = useState('')
  const [url, setUrl] = useState('')
  const [accessDate, setAccessDate] = useState('')

  const citation = useMemo((): string => {
    if (!author && !title && !year) return ''

    if (sourceType === 'Book') {
      switch (style) {
        case 'APA':
          return buildApaBook(author, year, title, publisher)
        case 'MLA':
          return buildMlaBook(author, title, publisher, year)
        case 'Chicago':
          return buildChicagoBook(author, title, publisher, year)
      }
    } else {
      switch (style) {
        case 'APA':
          return buildApaWebsite(author, year, title, siteName, url, accessDate)
        case 'MLA':
          return buildMlaWebsite(author, title, siteName, url, accessDate, year)
        case 'Chicago':
          return buildChicagoWebsite(author, title, siteName, url, accessDate, year)
      }
    }
    return ''
  }, [style, sourceType, author, title, year, publisher, siteName, url, accessDate])

  const isEmpty = !author && !title && !year

  return (
    <>
      <Toolbar>
        <Segmented
          value={style}
          onChange={(v) => setStyle(v as Style)}
          options={[
            { value: 'APA', label: 'APA' },
            { value: 'MLA', label: 'MLA' },
            { value: 'Chicago', label: 'Chicago' },
          ]}
        />
        <Segmented
          value={sourceType}
          onChange={(v) => setSourceType(v as SourceType)}
          options={[
            { value: 'Book', label: 'Book' },
            { value: 'Website', label: 'Website' },
          ]}
        />
      </Toolbar>

      <IO>
        <Panel title="source details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field label="Author(s)">
              <TextInput
                value={author}
                onChange={setAuthor}
                placeholder={
                  style === 'APA'
                    ? 'e.g. Smith, J. A.'
                    : style === 'MLA'
                      ? 'e.g. Smith, John'
                      : 'e.g. Smith, John'
                }
              />
            </Field>

            <Field label="Title">
              <TextInput value={title} onChange={setTitle} placeholder="e.g. Deep Work" />
            </Field>

            <Field label="Year">
              <TextInput value={year} onChange={setYear} placeholder="e.g. 2020" type="number" />
            </Field>

            {sourceType === 'Book' && (
              <Field label="Publisher">
                <TextInput
                  value={publisher}
                  onChange={setPublisher}
                  placeholder="e.g. Focus Press"
                />
              </Field>
            )}

            {sourceType === 'Website' && (
              <>
                <Field label="Site / Organisation Name">
                  <TextInput
                    value={siteName}
                    onChange={setSiteName}
                    placeholder="e.g. Wikipedia"
                  />
                </Field>
                <Field label="URL">
                  <TextInput
                    value={url}
                    onChange={setUrl}
                    placeholder="e.g. https://example.com/page"
                  />
                </Field>
                <Field label="Access date">
                  <TextInput
                    value={accessDate}
                    onChange={setAccessDate}
                    placeholder={
                      style === 'APA'
                        ? 'e.g. June 20, 2026'
                        : style === 'MLA'
                          ? 'e.g. 20 June 2026'
                          : 'e.g. June 20, 2026'
                    }
                  />
                </Field>
              </>
            )}
          </div>
        </Panel>

        <Panel title="citation" actions={<CopyButton text={citation} />}>
          {isEmpty && <Notice kind="info">Fill in the source details to generate a citation.</Notice>}
          {!isEmpty && !citation && (
            <Notice kind="info">Add more fields to complete the citation.</Notice>
          )}
          {!isEmpty && citation && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-400)',
                  fontFamily: 'var(--ff-mono)',
                }}
              >
                {style} · {sourceType}
              </div>
              <blockquote
                style={{
                  margin: 0,
                  padding: '1rem',
                  background: 'var(--ink-800, #1a1a1a)',
                  borderLeft: '3px solid var(--acid)',
                  borderRadius: '0 4px 4px 0',
                  fontFamily: 'var(--ff-mono)',
                  fontSize: '0.875rem',
                  lineHeight: 1.7,
                  color: 'var(--bone)',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {citation}
              </blockquote>
            </div>
          )}
        </Panel>
      </IO>
    </>
  )
}
