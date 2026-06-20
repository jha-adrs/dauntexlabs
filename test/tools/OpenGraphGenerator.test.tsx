import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OpenGraphGenerator from '@/components/tools/OpenGraphGenerator'

function out() {
  return screen.getByPlaceholderText('Tags appear here…') as HTMLTextAreaElement
}

describe('OpenGraphGenerator', () => {
  it('shows a prompt notice with no input', () => {
    render(<OpenGraphGenerator />)
    expect(screen.getByText(/Fill in at least one field/i)).toBeInTheDocument()
  })

  it('emits og:title, og:description and og:url', () => {
    render(<OpenGraphGenerator />)
    fireEvent.change(screen.getByPlaceholderText('My Page'), { target: { value: 'T' } })
    fireEvent.change(screen.getByPlaceholderText(/shown in link previews/i), {
      target: { value: 'D' },
    })
    fireEvent.change(screen.getByPlaceholderText('https://example.com/page'), {
      target: { value: 'https://x.com' },
    })
    const value = out().value
    expect(value).toContain('property="og:title" content="T"')
    expect(value).toContain('property="og:description" content="D"')
    expect(value).toContain('property="og:url" content="https://x.com"')
  })

  it('emits og:type from the select (website by default)', () => {
    render(<OpenGraphGenerator />)
    fireEvent.change(screen.getByPlaceholderText('My Page'), { target: { value: 'T' } })
    expect(out().value).toContain('property="og:type" content="website"')
    fireEvent.change(screen.getByDisplayValue('website'), { target: { value: 'article' } })
    expect(out().value).toContain('property="og:type" content="article"')
  })

  it('does not emit social card tags by default', () => {
    render(<OpenGraphGenerator />)
    fireEvent.change(screen.getByPlaceholderText('My Page'), { target: { value: 'T' } })
    expect(out().value).not.toContain('twitter:card')
  })

  it('adds twitter:card and mirrored tags when cards are toggled on', () => {
    render(<OpenGraphGenerator />)
    fireEvent.change(screen.getByPlaceholderText('My Page'), { target: { value: 'T' } })
    fireEvent.change(screen.getByPlaceholderText(/shown in link previews/i), {
      target: { value: 'D' },
    })
    fireEvent.click(screen.getByLabelText(/also emit social card tags/i))
    const value = out().value
    expect(value).toContain('name="twitter:card"')
    expect(value).toContain('name="twitter:title" content="T"')
    expect(value).toContain('name="twitter:description" content="D"')
  })

  it('uses the chosen card type', () => {
    render(<OpenGraphGenerator />)
    fireEvent.change(screen.getByPlaceholderText('My Page'), { target: { value: 'T' } })
    fireEvent.click(screen.getByLabelText(/also emit social card tags/i))
    expect(out().value).toContain('name="twitter:card" content="summary_large_image"')
    fireEvent.change(screen.getByDisplayValue('summary (large image)'), {
      target: { value: 'summary' },
    })
    expect(out().value).toContain('name="twitter:card" content="summary"')
  })

  it('emits og:image', () => {
    render(<OpenGraphGenerator />)
    fireEvent.change(screen.getByPlaceholderText('https://example.com/preview.png'), {
      target: { value: 'https://example.com/preview.png' },
    })
    expect(out().value).toContain('property="og:image" content="https://example.com/preview.png"')
  })

  it('HTML-escapes attribute values', () => {
    render(<OpenGraphGenerator />)
    fireEvent.change(screen.getByPlaceholderText('My Page'), {
      target: { value: 'a "b" & <c>' },
    })
    expect(out().value).toContain(
      'property="og:title" content="a &quot;b&quot; &amp; &lt;c&gt;"',
    )
  })
})
