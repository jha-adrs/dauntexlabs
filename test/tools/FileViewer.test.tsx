import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import FileViewer from '@/components/tools/FileViewer'

const SRC = 'Paste Markdown, HTML, JSON, XML, CSV or YAML…'

function setFormat(value: string) {
  // The Format <Select> is the only combobox in the toolbar.
  fireEvent.change(screen.getByRole('combobox'), { target: { value } })
}

describe('FileViewer', () => {
  it('renders Markdown to an <h1> and <strong> in the preview', () => {
    render(<FileViewer />)
    fireEvent.change(screen.getByPlaceholderText(SRC), {
      target: { value: '# Hi\n\n**bold**' },
    })
    // Auto-detect picks markdown; force it to be deterministic anyway.
    setFormat('markdown')

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Hi')
    expect(screen.getByText('Hi').tagName.toLowerCase()).toBe('h1')

    const strong = screen.getByText('bold')
    expect(strong.tagName.toLowerCase()).toBe('strong')
  })

  it('auto-detects Markdown for heading/bold input', () => {
    render(<FileViewer />) // defaults to Auto
    fireEvent.change(screen.getByPlaceholderText(SRC), {
      target: { value: '# Hi\n\n**bold**' },
    })
    expect(screen.getByText('detected: markdown')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hi')
  })

  it('pretty-prints JSON', () => {
    render(<FileViewer />)
    fireEvent.change(screen.getByPlaceholderText(SRC), {
      target: { value: '{"a":1,"b":2}' },
    })
    setFormat('json')
    // Preview is a <pre> with the re-serialised, indented JSON.
    const pre = document.querySelector('pre') as HTMLPreElement
    expect(pre).toBeTruthy()
    expect(pre.textContent).toContain('\n')
    expect(pre.textContent).toContain('"a": 1')
    expect(pre.textContent).toContain('  "b": 2')
  })

  it('auto-detects JSON and pretty-prints it', () => {
    render(<FileViewer />)
    fireEvent.change(screen.getByPlaceholderText(SRC), {
      target: { value: '{"a":1}' },
    })
    expect(screen.getByText('detected: json')).toBeInTheDocument()
  })

  it('shows an error for invalid JSON', () => {
    render(<FileViewer />)
    fireEvent.change(screen.getByPlaceholderText(SRC), {
      target: { value: '{ "a": }' },
    })
    setFormat('json')
    expect(screen.getByText(/Invalid JSON/i)).toBeInTheDocument()
    expect(document.querySelector('.notice.error')).toBeInTheDocument()
  })

  it('renders CSV as a table with header and body cells', () => {
    render(<FileViewer />)
    fireEvent.change(screen.getByPlaceholderText(SRC), {
      target: { value: 'name,age\nAlice,30\nBob,25' },
    })
    setFormat('csv')

    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()

    const headers = screen.getAllByRole('columnheader')
    expect(headers.map((h) => h.textContent)).toEqual(['name', 'age'])

    // Body cells include the data values.
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()

    // Two data rows in the body.
    const rows = within(table).getAllByRole('row')
    // header row + 2 body rows
    expect(rows.length).toBe(3)
  })

  it('shows the info notice for empty input', () => {
    render(<FileViewer />)
    expect(screen.getByText(/Paste content on the left to preview it here/i)).toBeInTheDocument()
  })
})
