'use client'

import { useMemo, useState } from 'react'
import {
  Field,
  TextArea,
  Select,
  Toolbar,
  IO,
  Panel,
  CopyButton,
  DownloadButton,
  Notice,
} from '@/components/ui/kit'

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const CHANGEFREQ_OPTIONS = [
  { value: 'always', label: 'always' },
  { value: 'hourly', label: 'hourly' },
  { value: 'daily', label: 'daily' },
  { value: 'weekly', label: 'weekly' },
  { value: 'monthly', label: 'monthly' },
  { value: 'yearly', label: 'yearly' },
  { value: 'never', label: 'never' },
]

const PRIORITY_OPTIONS = [
  { value: '1.0', label: '1.0 (highest)' },
  { value: '0.9', label: '0.9' },
  { value: '0.8', label: '0.8' },
  { value: '0.7', label: '0.7' },
  { value: '0.6', label: '0.6' },
  { value: '0.5', label: '0.5 (default)' },
  { value: '0.4', label: '0.4' },
  { value: '0.3', label: '0.3' },
  { value: '0.2', label: '0.2' },
  { value: '0.1', label: '0.1 (lowest)' },
]

export default function SitemapGenerator() {
  const [urls, setUrls] = useState('')
  const [changefreq, setChangefreq] = useState('weekly')
  const [priority, setPriority] = useState('0.5')
  const [lastmod, setLastmod] = useState('')

  const output = useMemo(() => {
    const urlList = urls
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    if (urlList.length === 0) return ''

    const entries = urlList
      .map((url) => {
        const loc = xmlEscape(url)
        const lm = lastmod.trim() ? `\n    <lastmod>${xmlEscape(lastmod.trim())}</lastmod>` : ''
        const cf = `\n    <changefreq>${changefreq}</changefreq>`
        const pr = `\n    <priority>${priority}</priority>`
        return `  <url>\n    <loc>${loc}</loc>${lm}${cf}${pr}\n  </url>`
      })
      .join('\n')

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      entries,
      '</urlset>',
    ].join('\n')
  }, [urls, changefreq, priority, lastmod])

  return (
    <>
      <Toolbar>
        <Field label="Change frequency">
          <Select value={changefreq} onChange={setChangefreq} options={CHANGEFREQ_OPTIONS} />
        </Field>
        <Field label="Priority">
          <Select value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} />
        </Field>
        <Field label="Last modified (optional, e.g. 2024-01-15)">
          <input
            className="inp"
            type="date"
            value={lastmod}
            onChange={(e) => setLastmod(e.target.value)}
          />
        </Field>
      </Toolbar>

      <IO>
        <Panel title="urls — one per line">
          <TextArea
            value={urls}
            onChange={setUrls}
            placeholder={'https://example.com/\nhttps://example.com/about\nhttps://example.com/contact'}
            rows={14}
          />
        </Panel>

        <Panel
          title="sitemap.xml"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename="sitemap.xml" mime="application/xml" />
            </>
          }
        >
          {!output ? (
            <Notice kind="info">Enter at least one URL to generate a sitemap.</Notice>
          ) : (
            <TextArea value={output} readOnly rows={14} />
          )}
        </Panel>
      </IO>
    </>
  )
}
