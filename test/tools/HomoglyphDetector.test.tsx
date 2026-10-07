import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HomoglyphDetector from '@/components/tools/HomoglyphDetector'

function type(v: string) {
  fireEvent.change(screen.getByPlaceholderText('Paste a domain, username or text…'), { target: { value: v } })
}

describe('HomoglyphDetector', () => {
  it('lists a Cyrillic lookalike and shows the ASCII skeleton', async () => {
    const { container } = render(<HomoglyphDetector />)
    type('pаypal')
    expect(await screen.findByText('U+0430')).toBeInTheDocument()
    expect(screen.getByText('Cyrillic')).toBeInTheDocument()
    expect(screen.getByText(/1 suspicious character/)).toBeInTheDocument()
    expect(container.querySelectorAll('mark')).toHaveLength(1)
    expect(screen.getByPlaceholderText('Skeleton…')).toHaveValue('paypal')
  })

  it('detects zero-width characters and can remove them', async () => {
    render(<HomoglyphDetector />)
    type('a​b')
    expect(await screen.findByText('U+200B')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Remove invisible characters'))
    expect(screen.getByPlaceholderText('Text without invisible characters…')).toHaveValue('ab')
  })

  it('reports clean ASCII', async () => {
    render(<HomoglyphDetector />)
    type('paypal.com')
    expect(await screen.findByText(/No lookalike or invisible characters/)).toBeInTheDocument()
  })
})
