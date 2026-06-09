import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UuidGenerator from '@/components/tools/UuidGenerator'

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getOutput(): HTMLTextAreaElement {
  return screen.getByPlaceholderText('Click Generate to produce UUIDs…') as HTMLTextAreaElement
}

describe('UuidGenerator', () => {
  it('renders with empty output before generating', () => {
    render(<UuidGenerator />)
    expect(getOutput()).toHaveValue('')
  })

  it('generates UUIDs matching v4 pattern', () => {
    render(<UuidGenerator />)
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const lines = getOutput().value.trim().split('\n')
    expect(lines.length).toBeGreaterThan(0)
    lines.forEach((line) => {
      expect(line).toMatch(UUID_V4_RE)
    })
  })

  it('generates the count specified (default 5)', () => {
    render(<UuidGenerator />)
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const lines = getOutput().value.trim().split('\n')
    expect(lines).toHaveLength(5)
    expect(screen.getByText(/5 UUIDs generated/)).toBeInTheDocument()
  })

  it('generates a custom count of UUIDs', () => {
    render(<UuidGenerator />)
    const countInput = screen.getByPlaceholderText('5')
    fireEvent.change(countInput, { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const lines = getOutput().value.trim().split('\n')
    expect(lines).toHaveLength(3)
    expect(screen.getByText(/3 UUIDs generated/)).toBeInTheDocument()
  })

  it('generates uppercase UUIDs when Uppercase toggle is on', () => {
    render(<UuidGenerator />)
    const uppercaseToggle = screen.getByLabelText('Uppercase')
    fireEvent.click(uppercaseToggle)
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const lines = getOutput().value.trim().split('\n')
    lines.forEach((line) => {
      expect(line).toBe(line.toUpperCase())
    })
  })

  it('generates UUIDs without hyphens when Hyphens toggle is off', () => {
    render(<UuidGenerator />)
    const hyphensToggle = screen.getByLabelText('Hyphens')
    // Toggle is on by default — click to turn off
    fireEvent.click(hyphensToggle)
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const lines = getOutput().value.trim().split('\n')
    lines.forEach((line) => {
      expect(line).not.toContain('-')
      expect(line).toHaveLength(32)
    })
  })

  it('wraps UUIDs in braces when Braces toggle is on', () => {
    render(<UuidGenerator />)
    const bracesToggle = screen.getByLabelText('Braces {…}')
    fireEvent.click(bracesToggle)
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const lines = getOutput().value.trim().split('\n')
    lines.forEach((line) => {
      expect(line).toMatch(/^\{.+\}$/)
    })
  })

  it('shows "1 UUID generated" for count=1', () => {
    render(<UuidGenerator />)
    const countInput = screen.getByPlaceholderText('5')
    fireEvent.change(countInput, { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    expect(screen.getByText('1 UUID generated')).toBeInTheDocument()
  })

  it('each generation produces different output (randomness check)', () => {
    render(<UuidGenerator />)
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const first = getOutput().value
    fireEvent.click(screen.getByRole('button', { name: /Generate/i }))
    const second = getOutput().value
    // Extremely unlikely two full batches of 5 UUIDs are identical
    expect(first).not.toBe(second)
  })
})
