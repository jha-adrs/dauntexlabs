import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UrlEncodeDecode from '@/components/tools/UrlEncodeDecode'

describe('UrlEncodeDecode', () => {
  it('renders with Encode mode active by default', () => {
    render(<UrlEncodeDecode />)
    expect(screen.getByRole('tab', { name: 'Encode' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Decode' })).toHaveAttribute('aria-selected', 'false')
  })

  it('encodes a component value (encodeURIComponent) by default', () => {
    render(<UrlEncodeDecode />)
    const input = screen.getByPlaceholderText('value with spaces & symbols')
    fireEvent.change(input, { target: { value: 'hello world & more' } })
    const output = screen.getByPlaceholderText('Result…')
    expect(output).toHaveValue('hello%20world%20%26%20more')
  })

  it('encodes special characters (encodeURIComponent)', () => {
    render(<UrlEncodeDecode />)
    const input = screen.getByPlaceholderText('value with spaces & symbols')
    fireEvent.change(input, { target: { value: 'a=1&b=2+3' } })
    const output = screen.getByPlaceholderText('Result…')
    expect(output).toHaveValue('a%3D1%26b%3D2%2B3')
  })

  it('encodes whole URI preserving structure (encodeURI)', () => {
    render(<UrlEncodeDecode />)
    // enable "encode whole URI" toggle
    fireEvent.click(screen.getByLabelText('encode whole URI (encodeURI)'))
    const input = screen.getByPlaceholderText('https://example.com/path with spaces?a=b')
    fireEvent.change(input, { target: { value: 'https://example.com/path with spaces?a=b' } })
    const output = screen.getByPlaceholderText('Result…')
    // encodeURI preserves ://?&= but encodes spaces
    const val = (output as HTMLTextAreaElement).value
    expect(val).toContain('https://')
    expect(val).toContain('%20')
    expect(val).not.toContain('%3A')  // colon should NOT be encoded
    expect(val).not.toContain('%2F')  // slash should NOT be encoded
  })

  it('decodes an encoded value back to original', () => {
    render(<UrlEncodeDecode />)
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    const input = screen.getByPlaceholderText('value%20with%20spaces')
    fireEvent.change(input, { target: { value: 'hello%20world%20%26%20more' } })
    const output = screen.getByPlaceholderText('Result…')
    expect(output).toHaveValue('hello world & more')
  })

  it('decodes plus-encoded spaces in query strings', () => {
    render(<UrlEncodeDecode />)
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    const input = screen.getByPlaceholderText('value%20with%20spaces')
    // %2B is a literal + sign
    fireEvent.change(input, { target: { value: 'hello%2Bworld' } })
    const output = screen.getByPlaceholderText('Result…')
    expect(output).toHaveValue('hello+world')
  })

  it('round-trips encode then decode', () => {
    const testValue = 'foo bar/baz?qux=1&norf=2'
    render(<UrlEncodeDecode />)
    // encode
    const encInput = screen.getByPlaceholderText('value with spaces & symbols')
    fireEvent.change(encInput, { target: { value: testValue } })
    const encodedVal = (screen.getByPlaceholderText('Result…') as HTMLTextAreaElement).value
    expect(encodedVal).not.toBe(testValue)
    // decode the encoded value
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    const decInput = screen.getByPlaceholderText('value%20with%20spaces')
    fireEvent.change(decInput, { target: { value: encodedVal } })
    expect(screen.getByPlaceholderText('Result…')).toHaveValue(testValue)
  })

  it('produces empty output for empty input', () => {
    render(<UrlEncodeDecode />)
    expect(screen.getByPlaceholderText('Result…')).toHaveValue('')
  })

  it('switches to Parse query mode and shows params from URL', () => {
    render(<UrlEncodeDecode />)
    fireEvent.click(screen.getByRole('tab', { name: 'Parse query' }))
    // In query mode, there's a different textarea
    const input = screen.getByPlaceholderText('https://example.com/search?q=hello+world&page=2')
    fireEvent.change(input, { target: { value: 'https://example.com/search?q=hello+world&page=2' } })
    // Should show the key/value table
    expect(screen.getByText('q')).toBeInTheDocument()
    expect(screen.getByText('hello world')).toBeInTheDocument()
    expect(screen.getByText('page')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows base URL when parsing a full URL', () => {
    render(<UrlEncodeDecode />)
    fireEvent.click(screen.getByRole('tab', { name: 'Parse query' }))
    const input = screen.getByPlaceholderText('https://example.com/search?q=hello+world&page=2')
    fireEvent.change(input, { target: { value: 'https://example.com/search?q=test&sort=asc' } })
    expect(screen.getByText(/base:/)).toBeInTheDocument()
    expect(screen.getByText('q')).toBeInTheDocument()
    expect(screen.getByText('test')).toBeInTheDocument()
    expect(screen.getByText('sort')).toBeInTheDocument()
    expect(screen.getByText('asc')).toBeInTheDocument()
  })

  it('shows info notice when query mode has no input', () => {
    render(<UrlEncodeDecode />)
    fireEvent.click(screen.getByRole('tab', { name: 'Parse query' }))
    expect(screen.getByText(/Enter a URL or query string/i)).toBeInTheDocument()
  })

  it('shows "No query parameters found" for URL without query string', () => {
    render(<UrlEncodeDecode />)
    fireEvent.click(screen.getByRole('tab', { name: 'Parse query' }))
    const input = screen.getByPlaceholderText('https://example.com/search?q=hello+world&page=2')
    fireEvent.change(input, { target: { value: 'https://example.com/no-params' } })
    expect(screen.getByText(/No query parameters found/i)).toBeInTheDocument()
  })

  it('parses bare query string without a base URL', () => {
    render(<UrlEncodeDecode />)
    fireEvent.click(screen.getByRole('tab', { name: 'Parse query' }))
    const input = screen.getByPlaceholderText('https://example.com/search?q=hello+world&page=2')
    fireEvent.change(input, { target: { value: 'name=Alice&age=30&city=New%20York' } })
    expect(screen.getByText('name')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('age')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('city')).toBeInTheDocument()
    expect(screen.getByText('New York')).toBeInTheDocument()
  })
})
