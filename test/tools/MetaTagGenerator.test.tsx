import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MetaTagGenerator from '@/components/tools/MetaTagGenerator'

function out() {
  return screen.getByPlaceholderText('Tags appear here…') as HTMLTextAreaElement
}

describe('MetaTagGenerator', () => {
  it('shows a prompt notice with no input', () => {
    render(<MetaTagGenerator />)
    expect(screen.getByText(/Fill in at least one field/i)).toBeInTheDocument()
  })

  it('emits a <title> tag', () => {
    render(<MetaTagGenerator />)
    fireEvent.change(screen.getByPlaceholderText('My Page'), { target: { value: 'My Page' } })
    expect(out().value).toContain('<title>My Page</title>')
  })

  it('emits a description meta tag', () => {
    render(<MetaTagGenerator />)
    fireEvent.change(screen.getByPlaceholderText(/short, descriptive summary/i), {
      target: { value: 'Hello' },
    })
    expect(out().value).toContain('<meta name="description" content="Hello">')
  })

  it('emits title and description together', () => {
    render(<MetaTagGenerator />)
    fireEvent.change(screen.getByPlaceholderText('My Page'), { target: { value: 'My Page' } })
    fireEvent.change(screen.getByPlaceholderText(/short, descriptive summary/i), {
      target: { value: 'Hello' },
    })
    const value = out().value
    expect(value).toContain('<title>My Page</title>')
    expect(value).toContain('<meta name="description" content="Hello">')
  })

  it('HTML-escapes attribute values', () => {
    render(<MetaTagGenerator />)
    fireEvent.change(screen.getByPlaceholderText(/short, descriptive summary/i), {
      target: { value: 'a "quote" & <tag>' },
    })
    const value = out().value
    expect(value).toContain('content="a &quot;quote&quot; &amp; &lt;tag&gt;"')
    expect(value).not.toContain('"quote"')
  })

  it('escapes the title text content', () => {
    render(<MetaTagGenerator />)
    fireEvent.change(screen.getByPlaceholderText('My Page'), {
      target: { value: 'A & B <x>' },
    })
    expect(out().value).toContain('<title>A &amp; B &lt;x&gt;</title>')
  })

  it('emits a canonical link tag', () => {
    render(<MetaTagGenerator />)
    fireEvent.change(screen.getByPlaceholderText('https://example.com/page'), {
      target: { value: 'https://example.com/page' },
    })
    expect(out().value).toContain('<link rel="canonical" href="https://example.com/page">')
  })

  it('includes the viewport tag by default and removes it when toggled off', () => {
    render(<MetaTagGenerator />)
    fireEvent.change(screen.getByPlaceholderText('My Page'), { target: { value: 'My Page' } })
    expect(out().value).toContain('name="viewport"')
    fireEvent.click(screen.getByLabelText(/responsive viewport tag/i))
    expect(out().value).not.toContain('name="viewport"')
  })

  it('emits the selected robots directive', () => {
    render(<MetaTagGenerator />)
    fireEvent.change(screen.getByPlaceholderText('My Page'), { target: { value: 'My Page' } })
    const select = screen.getByDisplayValue('index, follow')
    fireEvent.change(select, { target: { value: 'noindex, nofollow' } })
    expect(out().value).toContain('<meta name="robots" content="noindex, nofollow">')
  })

  it('emits keywords and author tags', () => {
    render(<MetaTagGenerator />)
    fireEvent.change(screen.getByPlaceholderText('keyword one, keyword two'), {
      target: { value: 'seo, tools' },
    })
    fireEvent.change(screen.getByPlaceholderText('Jane Doe'), { target: { value: 'Jane Doe' } })
    const value = out().value
    expect(value).toContain('<meta name="keywords" content="seo, tools">')
    expect(value).toContain('<meta name="author" content="Jane Doe">')
  })
})
