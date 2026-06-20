import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import JsonToTypescript from '@/components/tools/JsonToTypescript'

describe('JsonToTypescript', () => {
  it('renders output panel with placeholder when input is empty', () => {
    render(<JsonToTypescript />)
    expect(screen.getByPlaceholderText('Generated interfaces…')).toHaveValue('')
  })

  it('generates basic interface with primitive fields', () => {
    render(<JsonToTypescript />)
    fireEvent.change(screen.getByPlaceholderText(/Paste JSON here/), {
      target: { value: '{"id":1,"name":"x","tags":["a"]}' },
    })
    const out = (screen.getByPlaceholderText('Generated interfaces…') as HTMLTextAreaElement).value
    expect(out).toContain('id: number')
    expect(out).toContain('name: string')
    expect(out).toContain('tags: string[]')
    expect(out).toContain('export interface Root')
  })

  it('generates nested interfaces for nested objects', () => {
    render(<JsonToTypescript />)
    fireEvent.change(screen.getByPlaceholderText(/Paste JSON here/), {
      target: { value: '{"user":{"age":30,"active":true}}' },
    })
    const out = (screen.getByPlaceholderText('Generated interfaces…') as HTMLTextAreaElement).value
    expect(out).toContain('export interface User')
    expect(out).toContain('age: number')
    expect(out).toContain('active: boolean')
    expect(out).toContain('user: User')
  })

  it('handles null values', () => {
    render(<JsonToTypescript />)
    fireEvent.change(screen.getByPlaceholderText(/Paste JSON here/), {
      target: { value: '{"data":null}' },
    })
    const out = (screen.getByPlaceholderText('Generated interfaces…') as HTMLTextAreaElement).value
    expect(out).toContain('data: null')
  })

  it('handles arrays of objects with merged keys', () => {
    render(<JsonToTypescript />)
    fireEvent.change(screen.getByPlaceholderText(/Paste JSON here/), {
      target: { value: '{"items":[{"id":1},{"name":"x"}]}' },
    })
    const out = (screen.getByPlaceholderText('Generated interfaces…') as HTMLTextAreaElement).value
    expect(out).toContain('ItemsItem')
    expect(out).toMatch(/items: ItemsItem\[\]/)
  })

  it('handles empty arrays', () => {
    render(<JsonToTypescript />)
    fireEvent.change(screen.getByPlaceholderText(/Paste JSON here/), {
      target: { value: '{"list":[]}' },
    })
    const out = (screen.getByPlaceholderText('Generated interfaces…') as HTMLTextAreaElement).value
    expect(out).toContain('list: unknown[]')
  })

  it('shows error for invalid JSON', () => {
    render(<JsonToTypescript />)
    fireEvent.change(screen.getByPlaceholderText(/Paste JSON here/), {
      target: { value: '{invalid json' },
    })
    expect(screen.getByText(/Invalid JSON/i, { selector: '.notice' })).toBeInTheDocument()
  })

  it('produces empty output for empty input', () => {
    render(<JsonToTypescript />)
    expect(screen.getByPlaceholderText('Generated interfaces…')).toHaveValue('')
  })

  it('handles a top-level array of objects', () => {
    render(<JsonToTypescript />)
    fireEvent.change(screen.getByPlaceholderText(/Paste JSON here/), {
      target: { value: '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]' },
    })
    const out = (screen.getByPlaceholderText('Generated interfaces…') as HTMLTextAreaElement).value
    expect(out).toContain('export interface Root')
    expect(out).toContain('id: number')
    expect(out).toContain('name: string')
  })

  it('handles deeply nested objects', () => {
    render(<JsonToTypescript />)
    fireEvent.change(screen.getByPlaceholderText(/Paste JSON here/), {
      target: { value: '{"a":{"b":{"c":42}}}' },
    })
    const out = (screen.getByPlaceholderText('Generated interfaces…') as HTMLTextAreaElement).value
    expect(out).toContain('c: number')
    expect(out).toContain('export interface Root')
  })
})
