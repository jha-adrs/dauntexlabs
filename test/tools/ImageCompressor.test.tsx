import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImageCompressor from '@/components/tools/ImageCompressor'

// Canvas is stubbed (toBlob → tiny fake PNG, Image mocked → 120x90). These tests
// assert the FLOW only (file loads, controls appear, compress succeeds, download
// works) — NOT pixel/byte-level image correctness.

function jpgFile() {
  return new File([new Uint8Array([0xff, 0xd8, 0xff])], 'photo.jpg', { type: 'image/jpeg' })
}

function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

describe('ImageCompressor (canvas-stubbed: flow-only)', () => {
  it('shows the file chip + format/quality controls after loading an image', async () => {
    const { container } = render(<ImageCompressor />)
    fireEvent.change(getFileInput(container), { target: { files: [jpgFile()] } })

    // Image mock fires onload async with naturalWidth 120, naturalHeight 90.
    expect(await screen.findByText('photo.jpg')).toBeInTheDocument()
    expect(screen.getByText(/120×90/)).toBeInTheDocument()
    expect(screen.getByText('Output format')).toBeInTheDocument()
    expect(screen.getByText(/Quality —/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compress' })).toBeInTheDocument()
  })

  it('compresses and shows a success "smaller" notice + working Download', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const { container } = render(<ImageCompressor />)
    fireEvent.change(getFileInput(container), { target: { files: [jpgFile()] } })

    fireEvent.click(await screen.findByRole('button', { name: 'Compress' }))

    // Success Notice ("… smaller") appears once compression finishes.
    const notice = await screen.findByText(/smaller/i, {}, { timeout: 10000 })
    expect(notice).toBeInTheDocument()

    const download = await screen.findByRole('button', { name: 'Download' })
    spy.mockClear()
    fireEvent.click(download)
    await waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 10000 })
  })

  it('rejects a non-image file with an error notice', () => {
    const { container } = render(<ImageCompressor />)
    const txt = new File(['hello'], 'note.txt', { type: 'text/plain' })
    fireEvent.change(getFileInput(container), { target: { files: [txt] } })
    expect(screen.getByText(/Please choose an image file/i)).toBeInTheDocument()
  })

  it('hides the quality slider when PNG (lossless) is selected', async () => {
    const { container } = render(<ImageCompressor />)
    fireEvent.change(getFileInput(container), { target: { files: [jpgFile()] } })
    await screen.findByText('photo.jpg')

    expect(screen.getByText(/Quality —/)).toBeInTheDocument()
    const select = container.querySelector('select.sel') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'image/png' } })
    expect(screen.queryByText(/Quality —/)).not.toBeInTheDocument()
  })
})
