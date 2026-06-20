import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RobotsTxtGenerator from '@/components/tools/RobotsTxtGenerator'

describe('RobotsTxtGenerator', () => {
  it('renders a User-agent field defaulting to *', () => {
    render(<RobotsTxtGenerator />)
    const input = screen.getByPlaceholderText('*') as HTMLInputElement
    expect(input.value).toBe('*')
  })

  it('generates robots.txt with Disallow and Sitemap', () => {
    render(<RobotsTxtGenerator />)

    // Type a disallow path
    fireEvent.change(screen.getByPlaceholderText(/\/admin/), {
      target: { value: '/admin' },
    })

    // Type a sitemap URL
    fireEvent.change(screen.getByPlaceholderText('https://example.com/sitemap.xml'), {
      target: { value: 'https://x.com/sitemap.xml' },
    })

    // Find the readonly textarea (the output panel)
    const textareas = document.querySelectorAll('textarea[readonly]')
    expect(textareas.length).toBeGreaterThan(0)
    const outputText = (textareas[0] as HTMLTextAreaElement).value

    expect(outputText).toContain('User-agent: *')
    expect(outputText).toContain('Disallow: /admin')
    expect(outputText).toContain('Sitemap: https://x.com/sitemap.xml')
  })

  it('includes multiple disallow paths', () => {
    render(<RobotsTxtGenerator />)

    fireEvent.change(screen.getByPlaceholderText(/\/admin/), {
      target: { value: '/admin\n/private\n/tmp' },
    })

    const textareas = document.querySelectorAll('textarea[readonly]')
    const outputText = (textareas[0] as HTMLTextAreaElement).value

    expect(outputText).toContain('Disallow: /admin')
    expect(outputText).toContain('Disallow: /private')
    expect(outputText).toContain('Disallow: /tmp')
  })

  it('includes Allow paths when provided', () => {
    render(<RobotsTxtGenerator />)

    fireEvent.change(screen.getByPlaceholderText(/\/public/), {
      target: { value: '/public' },
    })

    const textareas = document.querySelectorAll('textarea[readonly]')
    const outputText = (textareas[0] as HTMLTextAreaElement).value

    expect(outputText).toContain('Allow: /public')
  })

  it('includes Crawl-delay when set', () => {
    render(<RobotsTxtGenerator />)

    fireEvent.change(screen.getByPlaceholderText('e.g. 10'), {
      target: { value: '5' },
    })

    const textareas = document.querySelectorAll('textarea[readonly]')
    const outputText = (textareas[0] as HTMLTextAreaElement).value

    expect(outputText).toContain('Crawl-delay: 5')
  })

  it('uses the user-agent value in output', () => {
    render(<RobotsTxtGenerator />)

    fireEvent.change(screen.getByPlaceholderText('*'), {
      target: { value: 'Googlebot' },
    })

    const textareas = document.querySelectorAll('textarea[readonly]')
    const outputText = (textareas[0] as HTMLTextAreaElement).value

    expect(outputText).toContain('User-agent: Googlebot')
  })
})
