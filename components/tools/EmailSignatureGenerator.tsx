'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, TextArea, CopyButton, Notice, IO, Panel } from '@/components/ui/kit'

/** Escape a string for safe inclusion in HTML text/attribute context. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Build a clean inline-styled HTML email signature from already-escaped values.
 * Inline styles only — email clients strip <style>/external CSS.
 */
function buildSignature(f: {
  name: string
  title: string
  company: string
  email: string
  phone: string
  website: string
  tagline: string
}): string {
  const name = esc(f.name.trim())
  const title = esc(f.title.trim())
  const company = esc(f.company.trim())
  const email = esc(f.email.trim())
  const phone = esc(f.phone.trim())
  const websiteRaw = f.website.trim()
  const website = esc(websiteRaw)
  // Build an href for the website; default to https:// if no scheme present.
  const websiteHref = esc(
    websiteRaw && !/^https?:\/\//i.test(websiteRaw) ? `https://${websiteRaw}` : websiteRaw,
  )
  const tagline = esc(f.tagline.trim())

  const titleCompany = [title, company].filter(Boolean).join(', ')

  const rows: string[] = []

  if (name) {
    rows.push(
      `<div style="font-size:16px;font-weight:bold;color:#1a1a1a;">${name}</div>`,
    )
  }
  if (titleCompany) {
    rows.push(
      `<div style="font-size:13px;color:#666666;padding-top:2px;">${titleCompany}</div>`,
    )
  }

  const contact: string[] = []
  if (email) {
    contact.push(
      `<a href="mailto:${email}" style="color:#0a66c2;text-decoration:none;">${email}</a>`,
    )
  }
  if (phone) {
    contact.push(`<span style="color:#444444;">${phone}</span>`)
  }
  if (website) {
    contact.push(
      `<a href="${websiteHref}" style="color:#0a66c2;text-decoration:none;">${website}</a>`,
    )
  }
  if (contact.length) {
    rows.push(
      `<div style="font-size:13px;padding-top:6px;">${contact.join(
        ' <span style="color:#cccccc;">&bull;</span> ',
      )}</div>`,
    )
  }

  if (tagline) {
    rows.push(
      `<div style="font-size:12px;color:#999999;font-style:italic;padding-top:8px;">${tagline}</div>`,
    )
  }

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;line-height:1.4;">
  <tr><td style="border-left:3px solid #0a66c2;padding:2px 0 2px 12px;">
${rows.map((r) => `    ${r}`).join('\n')}
  </td></tr>
</table>`
}

export default function EmailSignatureGenerator() {
  const [name, setName] = useState('Ada Lovelace')
  const [title, setTitle] = useState('Lead Engineer')
  const [company, setCompany] = useState('Analytical Engines')
  const [email, setEmail] = useState('ada@example.com')
  const [phone, setPhone] = useState('+1 555 0100')
  const [website, setWebsite] = useState('example.com')
  const [tagline, setTagline] = useState('')

  const html = useMemo(
    () => buildSignature({ name, title, company, email, phone, website, tagline }),
    [name, title, company, email, phone, website, tagline],
  )

  const empty = ![name, title, company, email, phone, website, tagline].some((v) => v.trim())

  return (
    <IO>
      <Panel title="details">
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <Field label="Full name">
            <TextInput value={name} onChange={setName} placeholder="Ada Lovelace" />
          </Field>
          <Field label="Job title">
            <TextInput value={title} onChange={setTitle} placeholder="Lead Engineer" />
          </Field>
          <Field label="Company">
            <TextInput value={company} onChange={setCompany} placeholder="Acme Inc." />
          </Field>
          <Field label="Email">
            <TextInput value={email} onChange={setEmail} placeholder="you@example.com" />
          </Field>
          <Field label="Phone">
            <TextInput value={phone} onChange={setPhone} placeholder="+1 555 0100" />
          </Field>
          <Field label="Website">
            <TextInput value={website} onChange={setWebsite} placeholder="example.com" />
          </Field>
          <Field label="Tagline (optional)">
            <TextInput value={tagline} onChange={setTagline} placeholder="Building better tools" />
          </Field>
        </div>
      </Panel>

      <Panel
        title="signature"
        actions={<CopyButton text={html} label="copy HTML" />}
      >
        {empty ? (
          <Notice kind="info">Fill in at least one field to generate a signature.</Notice>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--muted)',
                  marginBottom: '0.4rem',
                  letterSpacing: '0.05em',
                }}
              >
                LIVE PREVIEW
              </span>
              <div
                style={{
                  background: '#ffffff',
                  color: '#1a1a1a',
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  overflowX: 'auto',
                }}
                // Safe: html is constructed entirely from HTML-escaped field values.
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
            <div>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--muted)',
                  marginBottom: '0.4rem',
                  letterSpacing: '0.05em',
                }}
              >
                HTML
              </span>
              <TextArea value={html} readOnly rows={10} />
            </div>
          </div>
        )}
      </Panel>
    </IO>
  )
}
