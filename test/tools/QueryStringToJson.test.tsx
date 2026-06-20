import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QueryStringToJson from '@/components/tools/QueryStringToJson'

function getInput() {
  // First textarea is input, second is output (readOnly)
  return screen.getAllByRole('textbox')[0] as HTMLTextAreaElement
}

function getOutput() {
  return screen.getAllByRole('textbox')[1] as HTMLTextAreaElement
}

function setInput(value: string) {
  fireEvent.change(getInput(), { target: { value } })
}

describe('QueryStringToJson', () => {
  describe('Query → JSON mode', () => {
    it('parses a simple query string', () => {
      render(<QueryStringToJson />)
      setInput('a=1&b=2')
      const out = JSON.parse(getOutput().value)
      expect(out).toEqual({ a: '1', b: '2' })
    })

    it('collapses repeated keys into an array', () => {
      render(<QueryStringToJson />)
      setInput('a=1&b=2&a=3')
      const out = JSON.parse(getOutput().value)
      expect(out.a).toEqual(['1', '3'])
      expect(out.b).toBe('2')
    })

    it('accepts a full URL and extracts query params', () => {
      render(<QueryStringToJson />)
      setInput('https://example.com/path?q=hello&lang=en')
      const out = JSON.parse(getOutput().value)
      expect(out.q).toBe('hello')
      expect(out.lang).toBe('en')
    })

    it('accepts a query string with a leading ?', () => {
      render(<QueryStringToJson />)
      setInput('?x=10&y=20')
      const out = JSON.parse(getOutput().value)
      expect(out.x).toBe('10')
      expect(out.y).toBe('20')
    })

    it('handles URL-encoded values', () => {
      render(<QueryStringToJson />)
      setInput('msg=hello+world&tag=a%2Cb')
      const out = JSON.parse(getOutput().value)
      expect(out.msg).toBe('hello world')
      expect(out.tag).toBe('a,b')
    })

    it('returns empty object for empty query string', () => {
      render(<QueryStringToJson />)
      setInput('?')
      const out = JSON.parse(getOutput().value)
      expect(out).toEqual({})
    })
  })

  describe('JSON → Query mode', () => {
    function switchToJ2Q() {
      fireEvent.click(screen.getByRole('tab', { name: 'JSON → Query' }))
    }

    it('converts a simple JSON object to a query string', () => {
      render(<QueryStringToJson />)
      switchToJ2Q()
      setInput('{"a":"1","b":"hello"}')
      const out = getOutput().value
      const params = new URLSearchParams(out)
      expect(params.get('a')).toBe('1')
      expect(params.get('b')).toBe('hello')
    })

    it('repeats keys for array values', () => {
      render(<QueryStringToJson />)
      switchToJ2Q()
      setInput('{"a":["1","3"],"b":"2"}')
      const out = getOutput().value
      const params = new URLSearchParams(out)
      expect(params.getAll('a')).toEqual(['1', '3'])
      expect(params.get('b')).toBe('2')
    })

    it('shows an error for invalid JSON', () => {
      render(<QueryStringToJson />)
      switchToJ2Q()
      setInput('{bad}')
      // The notice shows the native JSON.parse error — check via class
      const notice = document.querySelector('.notice.error')
      expect(notice).not.toBeNull()
      expect(notice!.textContent).toBeTruthy()
    })

    it('shows an error for non-object JSON (array at root)', () => {
      render(<QueryStringToJson />)
      switchToJ2Q()
      setInput('[1,2,3]')
      expect(screen.getByText(/Top-level value must be a JSON object/i)).toBeInTheDocument()
    })

    it('round-trips a simple object: Q→J then J→Q', () => {
      // Parse query string, then convert back
      render(<QueryStringToJson />)
      setInput('name=alice&age=30')
      const jsonOut = getOutput().value
      // Switch to J→Q
      fireEvent.click(screen.getByRole('tab', { name: 'JSON → Query' }))
      setInput(jsonOut)
      const qs = getOutput().value
      const params = new URLSearchParams(qs)
      expect(params.get('name')).toBe('alice')
      expect(params.get('age')).toBe('30')
    })
  })

  it('is empty for empty input', () => {
    render(<QueryStringToJson />)
    expect(getOutput().value).toBe('')
  })
})
