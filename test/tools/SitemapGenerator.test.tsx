import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SitemapGenerator from '@/components/tools/SitemapGenerator'

describe('SitemapGenerator', () => {
  it('renders a textarea for URL input', () => {
    render(<SitemapGenerator />)
    expect(
      screen.getByPlaceholderText(/https:\/\/example\.com\//),
    ).toBeInTheDocument()
  })

  it('generates a valid XML sitemap with two URLs', () => {
    render(<SitemapGenerator />)

    fireEvent.change(screen.getByPlaceholderText(/https:\/\/example\.com\//), {
      target: { value: 'https://x.com/\nhttps://x.com/about' },
    })

    const textareas = document.querySelectorAll('textarea[readonly]')
    expect(textareas.length).toBeGreaterThan(0)
    const outputText = (textareas[0] as HTMLTextAreaElement).value

    expect(outputText).toContain('<urlset')
    const locMatches = outputText.match(/<loc>/g)
    expect(locMatches).not.toBeNull()
    expect(locMatches!.length).toBe(2)
    expect(outputText).toContain('<loc>https://x.com/</loc>')
    expect(outputText).toContain('<loc>https://x.com/about</loc>')
  })

  it('includes XML declaration and closing urlset tag', () => {
    render(<SitemapGenerator />)

    fireEvent.change(screen.getByPlaceholderText(/https:\/\/example\.com\//), {
      target: { value: 'https://example.com/' },
    })

    const textareas = document.querySelectorAll('textarea[readonly]')
    const outputText = (textareas[0] as HTMLTextAreaElement).value

    expect(outputText).toContain('<?xml version="1.0"')
    expect(outputText).toContain('</urlset>')
  })

  it('shows a notice for empty input', () => {
    render(<SitemapGenerator />)
    expect(screen.getByText(/Enter at least one URL/i)).toBeInTheDocument()
  })

  it('XML-escapes ampersands in URLs', () => {
    render(<SitemapGenerator />)

    fireEvent.change(screen.getByPlaceholderText(/https:\/\/example\.com\//), {
      target: { value: 'https://example.com/?a=1&b=2' },
    })

    const textareas = document.querySelectorAll('textarea[readonly]')
    const outputText = (textareas[0] as HTMLTextAreaElement).value

    expect(outputText).toContain('&amp;')
    expect(outputText).not.toContain('&b=')
  })

  it('includes changefreq and priority in each url entry', () => {
    render(<SitemapGenerator />)

    fireEvent.change(screen.getByPlaceholderText(/https:\/\/example\.com\//), {
      target: { value: 'https://example.com/' },
    })

    const textareas = document.querySelectorAll('textarea[readonly]')
    const outputText = (textareas[0] as HTMLTextAreaElement).value

    expect(outputText).toContain('<changefreq>')
    expect(outputText).toContain('<priority>')
  })

  it('skips empty lines in input', () => {
    render(<SitemapGenerator />)

    fireEvent.change(screen.getByPlaceholderText(/https:\/\/example\.com\//), {
      target: { value: 'https://example.com/\n\n\nhttps://example.com/page' },
    })

    const textareas = document.querySelectorAll('textarea[readonly]')
    const outputText = (textareas[0] as HTMLTextAreaElement).value

    const locMatches = outputText.match(/<loc>/g)
    expect(locMatches!.length).toBe(2)
  })
})
