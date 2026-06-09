import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HashGenerator from '@/components/tools/HashGenerator'

describe('HashGenerator', () => {
  it('computes MD5 and the SHA family for a known vector', async () => {
    render(<HashGenerator />)
    fireEvent.change(screen.getByPlaceholderText('Text to hash…'), { target: { value: 'abc' } })

    // MD5 is pure JS; SHA-256 uses Web Crypto (polyfilled in setup).
    expect(await screen.findByText('900150983cd24fb0d6963f7d28e17f72')).toBeInTheDocument()
    expect(
      await screen.findByText(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      ),
    ).toBeInTheDocument()
  })

  it('uppercases digests when toggled', async () => {
    render(<HashGenerator />)
    fireEvent.change(screen.getByPlaceholderText('Text to hash…'), { target: { value: 'abc' } })
    await screen.findByText('900150983cd24fb0d6963f7d28e17f72')
    fireEvent.click(screen.getByLabelText('Uppercase'))
    expect(await screen.findByText('900150983CD24FB0D6963F7D28E17F72')).toBeInTheDocument()
  })

  it('shows nothing for empty input', () => {
    render(<HashGenerator />)
    expect(screen.getByText(/Enter text above/i)).toBeInTheDocument()
  })
})
