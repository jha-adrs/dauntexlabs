import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CategoryNav from '@/components/CategoryNav'
import { tools, toolsByCategory } from '@/lib/tools'

describe('CategoryNav', () => {
  it('link mode: categories link to /?cat= and the active one is current', () => {
    render(<CategoryNav active="PDF Tools" />)
    const pdf = screen.getByRole('link', { name: /^PDF Tools/ })
    expect(pdf).toHaveAttribute('href', '/?cat=PDF%20Tools')
    expect(pdf).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /^All tools/ })).toHaveAttribute('href', '/')
  })

  it('link mode: encodes "&" in category names', () => {
    render(<CategoryNav active="All" />)
    expect(screen.getByRole('link', { name: /^Web & CSS/ })).toHaveAttribute(
      'href',
      '/?cat=Web%20%26%20CSS',
    )
  })

  it('link mode: categories with a hub link to /category/<slug>/', () => {
    render(<CategoryNav active="All" />)
    expect(screen.getByRole('link', { name: /^India/ })).toHaveAttribute('href', expect.stringMatching(/^\/category\/india\/?$/))
    expect(screen.getByRole('link', { name: /^Aviation/ })).toHaveAttribute('href', expect.stringMatching(/^\/category\/aviation\/?$/))
  })

  it('button mode: clicking a category calls onSelect', () => {
    const onSelect = vi.fn()
    render(<CategoryNav active="All" onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: /^Image Tools/ }))
    expect(onSelect).toHaveBeenCalledWith('Image Tools')
    expect(screen.getByRole('button', { name: /^All tools/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows tool counts', () => {
    render(<CategoryNav active="All" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /^All tools/ })).toHaveTextContent(String(tools.length))
    expect(screen.getByRole('button', { name: /^PDF Tools/ })).toHaveTextContent(
      String(toolsByCategory('PDF Tools').length),
    )
  })
})
