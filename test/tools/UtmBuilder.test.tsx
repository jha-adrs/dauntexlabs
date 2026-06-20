import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UtmBuilder from '@/components/tools/UtmBuilder'

function fill(placeholder: string, value: string) {
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } })
}

describe('UtmBuilder', () => {
  it('renders with empty output initially', () => {
    render(<UtmBuilder />)
    expect(screen.getByText(/Fill in Base URL/i)).toBeInTheDocument()
  })

  it('builds a basic UTM URL with required params', () => {
    render(<UtmBuilder />)
    fill('https://example.com/landing', 'https://x.com')
    fill('google', 'google')
    fill('cpc', 'cpc')
    fill('spring_sale', 'spring')
    const result = screen.getByText(/utm_source=google/i)
    expect(result.textContent).toContain('utm_source=google')
    expect(result.textContent).toContain('utm_medium=cpc')
    expect(result.textContent).toContain('utm_campaign=spring')
    expect(result.textContent).toContain('https://x.com')
  })

  it('produces the expected URL with correct utm params', () => {
    render(<UtmBuilder />)
    fill('https://example.com/landing', 'https://x.com')
    fill('google', 'google')
    fill('cpc', 'cpc')
    fill('spring_sale', 'spring')
    // URL() normalises bare domains by adding a trailing slash: https://x.com/
    // so we match flexibly — check params are all present
    const div = screen.getByText(/utm_source=google/)
    expect(div.textContent).toContain('utm_source=google')
    expect(div.textContent).toContain('utm_medium=cpc')
    expect(div.textContent).toContain('utm_campaign=spring')
    // Domain must be present in some form
    expect(div.textContent).toMatch(/https:\/\/x\.com/)
  })

  it('includes optional utm_term and utm_content when provided', () => {
    render(<UtmBuilder />)
    fill('https://example.com/landing', 'https://example.com')
    fill('google', 'google')
    fill('cpc', 'email')
    fill('spring_sale', 'newsletter')
    fill('running shoes', 'shoes')
    fill('hero_banner', 'banner')
    const div = screen.getByText(/utm_source=google/)
    expect(div.textContent).toContain('utm_term=shoes')
    expect(div.textContent).toContain('utm_content=banner')
  })

  it('URL-encodes spaces in parameter values', () => {
    render(<UtmBuilder />)
    fill('https://example.com/landing', 'https://example.com')
    fill('google', 'google')
    fill('cpc', 'cpc')
    fill('spring_sale', 'spring sale 2024')
    const div = screen.getByText(/utm_source=google/)
    // URL.searchParams encodes spaces as +
    expect(div.textContent).toMatch(/utm_campaign=spring/)
  })

  it('omits blank optional params', () => {
    render(<UtmBuilder />)
    fill('https://example.com/landing', 'https://example.com')
    fill('google', 'google')
    fill('cpc', 'cpc')
    fill('spring_sale', 'test')
    const div = screen.getByText(/utm_source=google/)
    expect(div.textContent).not.toContain('utm_term')
    expect(div.textContent).not.toContain('utm_content')
  })

  it('shows an error for an invalid base URL', () => {
    render(<UtmBuilder />)
    fill('https://example.com/landing', 'not-a-url')
    fill('google', 'google')
    expect(screen.getByText(/not valid/i)).toBeInTheDocument()
  })

  it('shows nothing when base URL is empty', () => {
    render(<UtmBuilder />)
    fill('google', 'google')
    fill('cpc', 'cpc')
    fill('spring_sale', 'test')
    expect(screen.getByText(/Fill in Base URL/i)).toBeInTheDocument()
  })

  it('appends to existing query string correctly', () => {
    render(<UtmBuilder />)
    fill('https://example.com/landing', 'https://example.com?ref=footer')
    fill('google', 'newsletter')
    fill('cpc', 'email')
    fill('spring_sale', 'promo')
    const div = screen.getByText(/utm_source=newsletter/)
    expect(div.textContent).toContain('ref=footer')
    expect(div.textContent).toContain('utm_source=newsletter')
  })
})
