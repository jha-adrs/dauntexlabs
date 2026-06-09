import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Base64 from '@/components/tools/Base64'

describe('Base64', () => {
  it('encodes ASCII text', () => {
    render(<Base64 />)
    fireEvent.change(screen.getByPlaceholderText('Text to encode…'), { target: { value: 'Hello' } })
    expect(screen.getByPlaceholderText('Result…')).toHaveValue('SGVsbG8=')
  })

  it('encodes UTF-8 (multibyte) correctly', () => {
    render(<Base64 />)
    fireEvent.change(screen.getByPlaceholderText('Text to encode…'), { target: { value: 'héllo ✶' } })
    // UTF-8 bytes of "héllo ✶" base64-encoded
    expect(screen.getByPlaceholderText('Result…')).toHaveValue('aMOpbGxvIOKctg==')
  })

  it('decodes back to the original text', () => {
    render(<Base64 />)
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    fireEvent.change(screen.getByPlaceholderText('Base64 to decode…'), {
      target: { value: 'aMOpbGxvIOKctg==' },
    })
    expect(screen.getByPlaceholderText('Result…')).toHaveValue('héllo ✶')
  })

  it('produces URL-safe output without padding', () => {
    render(<Base64 />)
    fireEvent.click(screen.getByLabelText('URL-safe'))
    fireEvent.change(screen.getByPlaceholderText('Text to encode…'), {
      target: { value: '<<???>>' },
    })
    const out = (screen.getByPlaceholderText('Result…') as HTMLTextAreaElement).value
    expect(out).not.toMatch(/[+/=]/)
  })

  it('shows an error for invalid base64 in decode mode', () => {
    render(<Base64 />)
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    fireEvent.change(screen.getByPlaceholderText('Base64 to decode…'), {
      target: { value: '@@@ not base64 @@@' },
    })
    expect(screen.getByText(/Invalid input/i)).toBeInTheDocument()
  })

  it('is empty for empty input', () => {
    render(<Base64 />)
    expect(screen.getByPlaceholderText('Result…')).toHaveValue('')
  })
})
