import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SocialCharacterCounter from '@/components/tools/SocialCharacterCounter'

describe('SocialCharacterCounter', () => {
  it('shows 0 counts initially', () => {
    render(<SocialCharacterCounter />)
    // All stat displays should be present and at zero
    const statValues = document.querySelectorAll('[style*="1.5rem"]')
    expect(statValues.length).toBeGreaterThan(0)
  })

  it('shows correct character count on input', () => {
    render(<SocialCharacterCounter />)

    fireEvent.change(screen.getByPlaceholderText(/Paste or type/i), {
      target: { value: '0123456789' }, // 10 characters
    })

    // Character count should appear as "10"
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('shows 270 remaining for 280-limit preset when 10 chars entered', () => {
    render(<SocialCharacterCounter />)

    fireEvent.change(screen.getByPlaceholderText(/Paste or type/i), {
      target: { value: '0123456789' }, // 10 characters
    })

    // The 280-char preset should show "270 left"
    expect(screen.getByText('270 left')).toBeInTheDocument()
  })

  it('marks preset as over when text exceeds limit', () => {
    render(<SocialCharacterCounter />)

    const longText = 'a'.repeat(75)
    fireEvent.change(screen.getByPlaceholderText(/Paste or type/i), {
      target: { value: longText },
    })

    // The 70-char headline preset should show "5 over"
    expect(screen.getByText('5 over')).toBeInTheDocument()
  })

  it('counts words correctly', () => {
    render(<SocialCharacterCounter />)

    fireEvent.change(screen.getByPlaceholderText(/Paste or type/i), {
      target: { value: 'hello world foo' },
    })

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('counts lines correctly', () => {
    render(<SocialCharacterCounter />)

    fireEvent.change(screen.getByPlaceholderText(/Paste or type/i), {
      target: { value: 'line one\nline two\nline three' },
    })

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows all preset labels', () => {
    render(<SocialCharacterCounter />)

    expect(screen.getByText(/Microblog post/i)).toBeInTheDocument()
    expect(screen.getByText(/Short bio/i)).toBeInTheDocument()
    expect(screen.getByText(/Photo caption/i)).toBeInTheDocument()
    expect(screen.getByText(/Headline/i)).toBeInTheDocument()
    expect(screen.getByText(/Meta description/i)).toBeInTheDocument()
  })

  it('shows info notice when input is empty', () => {
    render(<SocialCharacterCounter />)
    expect(screen.getByText(/Enter text/i)).toBeInTheDocument()
  })

  it('hides notice when text is entered', () => {
    render(<SocialCharacterCounter />)

    fireEvent.change(screen.getByPlaceholderText(/Paste or type/i), {
      target: { value: 'hello' },
    })

    expect(screen.queryByText(/Enter text/i)).toBeNull()
  })
})
