import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QrCodeGenerator from '@/components/tools/QrCodeGenerator'

/* qrcode-generator is a real installed dep; canvas is stubbed in setup so the
 * PNG download path runs (toBlob -> fake blob, createObjectURL -> blob:mock). */

afterEach(() => {
  vi.restoreAllMocks()
})

describe('QrCodeGenerator', () => {
  it('shows a hint and no preview when input is empty', () => {
    render(<QrCodeGenerator />)
    expect(screen.getByText(/Type or paste any text \/ URL above/i)).toBeInTheDocument()
    expect(screen.queryByAltText('Generated QR code')).toBeNull()
  })

  it('renders a data-URL QR preview after typing text', async () => {
    render(<QrCodeGenerator />)
    fireEvent.change(screen.getByPlaceholderText('Enter text or a URL to encode…'), {
      target: { value: 'https://dauntexlabs.com' },
    })

    const img = (await screen.findByAltText('Generated QR code', {}, { timeout: 10000 })) as HTMLImageElement
    expect(img.getAttribute('src')).toMatch(/^data:/)
  })

  it('regenerates when error-correction level changes', async () => {
    render(<QrCodeGenerator />)
    fireEvent.change(screen.getByPlaceholderText('Enter text or a URL to encode…'), {
      target: { value: 'hello world' },
    })
    const img = (await screen.findByAltText('Generated QR code', {}, { timeout: 10000 })) as HTMLImageElement
    const first = img.getAttribute('src')
    expect(first).toMatch(/^data:/)

    // change error correction to H
    fireEvent.change(screen.getByRole('combobox') as HTMLSelectElement, { target: { value: 'H' } })
    await waitFor(() => {
      const updated = (screen.getByAltText('Generated QR code') as HTMLImageElement).getAttribute('src')
      expect(updated).toMatch(/^data:/)
      expect(updated).not.toBe(first)
    }, { timeout: 10000 })
  })

  it('regenerates when the module size slider changes', async () => {
    render(<QrCodeGenerator />)
    fireEvent.change(screen.getByPlaceholderText('Enter text or a URL to encode…'), {
      target: { value: 'size test' },
    })
    await screen.findByAltText('Generated QR code', {}, { timeout: 10000 })

    const slider = screen.getByRole('slider') as HTMLInputElement
    fireEvent.change(slider, { target: { value: '12' } })
    await waitFor(() => {
      const src = (screen.getByAltText('Generated QR code') as HTMLImageElement).getAttribute('src')
      expect(src).toMatch(/^data:/)
    }, { timeout: 10000 })
  })

  it('Download PNG triggers a client-side download', async () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL')
    render(<QrCodeGenerator />)
    fireEvent.change(screen.getByPlaceholderText('Enter text or a URL to encode…'), {
      target: { value: 'download me' },
    })
    await screen.findByAltText('Generated QR code', {}, { timeout: 10000 })

    fireEvent.click(screen.getByRole('button', { name: 'Download PNG' }))
    await waitFor(() => expect(createSpy).toHaveBeenCalled(), { timeout: 10000 })
  })
})
