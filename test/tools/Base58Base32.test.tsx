import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Base58Base32 from '@/components/tools/Base58Base32'

function getOutput(): string {
  return (screen.getByPlaceholderText('Result…') as HTMLTextAreaElement).value
}

function setInput(value: string) {
  // The input textarea is the one without readOnly (placeholder varies by mode)
  const textareas = document.querySelectorAll('textarea')
  const editable = Array.from(textareas).find((ta) => !ta.readOnly)
  if (!editable) throw new Error('No editable textarea found')
  fireEvent.change(editable, { target: { value } })
}

describe('Base58Base32', () => {
  describe('Base32 (RFC 4648)', () => {
    it('encodes "foobar" to "MZXW6YTBOI======"', () => {
      render(<Base58Base32 />)
      setInput('foobar')
      expect(getOutput()).toBe('MZXW6YTBOI======')
    })

    it('encodes "Hello World" and decodes back to "Hello World"', () => {
      const { unmount } = render(<Base58Base32 />)
      setInput('Hello World')
      const encoded = getOutput()
      expect(encoded).toBeTruthy()
      unmount()

      render(<Base58Base32 />)
      // Switch to Decode mode
      fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
      setInput(encoded)
      expect(getOutput()).toBe('Hello World')
    })

    it('encodes empty to empty', () => {
      render(<Base58Base32 />)
      setInput('')
      expect(getOutput()).toBe('')
    })

    it('shows error on invalid Base32 characters in decode mode', () => {
      render(<Base58Base32 />)
      fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
      setInput('!!!invalid!!!')
      expect(screen.getByText(/Invalid input/i)).toBeInTheDocument()
    })

    it('Base32 output only contains valid alphabet chars and padding', () => {
      render(<Base58Base32 />)
      setInput('test string 123')
      const out = getOutput()
      expect(out).toMatch(/^[A-Z2-7=]+$/)
    })

    it('Base32 output length is a multiple of 8', () => {
      render(<Base58Base32 />)
      setInput('abc')
      const out = getOutput()
      expect(out.length % 8).toBe(0)
    })
  })

  describe('Base58 (Bitcoin)', () => {
    it('switches to Base58 and encodes "Hello World", then decodes back', () => {
      const { unmount } = render(<Base58Base32 />)
      // Switch to Base58
      fireEvent.click(screen.getAllByRole('tab', { name: 'Base58' })[0])
      setInput('Hello World')
      const encoded = getOutput()
      expect(encoded).toBeTruthy()
      // Bitcoin Base58 alphabet chars only
      expect(encoded).toMatch(/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/)
      unmount()

      render(<Base58Base32 />)
      fireEvent.click(screen.getAllByRole('tab', { name: 'Base58' })[0])
      fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
      setInput(encoded)
      expect(getOutput()).toBe('Hello World')
    })

    it('Base58 does not include 0, O, I, l in output', () => {
      render(<Base58Base32 />)
      fireEvent.click(screen.getAllByRole('tab', { name: 'Base58' })[0])
      setInput('the quick brown fox')
      const out = getOutput()
      expect(out).not.toMatch(/[0OIl]/)
    })

    it('shows error on invalid Base58 character in decode mode', () => {
      render(<Base58Base32 />)
      fireEvent.click(screen.getAllByRole('tab', { name: 'Base58' })[0])
      fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
      setInput('0OIl invalid!!!') // 0, O, I, l are not in Base58
      expect(screen.getByText(/Invalid input/i)).toBeInTheDocument()
    })

    it('round-trips unicode text with Base58', () => {
      const { unmount } = render(<Base58Base32 />)
      fireEvent.click(screen.getAllByRole('tab', { name: 'Base58' })[0])
      setInput('héllo ✶')
      const encoded = getOutput()
      unmount()

      render(<Base58Base32 />)
      fireEvent.click(screen.getAllByRole('tab', { name: 'Base58' })[0])
      fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
      setInput(encoded)
      expect(getOutput()).toBe('héllo ✶')
    })
  })
})
