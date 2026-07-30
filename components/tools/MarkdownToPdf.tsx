'use client'

// Markdown → PDF / HTML, fully client-side. Live preview via our own safe
// renderer; PDF via the browser's print-to-PDF (best fidelity, nothing uploaded);
// HTML + .md via direct download.
import { useMemo, useState } from 'react'
import {
  Toolbar,
  Button,
  IO,
  Panel,
  TextArea,
  TextInput,
  Field,
  CopyButton,
  DownloadButton,
  Notice,
} from '@/components/ui/kit'
import { markdownToHtml, markdownToDocument } from '@/lib/markdown'

const SAMPLE = `# Project Report

A quick demo of **Markdown to PDF**. Type on the left, preview on the right, then
export.

## Features
- Live preview as you type
- Export to **PDF** (via your browser) or **HTML**
- Runs entirely on your device — nothing is uploaded

## Example table
| Metric | Value |
| --- | --- |
| Users | 1,240 |
| Growth | 18% |

> Tip: use \`# heading\`, \`**bold**\`, lists, tables and \`code\`.

\`\`\`
const hello = "world"
\`\`\`

See [dauntexlabs](https://dauntexlabs.com) for more free tools.
`

export default function MarkdownToPdf() {
  const [md, setMd] = useState(SAMPLE)
  const [name, setName] = useState('document')
  const html = useMemo(() => markdownToHtml(md), [md])
  const doc = useMemo(() => markdownToDocument(md, name || 'Document'), [md, name])
  const safeName = name.trim() || 'document'

  function downloadPdf() {
    const iframe = document.createElement('iframe')
    Object.assign(iframe.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '0',
      height: '0',
      border: '0',
    })
    document.body.appendChild(iframe)
    const w = iframe.contentWindow
    if (!w) {
      document.body.removeChild(iframe)
      return
    }
    w.document.open()
    w.document.write(doc)
    w.document.close()
    setTimeout(() => {
      w.focus()
      w.print()
      setTimeout(() => document.body.removeChild(iframe), 1500)
    }, 300)
  }

  return (
    <>
      <Toolbar>
        <Field label="File name">
          <TextInput value={name} onChange={setName} placeholder="document" />
        </Field>
        <Button onClick={() => setMd(SAMPLE)}>Load sample</Button>
        <Button onClick={() => setMd('')}>Clear</Button>
      </Toolbar>

      <IO>
        <Panel title="markdown">
          <TextArea value={md} onChange={setMd} rows={20} placeholder="# Write Markdown here…" />
        </Panel>
        <Panel title="preview">
          {html ? (
            <div className="md-preview" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <Notice kind="info">Start typing to see a live preview.</Notice>
          )}
        </Panel>
      </IO>

      <Toolbar>
        <Button variant="primary" onClick={downloadPdf} disabled={!md.trim()}>
          Download PDF
        </Button>
        <DownloadButton text={doc} filename={`${safeName}.html`} mime="text/html" label="download HTML" />
        <DownloadButton text={md} filename={`${safeName}.md`} mime="text/markdown" label="download .md" />
        <CopyButton text={html} label="copy HTML" />
      </Toolbar>

      <Notice kind="info">
        “Download PDF” opens your browser’s print dialog — choose <b>Save as PDF</b> as the
        destination for a clean, text-based PDF. Everything is generated on your device; nothing is
        uploaded.
      </Notice>
    </>
  )
}
