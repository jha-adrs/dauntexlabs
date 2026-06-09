import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImageConverter from '@/components/tools/ImageConverter'

// Canvas stubbed: toBlob returns a fake PNG (type matches requested mime), Image
// mocked (120x90). Flow-only assertions — not real encoding. Note the component
// guards on blob.type === requested format; the stub honors the requested mime,
// so converting to PNG/JPG/WebP all succeed.

function pngFile() {
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'pic.png', { type: 'image/png' })
}
function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

describe('ImageConverter (canvas-stubbed: flow-only)', () => {
  it('shows chip + format select after loading an image', async () => {
    const { container } = render(<ImageConverter />)
    fireEvent.change(getFileInput(container), { target: { files: [pngFile()] } })

    expect(await screen.findByText('pic.png')).toBeInTheDocument()
    expect(screen.getByText('Convert to')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Convert' })).toBeInTheDocument()
  })

  it('converts to a chosen format and shows output + download', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const { container } = render(<ImageConverter />)
    fireEvent.change(getFileInput(container), { target: { files: [pngFile()] } })
    await screen.findByText('pic.png')

    // Choose JPG as target.
    const select = container.querySelector('select.sel') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'image/jpeg' } })

    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))

    // Success notice: "Output: … · JPG"
    expect(await screen.findByText(/Output:/i, {}, { timeout: 10000 })).toBeInTheDocument()
    const download = await screen.findByRole('button', { name: /Download \.jpg/i })

    spy.mockClear()
    fireEvent.click(download)
    await waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 10000 })
  })

  it('rejects a non-image file with an error notice', () => {
    const { container } = render(<ImageConverter />)
    const txt = new File(['x'], 'a.txt', { type: 'text/plain' })
    fireEvent.change(getFileInput(container), { target: { files: [txt] } })
    expect(screen.getByText(/Please choose an image file/i)).toBeInTheDocument()
  })
})
