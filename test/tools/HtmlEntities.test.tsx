import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HtmlEntities from '@/components/tools/HtmlEntities'

describe('HtmlEntities', () => {
  it('encodes < > & " \' to named entities', () => {
    render(<HtmlEntities />)
    fireEvent.change(screen.getByPlaceholderText(/Enter text to encode/), {
      target: { value: '<a href="x">' },
    })
    expect(screen.getByPlaceholderText('Result…')).toHaveValue(
      '&lt;a href=&quot;x&quot;&gt;'
    )
  })

  it('encodes ampersand alone', () => {
    render(<HtmlEntities />)
    fireEvent.change(screen.getByPlaceholderText(/Enter text to encode/), {
      target: { value: 'a & b' },
    })
    expect(screen.getByPlaceholderText('Result…')).toHaveValue('a &amp; b')
  })

  it("encodes single quote to &#39;", () => {
    render(<HtmlEntities />)
    fireEvent.change(screen.getByPlaceholderText(/Enter text to encode/), {
      target: { value: "it's" },
    })
    expect(screen.getByPlaceholderText('Result…')).toHaveValue("it&#39;s")
  })

  it('decodes &lt;a href=&quot;x&quot;&gt; back to <a href="x">', () => {
    render(<HtmlEntities />)
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    fireEvent.change(screen.getByPlaceholderText(/Enter HTML entities to decode/), {
      target: { value: '&lt;a href=&quot;x&quot;&gt;' },
    })
    expect(screen.getByPlaceholderText('Result…')).toHaveValue('<a href="x">')
  })

  it('decodes &amp; to &', () => {
    render(<HtmlEntities />)
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    fireEvent.change(screen.getByPlaceholderText(/Enter HTML entities to decode/), {
      target: { value: 'a &amp; b' },
    })
    expect(screen.getByPlaceholderText('Result…')).toHaveValue('a & b')
  })

  it('decodes decimal numeric entities &#65; → A', () => {
    render(<HtmlEntities />)
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    fireEvent.change(screen.getByPlaceholderText(/Enter HTML entities to decode/), {
      target: { value: '&#65;&#66;&#67;' },
    })
    expect(screen.getByPlaceholderText('Result…')).toHaveValue('ABC')
  })

  it('decodes hex numeric entities &#x41; → A', () => {
    render(<HtmlEntities />)
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    fireEvent.change(screen.getByPlaceholderText(/Enter HTML entities to decode/), {
      target: { value: '&#x41;&#x42;&#x43;' },
    })
    expect(screen.getByPlaceholderText('Result…')).toHaveValue('ABC')
  })

  it('encodes non-ASCII to &#NNN; when toggle is on', () => {
    render(<HtmlEntities />)
    fireEvent.click(screen.getByLabelText('Encode non-ASCII'))
    fireEvent.change(screen.getByPlaceholderText(/Enter text to encode/), {
      target: { value: 'café' },
    })
    const result = (screen.getByPlaceholderText('Result…') as HTMLTextAreaElement).value
    // 'é' = U+00E9 = 233
    expect(result).toContain('&#233;')
    expect(result).toContain('caf')
  })

  it('does NOT encode ASCII printables as numeric when toggle is off', () => {
    render(<HtmlEntities />)
    fireEvent.change(screen.getByPlaceholderText(/Enter text to encode/), {
      target: { value: 'hello' },
    })
    expect(screen.getByPlaceholderText('Result…')).toHaveValue('hello')
  })

  it('result is empty for empty input (encode mode)', () => {
    render(<HtmlEntities />)
    expect(screen.getByPlaceholderText('Result…')).toHaveValue('')
  })

  it('result is empty for empty input (decode mode)', () => {
    render(<HtmlEntities />)
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    expect(screen.getByPlaceholderText('Result…')).toHaveValue('')
  })

  it('decodes named entity &copy; to ©', () => {
    render(<HtmlEntities />)
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    fireEvent.change(screen.getByPlaceholderText(/Enter HTML entities to decode/), {
      target: { value: '&copy; 2024' },
    })
    expect(screen.getByPlaceholderText('Result…')).toHaveValue('© 2024')
  })

  it('renders a CopyButton', () => {
    render(<HtmlEntities />)
    expect(screen.getByText('copy')).toBeInTheDocument()
  })
})
