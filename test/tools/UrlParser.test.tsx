import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UrlParser from '@/components/tools/UrlParser'

function setUrl(value: string) {
  fireEvent.change(
    screen.getByPlaceholderText('https://user:pw@example.com:8080/path?q=1#section'),
    { target: { value } },
  )
}

function cell(label: string): string {
  const table = screen.getByRole('table', { name: 'URL components' })
  const rows = table.querySelectorAll('tr')
  for (const row of rows) {
    const cells = row.querySelectorAll('td')
    if (cells.length >= 2 && cells[0].textContent?.trim() === label) {
      return cells[1].textContent?.trim() ?? ''
    }
  }
  return ''
}

describe('UrlParser', () => {
  it('parses hostname correctly', () => {
    render(<UrlParser />)
    setUrl('https://user:pw@example.com:8080/a/b?q=1&x=2#frag')
    expect(cell('Hostname')).toBe('example.com')
  })

  it('parses port correctly', () => {
    render(<UrlParser />)
    setUrl('https://user:pw@example.com:8080/a/b?q=1&x=2#frag')
    expect(cell('Port')).toBe('8080')
  })

  it('parses pathname correctly', () => {
    render(<UrlParser />)
    setUrl('https://user:pw@example.com:8080/a/b?q=1&x=2#frag')
    expect(cell('Pathname')).toBe('/a/b')
  })

  it('parses hash correctly', () => {
    render(<UrlParser />)
    setUrl('https://user:pw@example.com:8080/a/b?q=1&x=2#frag')
    expect(cell('Hash')).toBe('#frag')
  })

  it('parses protocol correctly', () => {
    render(<UrlParser />)
    setUrl('https://example.com/path')
    expect(cell('Protocol')).toBe('https:')
  })

  it('parses username and password', () => {
    render(<UrlParser />)
    setUrl('https://user:pw@example.com:8080/a/b?q=1&x=2#frag')
    expect(cell('Username')).toBe('user')
    expect(cell('Password')).toBe('pw')
  })

  it('renders query parameters table with correct key/value pairs', () => {
    render(<UrlParser />)
    setUrl('https://user:pw@example.com:8080/a/b?q=1&x=2#frag')
    const paramTable = screen.getByRole('table', { name: 'Query parameters' })
    const rows = paramTable.querySelectorAll('tbody tr')
    const params: Record<string, string> = {}
    for (const row of rows) {
      const cells = row.querySelectorAll('td')
      if (cells.length >= 2) {
        params[cells[0].textContent!.trim()] = cells[1].textContent!.trim()
      }
    }
    expect(params['q']).toBe('1')
    expect(params['x']).toBe('2')
  })

  it('shows origin correctly', () => {
    render(<UrlParser />)
    setUrl('https://example.com:8080/path')
    expect(cell('Origin')).toBe('https://example.com:8080')
  })

  it('shows dash for missing optional fields', () => {
    render(<UrlParser />)
    setUrl('https://example.com/path')
    // Port is empty when not specified (default for https)
    expect(cell('Port')).toBe('—')
    expect(cell('Username')).toBe('—')
    expect(cell('Password')).toBe('—')
    expect(cell('Hash')).toBe('—')
  })

  it('shows an error for an invalid URL', () => {
    render(<UrlParser />)
    setUrl('not-a-valid-url')
    expect(screen.getByText(/Invalid URL/i)).toBeInTheDocument()
  })

  it('shows nothing for empty input', () => {
    render(<UrlParser />)
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByText(/Invalid URL/i)).toBeNull()
  })

  it('handles URLs without query parameters (no params table)', () => {
    render(<UrlParser />)
    setUrl('https://example.com/path')
    expect(screen.queryByRole('table', { name: 'Query parameters' })).toBeNull()
  })

  it('parses search string correctly', () => {
    render(<UrlParser />)
    setUrl('https://example.com/path?q=1&x=2')
    expect(cell('Search')).toBe('?q=1&x=2')
  })
})
