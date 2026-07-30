import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MarkdownToPdf from '@/components/tools/MarkdownToPdf'

describe('MarkdownToPdf', () => {
  it('renders a live preview of the markdown', () => {
    render(<MarkdownToPdf />)
    // default sample has an H1 "Project Report"
    expect(screen.getByText('Project Report')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('# Write Markdown here…'), {
      target: { value: '# Custom Heading\n\nHello **world**.' },
    })
    expect(screen.getByText('Custom Heading')).toBeInTheDocument()
    expect(screen.getByText('world')).toBeInTheDocument()
  })

  it('offers PDF, HTML and .md exports', () => {
    render(<MarkdownToPdf />)
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'download HTML' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'download .md' })).toBeInTheDocument()
  })
})
