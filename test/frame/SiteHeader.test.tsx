import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SiteHeader from '@/components/SiteHeader'

const search = () => screen.getByRole('textbox', { name: 'Search tools' })

describe('SiteHeader', () => {
  it('without props, a search goes to /#q= so the term never reaches a server', () => {
    const navigate = vi.fn()
    render(<SiteHeader navigate={navigate} />)
    fireEvent.change(search(), { target: { value: 'merge pdf' } })
    const notCancelled = fireEvent.submit(search().closest('form')!)
    expect(notCancelled).toBe(false)
    expect(navigate).toHaveBeenCalledWith('/#q=merge%20pdf')
  })

  it('an empty search goes to the homepage', () => {
    const navigate = vi.fn()
    render(<SiteHeader navigate={navigate} />)
    fireEvent.submit(search().closest('form')!)
    expect(navigate).toHaveBeenCalledWith('/')
  })

  it('the form cannot leak the term without JavaScript (no action, method or field name)', () => {
    render(<SiteHeader />)
    const form = search().closest('form')!
    expect(form).not.toHaveAttribute('action')
    expect(form).not.toHaveAttribute('method')
    expect(search()).not.toHaveAttribute('name')
  })

  it('homepage mode: typing drives setQuery', () => {
    const setQuery = vi.fn()
    render(<SiteHeader query="" setQuery={setQuery} />)
    fireEvent.change(search(), { target: { value: 'pdf' } })
    expect(setQuery).toHaveBeenCalledWith('pdf')
  })

  it('homepage mode does not submit the form', () => {
    render(<SiteHeader query="pdf" setQuery={() => {}} />)
    const notCancelled = fireEvent.submit(search().closest('form')!)
    expect(notCancelled).toBe(false)
  })

  it('homepage mode: the clear button empties the query', () => {
    const setQuery = vi.fn()
    render(<SiteHeader query="pdf" setQuery={setQuery} />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(setQuery).toHaveBeenCalledWith('')
  })

  it('"/" focuses search from the page body', () => {
    render(<SiteHeader />)
    fireEvent.keyDown(document.body, { key: '/' })
    expect(search()).toHaveFocus()
  })

  it('ignores "/" while typing in a textarea', () => {
    render(
      <>
        <SiteHeader />
        <textarea aria-label="notes" />
      </>,
    )
    const ta = screen.getByLabelText('notes')
    ta.focus()
    fireEvent.keyDown(ta, { key: '/' })
    expect(ta).toHaveFocus()
  })

  it('ignores "/" inside a contenteditable editor', () => {
    render(
      <>
        <SiteHeader />
        <div contentEditable="true" suppressContentEditableWarning data-testid="ed">
          <p>text</p>
        </div>
      </>,
    )
    const notCancelled = fireEvent.keyDown(screen.getByText('text'), { key: '/' })
    expect(notCancelled).toBe(true)
    expect(search()).not.toHaveFocus()
  })

  it('links to all tools, conversions and privacy', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('link', { name: 'All tools' })).toHaveAttribute('href', '/')
    // next/link only appends the trailing slash when built with trailingSlash: true
    expect(screen.getByRole('link', { name: 'Conversions' }).getAttribute('href')).toMatch(/^\/convert\/?$/)
    expect(screen.getByRole('link', { name: 'Privacy' }).getAttribute('href')).toMatch(/^\/privacy\/?$/)
  })
})
