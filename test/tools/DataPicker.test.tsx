import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DataPicker from '@/components/tools/DataPicker'

const CSV_INPUT = 'id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com'
const JSON_INPUT = JSON.stringify([
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
])

describe('DataPicker', () => {
  it('outputs all fields by default from CSV input (JSON output)', async () => {
    render(<DataPicker />)
    fireEvent.change(screen.getByPlaceholderText(/id,name,email/), {
      target: { value: CSV_INPUT },
    })
    await waitFor(() => {
      const out = screen.getByPlaceholderText('Filtered output will appear here…') as HTMLTextAreaElement
      expect(out.value).not.toBe('')
    })
    const out = screen.getByPlaceholderText('Filtered output will appear here…') as HTMLTextAreaElement
    const result = JSON.parse(out.value)
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('id')
    expect(result[0]).toHaveProperty('name')
    expect(result[0]).toHaveProperty('email')
  })

  it('picks only selected fields when other fields are toggled off', async () => {
    render(<DataPicker />)
    fireEvent.change(screen.getByPlaceholderText(/id,name,email/), {
      target: { value: CSV_INPUT },
    })
    // Wait for toggle labels to appear
    await waitFor(() => {
      expect(screen.getByLabelText('email')).toBeInTheDocument()
    })
    // Uncheck 'email' toggle
    fireEvent.click(screen.getByLabelText('email'))
    await waitFor(() => {
      const out = screen.getByPlaceholderText('Filtered output will appear here…') as HTMLTextAreaElement
      const result = JSON.parse(out.value)
      expect(result[0]).not.toHaveProperty('email')
      expect(result[0]).toHaveProperty('name')
    })
  })

  it('uses manual field list override via the text input', async () => {
    render(<DataPicker />)
    fireEvent.change(screen.getByPlaceholderText(/id,name,email/), {
      target: { value: CSV_INPUT },
    })
    await waitFor(() => {
      expect(screen.getByLabelText('email')).toBeInTheDocument()
    })
    // Fill in the "Or override" text input with just 'name'
    fireEvent.change(screen.getByPlaceholderText('e.g. name, email, score'), {
      target: { value: 'name' },
    })
    await waitFor(() => {
      const out = screen.getByPlaceholderText('Filtered output will appear here…') as HTMLTextAreaElement
      const result = JSON.parse(out.value)
      expect(Object.keys(result[0])).toEqual(['name'])
    })
  })

  it('outputs CSV when CSV output format is selected', async () => {
    render(<DataPicker />)
    // Switch output format to CSV
    fireEvent.click(screen.getByRole('tab', { name: 'CSV' }))
    fireEvent.change(screen.getByPlaceholderText(/id,name,email/), {
      target: { value: CSV_INPUT },
    })
    await waitFor(() => {
      const out = screen.getByPlaceholderText('Filtered output will appear here…') as HTMLTextAreaElement
      expect(out.value).not.toBe('')
    })
    const out = screen.getByPlaceholderText('Filtered output will appear here…') as HTMLTextAreaElement
    const lines = out.value.split('\n')
    expect(lines[0]).toBe('id,name,email')
    expect(lines[1]).toContain('Alice')
  })

  it('accepts JSON array input format', async () => {
    render(<DataPicker />)
    // Switch input format to JSON
    const inputFmtSel = screen.getAllByRole('combobox')[0]
    fireEvent.change(inputFmtSel, { target: { value: 'json' } })
    // The input textarea is the first (non-readonly) textbox
    const textareas = screen.getAllByRole('textbox')
    const inputArea = textareas.find(el => !(el as HTMLTextAreaElement).readOnly)!
    fireEvent.change(inputArea, { target: { value: JSON_INPUT } })
    await waitFor(() => {
      const out = screen.getByPlaceholderText('Filtered output will appear here…') as HTMLTextAreaElement
      expect(out.value).not.toBe('')
    })
    const out = screen.getByPlaceholderText('Filtered output will appear here…') as HTMLTextAreaElement
    const result = JSON.parse(out.value)
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('name', 'Alice')
  })

  it('shows a parse error for invalid JSON input', async () => {
    render(<DataPicker />)
    const inputFmtSel = screen.getAllByRole('combobox')[0]
    fireEvent.change(inputFmtSel, { target: { value: 'json' } })
    const textareas = screen.getAllByRole('textbox')
    const inputArea = textareas.find(el => !(el as HTMLTextAreaElement).readOnly)!
    fireEvent.change(inputArea, { target: { value: 'not valid json' } })
    await waitFor(() => {
      expect(screen.getByText(/SyntaxError/i)).toBeInTheDocument()
    })
  })

  it('shows no fields message before any input is pasted', () => {
    render(<DataPicker />)
    expect(screen.getByText(/Paste data above to detect fields/i)).toBeInTheDocument()
  })

  it('shows an error when no fields are selected', async () => {
    render(<DataPicker />)
    fireEvent.change(screen.getByPlaceholderText(/id,name,email/), {
      target: { value: CSV_INPUT },
    })
    await waitFor(() => {
      expect(screen.getByLabelText('id')).toBeInTheDocument()
    })
    // Uncheck all toggles
    fireEvent.click(screen.getByLabelText('id'))
    fireEvent.click(screen.getByLabelText('name'))
    fireEvent.click(screen.getByLabelText('email'))
    await waitFor(() => {
      expect(screen.getByText(/No fields selected/i)).toBeInTheDocument()
    })
  })
})
