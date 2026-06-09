import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Encryption from '@/components/tools/Encryption'

/* The algorithm <select> is the only one rendered initially; the message lives
 * in the textarea whose placeholder is "Text to process…" (encrypt) or
 * "Paste base64 ciphertext…" (decrypt). Output lands in the read-only textarea
 * with placeholder "Result appears here…". */

function selectAlgo(value: string) {
  const select = screen.getByRole('combobox') as HTMLSelectElement
  fireEvent.change(select, { target: { value } })
  return select
}

function messageBox(): HTMLTextAreaElement {
  // matches both encrypt + decrypt placeholders
  return screen.getByPlaceholderText(/Text to process…|Paste base64 ciphertext…/) as HTMLTextAreaElement
}

function outputBox(): HTMLTextAreaElement {
  return screen.getByPlaceholderText('Result appears here…') as HTMLTextAreaElement
}

describe('Encryption', () => {
  it('ROT13: encrypts "Hello" to "Uryyb"', async () => {
    render(<Encryption />)
    selectAlgo('rot13')
    fireEvent.change(messageBox(), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    await waitFor(() => expect(outputBox().value).toBe('Uryyb'), { timeout: 10000 })
  })

  it('Caesar: encrypt then decrypt round-trips with a shift', async () => {
    render(<Encryption />)
    selectAlgo('caesar')

    // shift field appears for caesar
    const shift = screen.getByRole('spinbutton') as HTMLInputElement
    fireEvent.change(shift, { target: { value: '5' } })

    fireEvent.change(messageBox(), { target: { value: 'Attack' } })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    let encrypted = ''
    await waitFor(() => {
      encrypted = outputBox().value
      expect(encrypted).toBeTruthy()
      expect(encrypted).not.toBe('Attack')
    }, { timeout: 10000 })

    // switch to Decrypt, feed the ciphertext back, expect the original
    fireEvent.click(screen.getByRole('tab', { name: 'Decrypt' }))
    fireEvent.change(messageBox(), { target: { value: encrypted } })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    await waitFor(() => expect(outputBox().value).toBe('Attack'), { timeout: 10000 })
  })

  it('SHA-256: "abc" produces the known digest', async () => {
    render(<Encryption />)
    selectAlgo('sha256')
    fireEvent.change(messageBox(), { target: { value: 'abc' } })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    await waitFor(
      () =>
        expect(outputBox().value).toBe(
          'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
        ),
      { timeout: 10000 },
    )
  })

  it('AES-256-GCM: encrypt then decrypt round-trips with a passphrase', async () => {
    render(<Encryption />)
    selectAlgo('aes')

    const passphrase = screen.getByPlaceholderText('passphrase') as HTMLInputElement
    fireEvent.change(passphrase, { target: { value: 'correct horse battery staple' } })
    fireEvent.change(messageBox(), { target: { value: 'top secret message' } })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    let ciphertext = ''
    await waitFor(() => {
      ciphertext = outputBox().value
      expect(ciphertext).toBeTruthy()
      expect(ciphertext).not.toBe('top secret message')
    }, { timeout: 10000 })

    // switch to Decrypt — same passphrase, paste the ciphertext
    fireEvent.click(screen.getByRole('tab', { name: 'Decrypt' }))
    fireEvent.change(
      screen.getByPlaceholderText('passphrase') as HTMLInputElement,
      { target: { value: 'correct horse battery staple' } },
    )
    fireEvent.change(messageBox(), { target: { value: ciphertext } })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))

    await waitFor(
      () => expect(outputBox().value).toBe('top secret message'),
      { timeout: 10000 },
    )
  })
})
