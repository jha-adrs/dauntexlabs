import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MorseCode from '@/components/tools/MorseCode'

describe('MorseCode', () => {
  function getOutput() {
    return (screen.getByPlaceholderText('Result…') as HTMLTextAreaElement).value
  }

  it('shows empty output for empty input in encode mode', () => {
    render(<MorseCode />)
    expect(getOutput()).toBe('')
  })

  it('encodes SOS correctly', () => {
    render(<MorseCode />)
    fireEvent.change(screen.getByPlaceholderText('Type text to encode, e.g. SOS…'), {
      target: { value: 'SOS' },
    })
    expect(getOutput()).toBe('... --- ...')
  })

  it('encodes lowercase the same as uppercase', () => {
    render(<MorseCode />)
    fireEvent.change(screen.getByPlaceholderText('Type text to encode, e.g. SOS…'), {
      target: { value: 'sos' },
    })
    expect(getOutput()).toBe('... --- ...')
  })

  it('encodes multi-word text with "/" as word separator', () => {
    render(<MorseCode />)
    fireEvent.change(screen.getByPlaceholderText('Type text to encode, e.g. SOS…'), {
      target: { value: 'HI HO' },
    })
    expect(getOutput()).toBe('.... .. / .... ---')
  })

  it('encodes digits', () => {
    render(<MorseCode />)
    fireEvent.change(screen.getByPlaceholderText('Type text to encode, e.g. SOS…'), {
      target: { value: '73' },
    })
    expect(getOutput()).toBe('--... ...--')
  })

  it('shows error for unsupported characters in encode mode', () => {
    render(<MorseCode />)
    fireEvent.change(screen.getByPlaceholderText('Type text to encode, e.g. SOS…'), {
      target: { value: 'Hello!' },
    })
    expect(screen.getByText(/not in International Morse/i)).toBeInTheDocument()
  })

  it('decodes "... --- ..." back to "SOS"', () => {
    render(<MorseCode />)
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    fireEvent.change(screen.getByPlaceholderText('Enter morse code, e.g. ... --- ...'), {
      target: { value: '... --- ...' },
    })
    expect(getOutput()).toBe('SOS')
  })

  it('decodes multi-word morse with "/" separator', () => {
    render(<MorseCode />)
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    fireEvent.change(screen.getByPlaceholderText('Enter morse code, e.g. ... --- ...'), {
      target: { value: '.... .. / .... ---' },
    })
    expect(getOutput()).toBe('HI HO')
  })

  it('shows error for unrecognized morse sequence in decode mode', () => {
    render(<MorseCode />)
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    fireEvent.change(screen.getByPlaceholderText('Enter morse code, e.g. ... --- ...'), {
      target: { value: '...........' },
    })
    expect(screen.getByText(/Unrecognized morse/i)).toBeInTheDocument()
  })

  it('clears input when switching modes', () => {
    render(<MorseCode />)
    fireEvent.change(screen.getByPlaceholderText('Type text to encode, e.g. SOS…'), {
      target: { value: 'SOS' },
    })
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    expect(
      (screen.getByPlaceholderText('Enter morse code, e.g. ... --- ...') as HTMLTextAreaElement).value
    ).toBe('')
  })

  it('encodes a full word: HELLO', () => {
    render(<MorseCode />)
    fireEvent.change(screen.getByPlaceholderText('Type text to encode, e.g. SOS…'), {
      target: { value: 'HELLO' },
    })
    // H=.... E=. L=.-.. L=.-.. O=---
    expect(getOutput()).toBe('.... . .-.. .-.. ---')
  })

  it('round-trips: encode then decode produces original text', () => {
    // We test this by asserting the known encode → known decode symmetry
    // encode("PARIS") and decode that result should give "PARIS"
    const { unmount } = render(<MorseCode />)
    fireEvent.change(screen.getByPlaceholderText('Type text to encode, e.g. SOS…'), {
      target: { value: 'PARIS' },
    })
    const encoded = getOutput()
    unmount()

    render(<MorseCode />)
    fireEvent.click(screen.getByRole('tab', { name: 'Decode' }))
    fireEvent.change(screen.getByPlaceholderText('Enter morse code, e.g. ... --- ...'), {
      target: { value: encoded },
    })
    expect(getOutput()).toBe('PARIS')
  })
})
