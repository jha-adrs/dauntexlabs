import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FaviconGenerator from '@/components/tools/FaviconGenerator'

// Canvas stubbed (toDataURL → stub data URI, toBlob → fake PNG). Image mocked.
// Flow-only: previews render and .ico download triggers — not real icon bytes.

function jpgFile() {
  return new File([new Uint8Array([0xff, 0xd8, 0xff])], 'logo.jpg', { type: 'image/jpeg' })
}
function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

describe('FaviconGenerator (canvas-stubbed: flow-only)', () => {
  it('renders multiple size previews after loading an image', async () => {
    const { container } = render(<FaviconGenerator />)
    fireEvent.change(getFileInput(container), { target: { files: [jpgFile()] } })

    expect(await screen.findByText('logo.jpg', {}, { timeout: 10000 })).toBeInTheDocument()

    // SIZES = [16,32,48,180,192,512] → one labeled preview each.
    for (const s of [16, 32, 48, 180, 192, 512]) {
      expect(await screen.findByText(`${s}×${s}`)).toBeInTheDocument()
    }
    // Each preview tile has a "PNG" download button.
    const pngButtons = await screen.findAllByRole('button', { name: 'PNG' })
    expect(pngButtons.length).toBe(6)
  })

  it('downloads a .ico when the build button is clicked (createObjectURL spy)', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const { container } = render(<FaviconGenerator />)
    fireEvent.change(getFileInput(container), { target: { files: [jpgFile()] } })

    const icoBtn = await screen.findByRole(
      'button',
      { name: /Download favicon\.ico/i },
      { timeout: 10000 },
    )
    spy.mockClear()
    fireEvent.click(icoBtn)
    // downloadIco builds the .ico then calls downloadBlob → createObjectURL.
    await waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 10000 })
  })

  it('rejects a non-image file with an error notice', () => {
    const { container } = render(<FaviconGenerator />)
    const txt = new File(['x'], 'a.txt', { type: 'text/plain' })
    fireEvent.change(getFileInput(container), { target: { files: [txt] } })
    expect(screen.getByText(/Please choose an image file/i)).toBeInTheDocument()
  })
})
