import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UlidGenerator from '@/components/tools/UlidGenerator'

// ── ULID regex: 26 chars, Crockford Base32 (no I, L, O, U)
const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/

// ── UUID v7 regex
const UUIDV7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Helpers to find the output textarea by looking for either ULID or UUIDv7 placeholder
function getUlidOutput(): HTMLTextAreaElement {
  return screen.getByPlaceholderText(/Generated ULIDs/) as HTMLTextAreaElement
}

function getUuidOutput(): HTMLTextAreaElement {
  return screen.getByPlaceholderText(/Generated UUID/) as HTMLTextAreaElement
}

function clickGenerate() {
  fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
}

describe('UlidGenerator', () => {
  it('generates a single valid ULID by default', () => {
    render(<UlidGenerator />)
    clickGenerate()
    const out = getUlidOutput().value
    expect(out.trim()).toMatch(ULID_RE)
  })

  it('ULID alphabet contains no I, L, O, U', () => {
    render(<UlidGenerator />)
    fireEvent.change(screen.getByPlaceholderText('1'), { target: { value: '20' } })
    clickGenerate()
    const out = getUlidOutput().value
    expect(out).not.toMatch(/[ILOU]/i)
  })

  it('generates 3 ULIDs when count is 3', () => {
    render(<UlidGenerator />)
    fireEvent.change(screen.getByPlaceholderText('1'), { target: { value: '3' } })
    clickGenerate()
    const out = getUlidOutput().value
    const lines = out.trim().split('\n')
    expect(lines).toHaveLength(3)
    for (const line of lines) expect(line).toMatch(ULID_RE)
  })

  it('generates a single valid UUID v7', () => {
    render(<UlidGenerator />)
    fireEvent.click(screen.getByRole('tab', { name: 'UUID v7' }))
    clickGenerate()
    const out = getUuidOutput().value
    expect(out.trim()).toMatch(UUIDV7_RE)
  })

  it('UUID v7 has correct version nibble (7) and variant bits (8/9/a/b)', () => {
    render(<UlidGenerator />)
    fireEvent.click(screen.getByRole('tab', { name: 'UUID v7' }))
    clickGenerate()
    const out = getUuidOutput().value
    const parts = out.trim().split('-')
    // version nibble: first char of 3rd group
    expect(parts[2][0]).toBe('7')
    // variant bits: first char of 4th group must be 8, 9, a, or b
    expect(['8', '9', 'a', 'b']).toContain(parts[3][0].toLowerCase())
  })

  it('generates 3 UUID v7 values when count is 3', () => {
    render(<UlidGenerator />)
    fireEvent.click(screen.getByRole('tab', { name: 'UUID v7' }))
    fireEvent.change(screen.getByPlaceholderText('1'), { target: { value: '3' } })
    clickGenerate()
    const out = getUuidOutput().value
    const lines = out.trim().split('\n')
    expect(lines).toHaveLength(3)
    for (const line of lines) expect(line).toMatch(UUIDV7_RE)
  })

  it('shows an error when count is 0', () => {
    render(<UlidGenerator />)
    fireEvent.change(screen.getByPlaceholderText('1'), { target: { value: '0' } })
    clickGenerate()
    expect(screen.getByText(/Count must be between 1 and 100/i)).toBeInTheDocument()
  })

  it('shows an error when count exceeds 100', () => {
    render(<UlidGenerator />)
    fireEvent.change(screen.getByPlaceholderText('1'), { target: { value: '101' } })
    clickGenerate()
    expect(screen.getByText(/Count must be between 1 and 100/i)).toBeInTheDocument()
  })

  it('generates unique ULIDs (no duplicates in 10)', () => {
    render(<UlidGenerator />)
    fireEvent.change(screen.getByPlaceholderText('1'), { target: { value: '10' } })
    clickGenerate()
    const out = getUlidOutput().value
    const lines = out.trim().split('\n')
    expect(new Set(lines).size).toBe(lines.length)
  })
})
