import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HomeClient, { readInitialFilters } from '@/components/HomeClient'

describe('readInitialFilters', () => {
  it('reads q and a known cat', () => {
    expect(readInitialFilters('?q=merge%20pdf&cat=PDF%20Tools')).toEqual({
      query: 'merge pdf',
      active: 'PDF Tools',
    })
  })
  it('decodes + as a space', () => {
    expect(readInitialFilters('?q=merge+pdf').query).toBe('merge pdf')
  })
  it('ignores an unknown cat', () => {
    expect(readInitialFilters('?cat=Nope').active).toBe('All')
  })
  it('defaults when empty', () => {
    expect(readInitialFilters('')).toEqual({ query: '', active: 'All' })
  })
})

describe('HomeClient', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('seeds the category from ?cat= on load', () => {
    window.history.replaceState(null, '', '/?cat=PDF%20Tools')
    render(<HomeClient />)
    expect(screen.getByText(/tools in PDF Tools/)).toBeInTheDocument()
  })

  it('seeds the search from ?q= on load', () => {
    window.history.replaceState(null, '', '/?q=merge')
    render(<HomeClient />)
    expect(screen.getByRole('textbox', { name: 'Search tools' })).toHaveValue('merge')
    expect(screen.getByText(/matching “merge”/)).toBeInTheDocument()
  })

  it('shows an empty state with a working "Clear search"', () => {
    window.history.replaceState(null, '', '/?q=zzzqqqxx')
    render(<HomeClient />)
    expect(screen.getByText(/No tools match/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.queryByText(/No tools match/)).toBeNull()
  })

  it('sidebar click filters the deck', () => {
    render(<HomeClient />)
    fireEvent.click(screen.getByRole('button', { name: /^Image Tools/ }))
    expect(screen.getByText(/tools in Image Tools/)).toBeInTheDocument()
  })

  it('renders the hedged hero copy', () => {
    render(<HomeClient />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Free online tools that run in your browser.',
    )
  })
})
