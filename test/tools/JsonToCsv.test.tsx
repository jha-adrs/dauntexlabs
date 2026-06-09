import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import JsonToCsv from '@/components/tools/JsonToCsv'

describe('JsonToCsv', () => {
  it('converts a JSON array to CSV with a header row', () => {
    render(<JsonToCsv />)
    fireEvent.change(screen.getByPlaceholderText('Paste JSON array (or single object) here…'), {
      target: { value: '[{"name":"Alice","age":30},{"name":"Bob","age":25}]' },
    })
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    const lines = out.value.split('\n')
    expect(lines[0]).toBe('name,age')
    expect(lines[1]).toBe('Alice,30')
    expect(lines[2]).toBe('Bob,25')
  })

  it('omits header row when Include header row is toggled off', () => {
    render(<JsonToCsv />)
    fireEvent.click(screen.getByLabelText('Include header row'))
    fireEvent.change(screen.getByPlaceholderText('Paste JSON array (or single object) here…'), {
      target: { value: '[{"name":"Alice","age":30}]' },
    })
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    const lines = out.value.split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toBe('Alice,30')
  })

  it('wraps a single object in an array and converts it', () => {
    render(<JsonToCsv />)
    fireEvent.change(screen.getByPlaceholderText('Paste JSON array (or single object) here…'), {
      target: { value: '{"name":"Alice","age":30}' },
    })
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    const lines = out.value.split('\n')
    expect(lines[0]).toBe('name,age')
    expect(lines[1]).toBe('Alice,30')
  })

  it('flattens nested objects when Flatten nested objects is enabled', () => {
    render(<JsonToCsv />)
    fireEvent.click(screen.getByLabelText('Flatten nested objects'))
    fireEvent.change(screen.getByPlaceholderText('Paste JSON array (or single object) here…'), {
      target: { value: '[{"name":"Alice","addr":{"city":"Paris","zip":"75001"}}]' },
    })
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    const lines = out.value.split('\n')
    expect(lines[0]).toContain('addr.city')
    expect(lines[0]).toContain('addr.zip')
    expect(lines[1]).toContain('Paris')
    expect(lines[1]).toContain('75001')
  })

  it('uses semicolon delimiter when changed', () => {
    render(<JsonToCsv />)
    const sel = screen.getByRole('combobox')
    fireEvent.change(sel, { target: { value: ';' } })
    fireEvent.change(screen.getByPlaceholderText('Paste JSON array (or single object) here…'), {
      target: { value: '[{"a":1,"b":2}]' },
    })
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    expect(out.value).toContain('a;b')
    expect(out.value).toContain('1;2')
  })

  it('shows a parse error notice for invalid JSON', () => {
    render(<JsonToCsv />)
    fireEvent.change(screen.getByPlaceholderText('Paste JSON array (or single object) here…'), {
      target: { value: 'not json at all' },
    })
    expect(screen.getByText(/parse error/i)).toBeInTheDocument()
  })

  it('shows an error when input is a JSON number (not array/object)', () => {
    render(<JsonToCsv />)
    fireEvent.change(screen.getByPlaceholderText('Paste JSON array (or single object) here…'), {
      target: { value: '42' },
    })
    expect(screen.getByText(/must be a JSON array/i)).toBeInTheDocument()
  })

  it('returns empty output for empty input', () => {
    render(<JsonToCsv />)
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    expect(out.value).toBe('')
  })
})
