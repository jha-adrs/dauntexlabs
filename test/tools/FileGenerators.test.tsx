import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FileGenerators from '@/components/tools/FileGenerators'

describe('FileGenerators', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  function getOutput(): HTMLTextAreaElement {
    return screen.getByRole('textbox') as HTMLTextAreaElement
  }

  it('renders with empty preview textarea before generating', () => {
    render(<FileGenerators />)
    // CSV is the default type, preview is visible
    expect(getOutput()).toHaveValue('')
    expect(getOutput().placeholder).toMatch(/Click Generate/i)
  })

  it('generates non-empty CSV content', () => {
    render(<FileGenerators />)
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const val = getOutput().value
    expect(val).not.toBe('')
    // CSV must have the header row
    expect(val).toContain('id,name,email,date,amount')
  })

  it('CSV has correct number of data rows (default 10)', () => {
    render(<FileGenerators />)
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const lines = getOutput().value.trim().split('\n')
    // header + 10 data rows
    expect(lines).toHaveLength(11)
  })

  it('CSV row count changes when rows input is changed', () => {
    render(<FileGenerators />)
    const rowsInput = screen.getByPlaceholderText('10')
    fireEvent.change(rowsInput, { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const lines = getOutput().value.trim().split('\n')
    // header + 5 data rows
    expect(lines).toHaveLength(6)
  })

  it('generates valid JSON array for JSON type', () => {
    render(<FileGenerators />)
    const typeSelect = screen.getByRole('combobox')
    fireEvent.change(typeSelect, { target: { value: 'json' } })
    const rowsInput = screen.getByPlaceholderText('10')
    fireEvent.change(rowsInput, { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const val = getOutput().value
    expect(val).not.toBe('')
    const parsed = JSON.parse(val)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(3)
    expect(parsed[0]).toHaveProperty('id')
    expect(parsed[0]).toHaveProperty('email')
    expect(parsed[0].email).toContain('@')
  })

  it('generates XML content with root <records> tag', () => {
    render(<FileGenerators />)
    const typeSelect = screen.getByRole('combobox')
    fireEvent.change(typeSelect, { target: { value: 'xml' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const val = getOutput().value
    expect(val).toContain('<?xml')
    expect(val).toContain('<records>')
    expect(val).toContain('</records>')
    expect(val).toContain('<record>')
  })

  it('generates HTML content with DOCTYPE', () => {
    render(<FileGenerators />)
    const typeSelect = screen.getByRole('combobox')
    fireEvent.change(typeSelect, { target: { value: 'html' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const val = getOutput().value
    expect(val).toContain('<!DOCTYPE html>')
    expect(val).toContain('<html')
    expect(val).toContain('</html>')
  })

  it('generates Markdown content with a heading', () => {
    render(<FileGenerators />)
    const typeSelect = screen.getByRole('combobox')
    fireEvent.change(typeSelect, { target: { value: 'markdown' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const val = getOutput().value
    expect(val).toContain('# Sample Markdown Document')
  })

  it('generates Plain Text content', () => {
    render(<FileGenerators />)
    const typeSelect = screen.getByRole('combobox')
    fireEvent.change(typeSelect, { target: { value: 'text' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const val = getOutput().value
    expect(val).toContain('Sample Plain Text Document')
  })

  it('download button triggers URL.createObjectURL for CSV', () => {
    render(<FileGenerators />)
    const spy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    // Find the download button (labeled "download .csv")
    const downloadBtn = screen.getByRole('button', { name: /download .csv/i })
    fireEvent.click(downloadBtn)
    expect(spy).toHaveBeenCalled()
  })

  it('download button triggers URL.createObjectURL for JSON', () => {
    render(<FileGenerators />)
    const spy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    const typeSelect = screen.getByRole('combobox')
    fireEvent.change(typeSelect, { target: { value: 'json' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const downloadBtn = screen.getByRole('button', { name: /download .json/i })
    fireEvent.click(downloadBtn)
    expect(spy).toHaveBeenCalled()
  })

  it('clears preview when file type is changed', () => {
    render(<FileGenerators />)
    // Generate CSV first
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    expect(getOutput().value).not.toBe('')
    // Switch to JSON — preview should clear
    const typeSelect = screen.getByRole('combobox')
    fireEvent.change(typeSelect, { target: { value: 'json' } })
    expect(getOutput().value).toBe('')
  })

  it('PNG mode shows canvas-based generate flow', () => {
    render(<FileGenerators />)
    const typeSelect = screen.getByRole('combobox')
    fireEvent.change(typeSelect, { target: { value: 'png' } })
    // After switching to PNG, the textarea should be gone and PNG preview panel shown
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText(/Click Generate to produce a PNG image/i)).toBeInTheDocument()
    // Click generate — canvas.toBlob is stubbed to call cb with a Blob
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    // After generate, an img element should appear (src = 'blob:mock' from createObjectURL)
    // and a download PNG button
    // The img src is whatever URL.createObjectURL returned
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
  })
})
