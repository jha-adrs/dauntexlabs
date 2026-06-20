import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MarkdownTable from '@/components/tools/MarkdownTable'

const out = () =>
  (screen.getByPlaceholderText('GitHub-Flavored Markdown table will appear here…') as HTMLTextAreaElement).value

const typeCsv = (v: string) =>
  fireEvent.change(screen.getByPlaceholderText(/header first/), { target: { value: v } })

describe('MarkdownTable', () => {
  it('is empty for empty input', () => {
    render(<MarkdownTable />)
    expect(out()).toBe('')
  })

  it('builds a GFM table from CSV with header, separator and body rows', () => {
    render(<MarkdownTable />)
    typeCsv('a,b\n1,2')
    const value = out()
    expect(value).toContain('| a | b |')
    expect(value).toContain('| 1 | 2 |')
    // separator row of dashes
    expect(value.split('\n')[1]).toMatch(/^\|[\s:|-]+\|$/)
    expect(value).toMatch(/-{3,}/)
  })

  it('has exactly header + separator + body line count', () => {
    render(<MarkdownTable />)
    typeCsv('a,b\n1,2\n3,4')
    const lines = out().split('\n')
    expect(lines.length).toBe(4) // header, sep, 2 body rows
  })

  it('applies center alignment to the separator row', () => {
    render(<MarkdownTable />)
    fireEvent.change(screen.getByDisplayValue('Left'), { target: { value: 'center' } })
    typeCsv('a,b\n1,2')
    const sep = out().split('\n')[1]
    expect(sep).toContain(':-')
    expect(sep).toContain('-:')
  })

  it('applies right alignment to the separator row', () => {
    render(<MarkdownTable />)
    fireEvent.change(screen.getByDisplayValue('Left'), { target: { value: 'right' } })
    typeCsv('a,b\n1,2')
    const sep = out().split('\n')[1]
    expect(sep).toMatch(/-:/)
    expect(sep).not.toContain(':-')
  })

  it('escapes pipe characters inside cells', () => {
    render(<MarkdownTable />)
    typeCsv('name,note\nx,a|b')
    expect(out()).toContain('a\\|b')
  })

  it('handles quoted CSV fields with embedded commas', () => {
    render(<MarkdownTable />)
    typeCsv('name,city\n"Doe, John",NYC')
    const value = out()
    expect(value).toContain('Doe, John')
    // the embedded comma must not split into a third column
    const headerCols = value.split('\n')[0].split('|').filter((s) => s.trim() !== '')
    expect(headerCols.length).toBe(2)
  })

  it('handles doubled-quote escapes inside quoted fields', () => {
    render(<MarkdownTable />)
    typeCsv('q\n"she said ""hi"""')
    expect(out()).toContain('she said "hi"')
  })

  it('switches to TSV input and parses tab-delimited data', () => {
    render(<MarkdownTable />)
    fireEvent.click(screen.getByRole('tab', { name: 'From TSV' }))
    fireEvent.change(screen.getByPlaceholderText(/<tab>age/), {
      target: { value: 'a\tb\n1\t2' },
    })
    const value = out()
    expect(value).toContain('| a | b |')
    expect(value).toContain('| 1 | 2 |')
  })

  it('pads cells to the column width for readability', () => {
    render(<MarkdownTable />)
    typeCsv('name,x\nAlexander,1')
    const value = out()
    // header "name" should be padded out to match "Alexander" width
    expect(value).toContain('| name      | x |')
  })

  it('pads short rows that have fewer cells than the header', () => {
    render(<MarkdownTable />)
    typeCsv('a,b,c\n1,2')
    const lines = out().split('\n')
    // body row still renders three columns
    const bodyCols = lines[2].split('|').filter((s) => s.trim() !== '' || s === ' ')
    expect(lines[2]).toContain('| 1 | 2 |')
  })
})
