import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import JsonPivot from '@/components/tools/JsonPivot'

const SAMPLE = JSON.stringify([
  { name: 'Alice', dept: 'Eng', score: 90 },
  { name: 'Bob', dept: 'HR', score: 78 },
])

describe('JsonPivot', () => {
  it('transposes an array of objects to an object of arrays by default', () => {
    render(<JsonPivot />)
    const textareas = screen.getAllByRole('textbox')
    fireEvent.change(textareas[0], { target: { value: SAMPLE } })
    const out = screen.getByPlaceholderText('Pivoted result will appear here…') as HTMLTextAreaElement
    const result = JSON.parse(out.value)
    expect(result).toHaveProperty('name', ['Alice', 'Bob'])
    expect(result).toHaveProperty('dept', ['Eng', 'HR'])
    expect(result).toHaveProperty('score', [90, 78])
  })

  it('keys by a field, producing an object keyed on the selected field value', () => {
    render(<JsonPivot />)
    // Switch to Key by field
    fireEvent.click(screen.getByRole('tab', { name: 'Key by field' }))
    const textareas = screen.getAllByRole('textbox')
    fireEvent.change(textareas[0], { target: { value: SAMPLE } })
    const out = screen.getByPlaceholderText('Pivoted result will appear here…') as HTMLTextAreaElement
    const result = JSON.parse(out.value)
    // Keyed by first detected field ("name" by default)
    expect(result).toHaveProperty('Alice')
    expect(result).toHaveProperty('Bob')
    expect((result.Alice as Record<string, unknown>).score).toBe(90)
  })

  it('groups by a field, producing arrays under each key', () => {
    render(<JsonPivot />)
    fireEvent.click(screen.getByRole('tab', { name: 'Group by field' }))
    // Input with two rows sharing the same dept
    const input = JSON.stringify([
      { name: 'Alice', dept: 'Eng', score: 90 },
      { name: 'Carol', dept: 'Eng', score: 85 },
      { name: 'Bob', dept: 'HR', score: 78 },
    ])
    const textareas = screen.getAllByRole('textbox')
    fireEvent.change(textareas[0], { target: { value: input } })
    const out = screen.getByPlaceholderText('Pivoted result will appear here…') as HTMLTextAreaElement
    const result = JSON.parse(out.value)
    // Grouped by first field "name" — each value is unique so each group is length 1,
    // unless we select a different field. The default effectiveField is fields[0]="name".
    // Let's change it to "dept" so grouping makes sense.
    // We need to use the Select combobox that appears after switching mode.
    const sel = screen.getByRole('combobox')
    fireEvent.change(sel, { target: { value: 'dept' } })
    const out2 = screen.getByPlaceholderText('Pivoted result will appear here…') as HTMLTextAreaElement
    const result2 = JSON.parse(out2.value)
    expect(result2).toHaveProperty('Eng')
    expect(result2).toHaveProperty('HR')
    expect((result2.Eng as unknown[]).length).toBe(2)
    expect((result2.HR as unknown[]).length).toBe(1)
    // suppress unused warning
    void result
  })

  it('shows an error for non-array JSON input', () => {
    render(<JsonPivot />)
    const textareas = screen.getAllByRole('textbox')
    fireEvent.change(textareas[0], { target: { value: '{"key":"value"}' } })
    expect(screen.getByText(/Input must be a JSON array/i)).toBeInTheDocument()
  })

  it('shows an error when array contains non-objects', () => {
    render(<JsonPivot />)
    const textareas = screen.getAllByRole('textbox')
    fireEvent.change(textareas[0], { target: { value: '[1,2,3]' } })
    expect(screen.getByText(/plain object/i)).toBeInTheDocument()
  })

  it('shows an error for invalid JSON', () => {
    render(<JsonPivot />)
    const textareas = screen.getAllByRole('textbox')
    fireEvent.change(textareas[0], { target: { value: 'not json' } })
    expect(screen.getByText(/JSON parse error/i)).toBeInTheDocument()
  })

  it('returns empty output for empty input', () => {
    render(<JsonPivot />)
    const out = screen.getByPlaceholderText('Pivoted result will appear here…') as HTMLTextAreaElement
    expect(out.value).toBe('')
  })
})
