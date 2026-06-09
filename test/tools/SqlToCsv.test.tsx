import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SqlToCsv from '@/components/tools/SqlToCsv'

const MYSQL_TABLE = `+-------+-----+
| name  | age |
+-------+-----+
| Alice |  30 |
| Bob   |  25 |
+-------+-----+`

describe('SqlToCsv — Result → CSV mode', () => {
  it('parses a MySQL ASCII table and outputs CSV', () => {
    render(<SqlToCsv />)
    fireEvent.change(screen.getByPlaceholderText(/\+-------/), {
      target: { value: MYSQL_TABLE },
    })
    const out = screen.getByPlaceholderText('Output will appear here…') as HTMLTextAreaElement
    const lines = out.value.split('\n')
    expect(lines[0]).toBe('name,age')
    expect(lines[1]).toBe('Alice,30')
    expect(lines[2]).toBe('Bob,25')
  })

  it('parses pipe-separated rows without +---+ borders', () => {
    render(<SqlToCsv />)
    const pipeTable = `name | age\nAlice | 30\nBob | 25`
    fireEvent.change(screen.getByPlaceholderText(/\+-------/), {
      target: { value: pipeTable },
    })
    const out = screen.getByPlaceholderText('Output will appear here…') as HTMLTextAreaElement
    const lines = out.value.split('\n')
    expect(lines[0]).toBe('name,age')
    expect(lines[1]).toBe('Alice,30')
  })

  it('shows an error when input cannot be parsed as a result set', () => {
    render(<SqlToCsv />)
    fireEvent.change(screen.getByPlaceholderText(/\+-------/), {
      target: { value: 'random text that is not a table' },
    })
    expect(screen.getByText(/Could not parse/i)).toBeInTheDocument()
  })
})

describe('SqlToCsv — Data → INSERT mode', () => {
  it('generates individual INSERT statements from CSV', () => {
    render(<SqlToCsv />)
    // Switch to Data → INSERT mode
    fireEvent.click(screen.getByRole('tab', { name: 'Data → INSERT' }))
    // The placeholder now changes; use placeholder text from insert mode
    const textarea = screen.getByPlaceholderText(/name,age,email/)
    fireEvent.change(textarea, {
      target: { value: 'name,age\nAlice,30\nBob,25' },
    })
    const out = screen.getByPlaceholderText('Output will appear here…') as HTMLTextAreaElement
    const lines = out.value.split('\n')
    expect(lines[0]).toContain('INSERT INTO')
    expect(lines[0]).toContain('my_table')
    expect(lines[0]).toContain("'Alice'")
    expect(lines[0]).toContain('30')
    expect(lines[1]).toContain("'Bob'")
    expect(lines[1]).toContain('25')
  })

  it('uses the custom table name from the Table name input', () => {
    render(<SqlToCsv />)
    fireEvent.click(screen.getByRole('tab', { name: 'Data → INSERT' }))
    // Change table name
    fireEvent.change(screen.getByPlaceholderText('my_table'), {
      target: { value: 'users' },
    })
    const textarea = screen.getByPlaceholderText(/name,age,email/)
    fireEvent.change(textarea, {
      target: { value: 'id,name\n1,Alice' },
    })
    const out = screen.getByPlaceholderText('Output will appear here…') as HTMLTextAreaElement
    expect(out.value).toContain('`users`')
    expect(out.value).toContain("'Alice'")
  })

  it('generates a multi-row INSERT when Multi-row INSERT toggle is on', () => {
    render(<SqlToCsv />)
    fireEvent.click(screen.getByRole('tab', { name: 'Data → INSERT' }))
    fireEvent.click(screen.getByLabelText('Multi-row INSERT'))
    const textarea = screen.getByPlaceholderText(/name,age,email/)
    fireEvent.change(textarea, {
      target: { value: 'name,age\nAlice,30\nBob,25' },
    })
    const out = screen.getByPlaceholderText('Output will appear here…') as HTMLTextAreaElement
    // Multi-row insert: one INSERT keyword
    const insertCount = (out.value.match(/INSERT INTO/g) ?? []).length
    expect(insertCount).toBe(1)
    expect(out.value).toContain("'Alice'")
    expect(out.value).toContain("'Bob'")
    // ends with semicolon
    expect(out.value.trim().endsWith(';')).toBe(true)
  })

  it('treats numeric CSV values as unquoted SQL numbers', () => {
    render(<SqlToCsv />)
    fireEvent.click(screen.getByRole('tab', { name: 'Data → INSERT' }))
    const textarea = screen.getByPlaceholderText(/name,age,email/)
    fireEvent.change(textarea, {
      target: { value: 'score\n42' },
    })
    const out = screen.getByPlaceholderText('Output will appear here…') as HTMLTextAreaElement
    // numeric value should not be quoted
    expect(out.value).toContain('(42)')
    expect(out.value).not.toContain("'42'")
  })

  it('shows an error when CSV has fewer than 2 lines (no data rows)', () => {
    render(<SqlToCsv />)
    fireEvent.click(screen.getByRole('tab', { name: 'Data → INSERT' }))
    const textarea = screen.getByPlaceholderText(/name,age,email/)
    fireEvent.change(textarea, {
      target: { value: 'only_header_no_rows' },
    })
    expect(screen.getByText(/Could not parse CSV|No data rows/i)).toBeInTheDocument()
  })
})
