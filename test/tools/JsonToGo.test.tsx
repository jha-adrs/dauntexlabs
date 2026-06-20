import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import JsonToGo from '@/components/tools/JsonToGo'

function out() {
  return (screen.getByPlaceholderText('Generated structs…') as HTMLTextAreaElement).value
}

describe('JsonToGo', () => {
  it('generates a Root struct with typed, json-tagged fields', () => {
    render(<JsonToGo />)
    fireEvent.change(screen.getByPlaceholderText(/Paste JSON here/), {
      target: { value: '{"id":1,"name":"x","active":true}' },
    })
    const v = out()
    expect(v).toContain('type Root struct')
    expect(v).toContain('ID int64 ')
    expect(v).toContain('`json:"id"`')
    expect(v).toContain('Name string')
    expect(v).toContain('`json:"name"`')
    expect(v).toContain('Active bool')
    expect(v).toContain('`json:"active"`')
  })

  it('distinguishes int64 from float64', () => {
    render(<JsonToGo />)
    fireEvent.change(screen.getByPlaceholderText(/Paste JSON here/), {
      target: { value: '{"count":3,"ratio":1.5}' },
    })
    const v = out()
    expect(v).toContain('Count int64')
    expect(v).toContain('Ratio float64')
  })

  it('emits a named struct for nested objects', () => {
    render(<JsonToGo />)
    fireEvent.change(screen.getByPlaceholderText(/Paste JSON here/), {
      target: { value: '{"address":{"city":"NYC"}}' },
    })
    const v = out()
    expect(v).toContain('Address Address')
    expect(v).toContain('type Address struct')
    expect(v).toContain('City string')
  })

  it('handles arrays of objects by merging keys into []Struct', () => {
    render(<JsonToGo />)
    fireEvent.change(screen.getByPlaceholderText(/Paste JSON here/), {
      target: { value: '{"items":[{"a":1},{"b":"x"}]}' },
    })
    const v = out()
    expect(v).toContain('Items []Items')
    expect(v).toContain('type Items struct')
    expect(v).toContain('A int64')
    expect(v).toContain('B string')
  })

  it('uses interface{} for null values', () => {
    render(<JsonToGo />)
    fireEvent.change(screen.getByPlaceholderText(/Paste JSON here/), {
      target: { value: '{"maybe":null}' },
    })
    expect(out()).toContain('Maybe interface{}')
  })

  it('infers []string for arrays of scalars', () => {
    render(<JsonToGo />)
    fireEvent.change(screen.getByPlaceholderText(/Paste JSON here/), {
      target: { value: '{"tags":["a","b"]}' },
    })
    expect(out()).toContain('Tags []string')
  })

  it('shows an error for invalid JSON', () => {
    render(<JsonToGo />)
    fireEvent.change(screen.getByPlaceholderText(/Paste JSON here/), {
      target: { value: '{not json}' },
    })
    expect(screen.getByText(/Invalid JSON/i)).toBeInTheDocument()
  })

  it('is empty for empty input', () => {
    render(<JsonToGo />)
    expect(out()).toBe('')
  })
})
