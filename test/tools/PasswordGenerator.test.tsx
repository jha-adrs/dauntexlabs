import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PasswordGenerator from '@/components/tools/PasswordGenerator'

/* Uses crypto.getRandomValues (available everywhere, incl. Node webcrypto).
 * The generated value is rendered as text inside the output card. We read it
 * from the CopyButton's disabled state + the displayed text. */

/** The generated value is the text content of the output box; it's the mono
 * value div. We locate it as the only element whose text looks like the output.
 * Simplest robust approach: the slider label encodes the length, and the value
 * is shown verbatim — read it from the document. */
function readOutput(): string {
  // The output sits in a div with letterSpacing; grab via the copy button's
  // sibling is fragile, so instead read the last mono value block.
  // The value div contains either the password text or an em-dash placeholder.
  // We find it by selecting the container that holds the CopyButton.
  const copyBtn = screen.getByRole('button', { name: /copy|✓ copied/i })
  // The output card is copyBtn's closest positioned container's first child.
  const card = copyBtn.closest('div[style]')?.parentElement
  // Fallback: walk up to the card and read its first text block.
  const container = card ?? document.body
  // The value text node is the element with wordBreak break-all.
  const valueDiv = Array.from(container.querySelectorAll('div')).find((d) =>
    /break-all/.test(d.getAttribute('style') || ''),
  )
  return (valueDiv?.textContent || '').trim()
}

function setSlider(value: number) {
  const slider = screen.getByRole('slider') as HTMLInputElement
  fireEvent.change(slider, { target: { value: String(value) } })
}

describe('PasswordGenerator', () => {
  it('Password mode: generated length matches the slider', async () => {
    render(<PasswordGenerator />)
    setSlider(32)
    await waitFor(() => {
      const out = readOutput()
      expect(out.length).toBe(32)
    }, { timeout: 10000 })
  })

  it('Password mode: digits-only charset yields only [0-9]', async () => {
    render(<PasswordGenerator />)
    setSlider(24)

    // Turn off lowercase, uppercase, symbols; leave digits on.
    fireEvent.click(screen.getByLabelText('lowercase'))
    fireEvent.click(screen.getByLabelText('UPPERCASE'))
    fireEvent.click(screen.getByLabelText('Symbols !@#…'))

    await waitFor(() => {
      const out = readOutput()
      expect(out.length).toBe(24)
      expect(out).toMatch(/^[0-9]+$/)
    }, { timeout: 10000 })
  })

  it('Password mode: disabling every charset shows the error notice', async () => {
    render(<PasswordGenerator />)
    fireEvent.click(screen.getByLabelText('lowercase'))
    fireEvent.click(screen.getByLabelText('UPPERCASE'))
    fireEvent.click(screen.getByLabelText('Digits 0–9'))
    fireEvent.click(screen.getByLabelText('Symbols !@#…'))
    expect(
      await screen.findByText('Enable at least one character set.', {}, { timeout: 10000 }),
    ).toBeInTheDocument()
  })

  it('Passphrase mode: produces the chosen number of words joined by the separator', async () => {
    render(<PasswordGenerator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Passphrase' }))

    // Default separator is '-'. Set words to 5.
    setSlider(5)

    await waitFor(() => {
      const out = readOutput()
      expect(out).toBeTruthy()
      const parts = out.split('-')
      expect(parts.length).toBe(5)
      // every part is a non-empty word (letters only since includeNumber is off)
      parts.forEach((p) => expect(p).toMatch(/^[A-Za-z]+$/))
    }, { timeout: 10000 })
  })

  it('Passphrase mode: switching separator to underscore rejoins the words', async () => {
    render(<PasswordGenerator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Passphrase' }))
    setSlider(4)

    // The separator <select> is the combobox.
    fireEvent.change(screen.getByRole('combobox') as HTMLSelectElement, { target: { value: '_' } })

    await waitFor(() => {
      const out = readOutput()
      const parts = out.split('_')
      expect(parts.length).toBe(4)
    }, { timeout: 10000 })
  })
})
