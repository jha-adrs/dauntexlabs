import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SerpPreview from '@/components/tools/SerpPreview'

describe('SerpPreview', () => {
  it('shows a title char count of 0 with no input and no warning', () => {
    render(<SerpPreview />)
    expect(screen.getByText('title: 0 / 60')).toBeInTheDocument()
    expect(screen.queryByText(/over the 60-character limit/i)).not.toBeInTheDocument()
  })

  it('shows the title char count for a short title without warning', () => {
    render(<SerpPreview />)
    const short = 'A neat short title' // < 60 chars
    fireEvent.change(screen.getByPlaceholderText('My Page — Brand'), {
      target: { value: short },
    })
    expect(screen.getByText(`title: ${short.length} / 60`)).toBeInTheDocument()
    expect(screen.queryByText(/over the 60-character limit/i)).not.toBeInTheDocument()
  })

  it('warns when the title is over 60 characters', () => {
    render(<SerpPreview />)
    const long = 'x'.repeat(70)
    fireEvent.change(screen.getByPlaceholderText('My Page — Brand'), {
      target: { value: long },
    })
    expect(screen.getByText('title: 70 / 60')).toBeInTheDocument()
    expect(screen.getByText(/over the 60-character limit/i)).toBeInTheDocument()
  })

  it('updates the description char count live', () => {
    render(<SerpPreview />)
    const input = screen.getByPlaceholderText(/short, descriptive summary/i)
    fireEvent.change(input, { target: { value: 'Hello' } })
    expect(screen.getByText('description: 5 / 160')).toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'Hello world' } })
    expect(screen.getByText('description: 11 / 160')).toBeInTheDocument()
  })

  it('warns when the description is over 160 characters', () => {
    render(<SerpPreview />)
    const long = 'y'.repeat(170)
    fireEvent.change(screen.getByPlaceholderText(/short, descriptive summary/i), {
      target: { value: long },
    })
    expect(screen.getByText('description: 170 / 160')).toBeInTheDocument()
    expect(screen.getByText(/over the 160-character limit/i)).toBeInTheDocument()
  })

  it('truncates the previewed title past the limit with an ellipsis', () => {
    render(<SerpPreview />)
    const long = 'z'.repeat(80)
    fireEvent.change(screen.getByPlaceholderText('My Page — Brand'), {
      target: { value: long },
    })
    const preview = screen.getByText(/z+…$/)
    expect(preview.textContent).toMatch(/…$/)
    // 60 z's + ellipsis
    expect(preview.textContent).toBe('z'.repeat(60) + '…')
  })

  it('renders the title in the preview when within the limit', () => {
    render(<SerpPreview />)
    fireEvent.change(screen.getByPlaceholderText('My Page — Brand'), {
      target: { value: 'Exact Title' },
    })
    expect(screen.getByText('Exact Title')).toBeInTheDocument()
  })

  it('formats the URL as a breadcrumb in the preview', () => {
    render(<SerpPreview />)
    fireEvent.change(screen.getByPlaceholderText('https://example.com/page'), {
      target: { value: 'https://example.com/blog/post' },
    })
    expect(screen.getByText('example.com › blog › post')).toBeInTheDocument()
  })
})
