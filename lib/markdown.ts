// Small, dependency-free Markdown → HTML renderer for the Markdown to PDF tool.
// Safe by construction: raw HTML is escaped first, then Markdown syntax is applied,
// so user input can't inject markup. Supports headings, bold/italic/strike, inline
// + fenced code, links, images, blockquotes, ordered/unordered lists, GFM tables,
// horizontal rules and paragraphs — enough for clean documents.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inlineFmt(s: string): string {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, '<img alt="$1" src="$2" />')
    .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
}

const fmt = (s: string) => inlineFmt(escapeHtml(s))

const isSpecial = (l: string) =>
  /^(#{1,6}\s|```|\s*>|\s*([-*+]|\d+\.)\s|(-{3,}|\*{3,}|_{3,})\s*$)/.test(l)

function cells(row: string): string[] {
  return row
    .replace(/^\s*\|?/, '')
    .replace(/\|?\s*$/, '')
    .split('|')
    .map((c) => c.trim())
}

export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n?/g, '\n').split('\n')
  const out: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // fenced code block
    if (/^```/.test(line)) {
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++])
      i++ // closing fence
      out.push(`<pre><code>${escapeHtml(buf.join('\n'))}</code></pre>`)
      continue
    }

    // horizontal rule
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push('<hr />')
      i++
      continue
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      const lvl = h[1].length
      out.push(`<h${lvl}>${fmt(h[2].trim())}</h${lvl}>`)
      i++
      continue
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ''))
      out.push(`<blockquote>${fmt(buf.join(' '))}</blockquote>`)
      continue
    }

    // GFM table (header row + separator row)
    if (
      /\|/.test(line) &&
      i + 1 < lines.length &&
      /^\s*\|?[\s:|-]*-[\s:|-]*$/.test(lines[i + 1])
    ) {
      const header = cells(line)
      i += 2 // header + separator
      const rows: string[][] = []
      while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim() !== '') {
        rows.push(cells(lines[i++]))
      }
      const thead = `<thead><tr>${header.map((c) => `<th>${fmt(c)}</th>`).join('')}</tr></thead>`
      const tbody = `<tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${fmt(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody>`
      out.push(`<table>${thead}${tbody}</table>`)
      continue
    }

    // list (ordered or unordered)
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line)
      const buf: string[] = []
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        buf.push(lines[i++].replace(/^\s*([-*+]|\d+\.)\s+/, ''))
      }
      const tag = ordered ? 'ol' : 'ul'
      out.push(`<${tag}>${buf.map((it) => `<li>${fmt(it)}</li>`).join('')}</${tag}>`)
      continue
    }

    // blank
    if (line.trim() === '') {
      i++
      continue
    }

    // paragraph
    const buf: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !isSpecial(lines[i])) {
      buf.push(lines[i++])
    }
    out.push(`<p>${fmt(buf.join(' '))}</p>`)
  }

  return out.join('\n')
}

/** Wrap rendered body HTML in a clean, printable standalone document. */
export function markdownToDocument(md: string, title = 'Document'): string {
  const body = markdownToHtml(md)
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(
    title,
  )}</title><style>
    @page { margin: 20mm; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; line-height: 1.65; max-width: 780px; margin: 40px auto; padding: 0 24px; }
    h1,h2,h3,h4,h5,h6 { font-family: -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.25; margin: 1.4em 0 0.5em; }
    h1 { font-size: 2em; border-bottom: 2px solid #eee; padding-bottom: .2em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: .2em; }
    p { margin: 0 0 1em; }
    a { color: #0b66c3; }
    code { font-family: ui-monospace, Menlo, Consolas, monospace; background: #f4f4f4; padding: .15em .35em; border-radius: 3px; font-size: .9em; }
    pre { background: #f6f8fa; border: 1px solid #e5e5e5; border-radius: 6px; padding: 14px 16px; overflow: auto; }
    pre code { background: none; padding: 0; }
    blockquote { margin: 0 0 1em; padding: .4em 1em; border-left: 4px solid #ddd; color: #555; }
    ul,ol { margin: 0 0 1em; padding-left: 1.6em; }
    li { margin: .25em 0; }
    table { border-collapse: collapse; width: 100%; margin: 0 0 1em; }
    th,td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f6f8fa; }
    img { max-width: 100%; }
    hr { border: none; border-top: 1px solid #ddd; margin: 1.6em 0; }
  </style></head><body>${body}</body></html>`
}
