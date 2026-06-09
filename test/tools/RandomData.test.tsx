import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RandomData from '@/components/tools/RandomData'

function getOutput(): HTMLTextAreaElement {
  return screen.getByPlaceholderText('Click Generate to produce random data…') as HTMLTextAreaElement
}

describe('RandomData', () => {
  it('renders with empty output before generating', () => {
    render(<RandomData />)
    expect(getOutput()).toHaveValue('')
  })

  it('generates 10 strings by default', () => {
    render(<RandomData />)
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const lines = getOutput().value.trim().split('\n')
    expect(lines).toHaveLength(10)
  })

  it('generates email items containing @', () => {
    render(<RandomData />)
    // Switch type to Email
    const typeSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(typeSelect, { target: { value: 'email' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const lines = getOutput().value.trim().split('\n')
    expect(lines.length).toBeGreaterThan(0)
    lines.forEach((line) => {
      expect(line).toContain('@')
    })
  })

  it('generates the requested count', () => {
    render(<RandomData />)
    const countInput = screen.getByPlaceholderText('10')
    fireEvent.change(countInput, { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const lines = getOutput().value.trim().split('\n')
    expect(lines).toHaveLength(5)
  })

  it('generates UUID items matching UUID format', () => {
    render(<RandomData />)
    const typeSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(typeSelect, { target: { value: 'uuid' } })
    const countInput = screen.getByPlaceholderText('10')
    fireEvent.change(countInput, { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const lines = getOutput().value.trim().split('\n')
    expect(lines).toHaveLength(3)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    lines.forEach((line) => {
      expect(line).toMatch(uuidRegex)
    })
  })

  it('generates boolean items that are "true" or "false"', () => {
    render(<RandomData />)
    const typeSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(typeSelect, { target: { value: 'boolean' } })
    const countInput = screen.getByPlaceholderText('10')
    fireEvent.change(countInput, { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const lines = getOutput().value.trim().split('\n')
    lines.forEach((line) => {
      expect(['true', 'false']).toContain(line)
    })
  })

  it('generates JSON array output for JSON type', () => {
    render(<RandomData />)
    const typeSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(typeSelect, { target: { value: 'json' } })
    const countInput = screen.getByPlaceholderText('10')
    fireEvent.change(countInput, { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const raw = getOutput().value
    expect(raw).not.toBe('')
    const parsed = JSON.parse(raw)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(2)
    // Each object should have expected fields
    expect(parsed[0]).toHaveProperty('email')
    expect(parsed[0].email).toContain('@')
  })

  it('generates name items with a space (first + last)', () => {
    render(<RandomData />)
    const typeSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(typeSelect, { target: { value: 'name' } })
    const countInput = screen.getByPlaceholderText('10')
    fireEvent.change(countInput, { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const lines = getOutput().value.trim().split('\n')
    expect(lines).toHaveLength(5)
    lines.forEach((line) => {
      expect(line).toContain(' ')
    })
  })

  it('clamps count to minimum 1', () => {
    render(<RandomData />)
    const countInput = screen.getByPlaceholderText('10')
    fireEvent.change(countInput, { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const lines = getOutput().value.trim().split('\n')
    expect(lines.length).toBeGreaterThanOrEqual(1)
  })
})
