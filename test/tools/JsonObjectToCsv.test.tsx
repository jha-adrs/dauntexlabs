import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import JsonObjectToCsv from '@/components/tools/JsonObjectToCsv'

describe('JsonObjectToCsv', () => {
  it('converts a JSON object to CSV rows (key/value per line) by default', () => {
    render(<JsonObjectToCsv />)
    fireEvent.change(
      screen.getByPlaceholderText('Paste a JSON object {"a":1,"b":2} or [["a",1],["b",2]]…'),
      { target: { value: '{"name":"Alice","age":30}' } },
    )
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    const lines = out.value.split('\n')
    expect(lines[0]).toBe('key,value')
    expect(lines[1]).toBe('name,Alice')
    expect(lines[2]).toBe('age,30')
  })

  it('outputs key/value header + rows for a JSON object in rows mode', () => {
    render(<JsonObjectToCsv />)
    fireEvent.change(
      screen.getByPlaceholderText('Paste a JSON object {"a":1,"b":2} or [["a",1],["b",2]]…'),
      { target: { value: '{"x":10,"y":20}' } },
    )
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    const lines = out.value.split('\n')
    expect(lines[0]).toBe('key,value')
    expect(lines).toContainEqual('x,10')
    expect(lines).toContainEqual('y,20')
  })

  it('outputs two rows (keys row, values row) in columns mode', () => {
    render(<JsonObjectToCsv />)
    // Switch to Columns mode
    fireEvent.click(screen.getByRole('tab', { name: 'Columns (keys / values)' }))
    fireEvent.change(
      screen.getByPlaceholderText('Paste a JSON object {"a":1,"b":2} or [["a",1],["b",2]]…'),
      { target: { value: '{"name":"Alice","age":30}' } },
    )
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    const lines = out.value.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe('name,age')
    expect(lines[1]).toBe('Alice,30')
  })

  it('accepts an array of [key, value] pairs', () => {
    render(<JsonObjectToCsv />)
    fireEvent.change(
      screen.getByPlaceholderText('Paste a JSON object {"a":1,"b":2} or [["a",1],["b",2]]…'),
      { target: { value: '[["a",1],["b",2]]' } },
    )
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    const lines = out.value.split('\n')
    expect(lines[0]).toBe('key,value')
    expect(lines).toContainEqual('a,1')
    expect(lines).toContainEqual('b,2')
  })

  it('shows an error for invalid JSON', () => {
    render(<JsonObjectToCsv />)
    fireEvent.change(
      screen.getByPlaceholderText('Paste a JSON object {"a":1,"b":2} or [["a",1],["b",2]]…'),
      { target: { value: 'not valid json' } },
    )
    expect(screen.getByText(/parse error/i)).toBeInTheDocument()
  })

  it('shows an error when an array element is not a 2-element pair', () => {
    render(<JsonObjectToCsv />)
    fireEvent.change(
      screen.getByPlaceholderText('Paste a JSON object {"a":1,"b":2} or [["a",1],["b",2]]…'),
      { target: { value: '[["a",1,2]]' } },
    )
    expect(screen.getByText(/\[key, value\] pair/i)).toBeInTheDocument()
  })

  it('shows an error for a primitive value (not object or array)', () => {
    render(<JsonObjectToCsv />)
    fireEvent.change(
      screen.getByPlaceholderText('Paste a JSON object {"a":1,"b":2} or [["a",1],["b",2]]…'),
      { target: { value: '42' } },
    )
    expect(screen.getByText(/must be a JSON object/i)).toBeInTheDocument()
  })

  it('returns empty output for empty input', () => {
    render(<JsonObjectToCsv />)
    const out = screen.getByPlaceholderText('CSV will appear here…') as HTMLTextAreaElement
    expect(out.value).toBe('')
  })
})
