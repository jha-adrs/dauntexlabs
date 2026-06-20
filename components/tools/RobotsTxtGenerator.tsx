'use client'

import { useMemo, useState } from 'react'
import {
  Field,
  TextInput,
  TextArea,
  Toolbar,
  IO,
  Panel,
  CopyButton,
  DownloadButton,
  Notice,
} from '@/components/ui/kit'

export default function RobotsTxtGenerator() {
  const [userAgent, setUserAgent] = useState('*')
  const [disallow, setDisallow] = useState('')
  const [allow, setAllow] = useState('')
  const [crawlDelay, setCrawlDelay] = useState('')
  const [sitemapUrl, setSitemapUrl] = useState('')

  const output = useMemo(() => {
    const lines: string[] = []

    const ua = userAgent.trim() || '*'
    lines.push(`User-agent: ${ua}`)

    const disallowLines = disallow
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    for (const path of disallowLines) {
      lines.push(`Disallow: ${path}`)
    }

    const allowLines = allow
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    for (const path of allowLines) {
      lines.push(`Allow: ${path}`)
    }

    if (crawlDelay.trim()) {
      const n = Number(crawlDelay.trim())
      if (!isNaN(n) && n >= 0) {
        lines.push(`Crawl-delay: ${n}`)
      }
    }

    const sitemap = sitemapUrl.trim()
    if (sitemap) {
      lines.push('')
      lines.push(`Sitemap: ${sitemap}`)
    }

    return lines.join('\n')
  }, [userAgent, disallow, allow, crawlDelay, sitemapUrl])

  const isEmpty =
    !userAgent.trim() &&
    !disallow.trim() &&
    !allow.trim() &&
    !crawlDelay.trim() &&
    !sitemapUrl.trim()

  return (
    <>
      <Toolbar>
        <Field label="User-agent">
          <TextInput
            value={userAgent}
            onChange={setUserAgent}
            placeholder="*"
          />
        </Field>
        <Field label="Crawl-delay (optional)">
          <TextInput
            value={crawlDelay}
            onChange={setCrawlDelay}
            placeholder="e.g. 10"
            type="number"
          />
        </Field>
        <Field label="Sitemap URL (optional)">
          <TextInput
            value={sitemapUrl}
            onChange={setSitemapUrl}
            placeholder="https://example.com/sitemap.xml"
          />
        </Field>
      </Toolbar>

      <IO>
        <Panel title="paths">
          <Field label="Disallow (one path per line)">
            <TextArea
              value={disallow}
              onChange={setDisallow}
              placeholder={'/admin\n/private\n/tmp'}
              rows={6}
            />
          </Field>
          <Field label="Allow (one path per line)">
            <TextArea
              value={allow}
              onChange={setAllow}
              placeholder={'/public\n/assets'}
              rows={4}
            />
          </Field>
        </Panel>

        <Panel
          title="robots.txt"
          actions={
            <>
              <CopyButton text={output} />
              <DownloadButton text={output} filename="robots.txt" mime="text/plain" />
            </>
          }
        >
          {isEmpty ? (
            <Notice kind="info">Fill in the fields to generate your robots.txt.</Notice>
          ) : (
            <TextArea value={output} readOnly rows={14} />
          )}
        </Panel>
      </IO>
    </>
  )
}
