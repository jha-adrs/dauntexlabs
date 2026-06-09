import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CsvToJson from '@/components/tools/CsvToJson'

describe('CsvToJson', () => {
  it('converts a basic CSV with header row to JSON array', () => {
    render(<CsvToJson />)
    fireEvent.change(screen.getByPlaceholderText('Paste CSV here…'), {
      target: { value: 'name,city\nAlice,Paris\nBob,London' },
    })
    const out = screen.getByPlaceholderText('JSON will appear here…') as HTMLTextAreaElement
    const result = JSON.parse(out.value)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: 'Alice', city: 'Paris' })
    expect(result[1]).toEqual({ name: 'Bob', city: 'London' })
  })

  it('infers numbers and booleans with type inference on', () => {
    render(<CsvToJson />)
    fireEvent.change(screen.getByPlaceholderText('Paste CSV here…'), {
      target: { value: 'name,age,active\nAda,36,true\nBob,25,false' },
    })
    const out = screen.getByPlaceholderText('JSON will appear here…') as HTMLTextAreaElement
    const result = JSON.parse(out.value)
    expect(result[0]).toEqual({ name: 'Ada', age: 36, active: true })
    expect(result[1]).toEqual({ name: 'Bob', age: 25, active: false })
  })

  it('treats values as strings when type inference is disabled', () => {
    render(<CsvToJson />)
    // Turn off type inference toggle
    fireEvent.click(screen.getByLabelText('Type inference'))
    fireEvent.change(screen.getByPlaceholderText('Paste CSV here…'), {
      target: { value: 'name,age\nAda,36' },
    })
    const out = screen.getByPlaceholderText('JSON will appear here…') as HTMLTextAreaElement
    const result = JSON.parse(out.value)
    expect(result[0].age).toBe('36')
  })

  it('uses column names col1, col2 when header row is disabled', () => {
    render(<CsvToJson />)
    // Turn off "First row is header"
    fireEvent.click(screen.getByLabelText('First row is header'))
    fireEvent.change(screen.getByPlaceholderText('Paste CSV here…'), {
      target: { value: 'Alice,Paris\nBob,London' },
    })
    const out = screen.getByPlaceholderText('JSON will appear here…') as HTMLTextAreaElement
    const result = JSON.parse(out.value)
    expect(result[0]).toHaveProperty('col1', 'Alice')
    expect(result[0]).toHaveProperty('col2', 'Paris')
  })

  it('parses semicolon-delimited CSV when delimiter is changed', () => {
    render(<CsvToJson />)
    // Change delimiter to semicolon
    fireEvent.change(screen.getByRole('combobox'), { target: { value: ';' } })
    fireEvent.change(screen.getByPlaceholderText('Paste CSV here…'), {
      target: { value: 'name;score\nAlice;99' },
    })
    const out = screen.getByPlaceholderText('JSON will appear here…') as HTMLTextAreaElement
    const result = JSON.parse(out.value)
    expect(result[0]).toEqual({ name: 'Alice', score: 99 })
  })

  it('infers null for empty and "null" strings', () => {
    render(<CsvToJson />)
    fireEvent.change(screen.getByPlaceholderText('Paste CSV here…'), {
      target: { value: 'a,b\n,null' },
    })
    const out = screen.getByPlaceholderText('JSON will appear here…') as HTMLTextAreaElement
    const result = JSON.parse(out.value)
    expect(result[0].a).toBeNull()
    expect(result[0].b).toBeNull()
  })

  it('produces empty output for empty input', () => {
    render(<CsvToJson />)
    const out = screen.getByPlaceholderText('JSON will appear here…') as HTMLTextAreaElement
    expect(out.value).toBe('')
  })
})
