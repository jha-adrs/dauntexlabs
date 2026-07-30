import { describe, it, expect } from 'vitest'
import { markdownToHtml, markdownToDocument } from '@/lib/markdown'

describe('markdownToHtml', () => {
  it('renders headings', () => {
    expect(markdownToHtml('# Title')).toContain('<h1>Title</h1>')
    expect(markdownToHtml('### Sub')).toContain('<h3>Sub</h3>')
  })
  it('renders inline bold, italic and code', () => {
    const h = markdownToHtml('**b** *i* `c`')
    expect(h).toContain('<strong>b</strong>')
    expect(h).toContain('<em>i</em>')
    expect(h).toContain('<code>c</code>')
  })
  it('renders links with safe rel', () => {
    expect(markdownToHtml('[x](https://a.com)')).toContain(
      '<a href="https://a.com" target="_blank" rel="noopener noreferrer">x</a>',
    )
  })
  it('escapes raw HTML (no injection)', () => {
    const h = markdownToHtml('<script>alert(1)</script>')
    expect(h).not.toContain('<script>')
    expect(h).toContain('&lt;script&gt;')
  })
  it('renders fenced code blocks with escaped content', () => {
    const h = markdownToHtml('```\n<b>hi</b>\n```')
    expect(h).toContain('<pre><code>')
    expect(h).toContain('&lt;b&gt;hi&lt;/b&gt;')
  })
  it('renders lists', () => {
    expect(markdownToHtml('- a\n- b')).toContain('<ul><li>a</li><li>b</li></ul>')
    expect(markdownToHtml('1. a\n2. b')).toContain('<ol><li>a</li><li>b</li></ol>')
  })
  it('renders GFM tables', () => {
    const h = markdownToHtml('| A | B |\n| --- | --- |\n| 1 | 2 |')
    expect(h).toContain('<table>')
    expect(h).toContain('<th>A</th>')
    expect(h).toContain('<td>1</td>')
  })
  it('renders hr and blockquote', () => {
    expect(markdownToHtml('---')).toContain('<hr />')
    expect(markdownToHtml('> quote')).toContain('<blockquote>quote</blockquote>')
  })
})

describe('markdownToDocument', () => {
  it('wraps content in a standalone printable document', () => {
    const d = markdownToDocument('# Hi', 'My Doc')
    expect(d.startsWith('<!doctype html>')).toBe(true)
    expect(d).toContain('<title>My Doc</title>')
    expect(d).toContain('<h1>Hi</h1>')
    expect(d).toContain('@page')
  })
})
