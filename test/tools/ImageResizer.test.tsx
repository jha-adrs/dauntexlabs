import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImageResizer from '@/components/tools/ImageResizer'

// Canvas stubbed; Image mocked → naturalWidth 120, naturalHeight 90. Flow-only.

function jpgFile() {
  return new File([new Uint8Array([0xff, 0xd8, 0xff])], 'photo.jpg', { type: 'image/jpeg' })
}
function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

describe('ImageResizer (canvas-stubbed: flow-only)', () => {
  it('prefills width/height from the loaded image (120 x 90)', async () => {
    const { container } = render(<ImageResizer />)
    fireEvent.change(getFileInput(container), { target: { files: [jpgFile()] } })

    expect(await screen.findByText('photo.jpg')).toBeInTheDocument()
    const inputs = container.querySelectorAll('input.inp[type="number"]')
    expect(inputs).toHaveLength(2)
    expect((inputs[0] as HTMLInputElement).value).toBe('120')
    expect((inputs[1] as HTMLInputElement).value).toBe('90')
  })

  it('locks aspect ratio: changing width updates height', async () => {
    const { container } = render(<ImageResizer />)
    fireEvent.change(getFileInput(container), { target: { files: [jpgFile()] } })
    await screen.findByText('photo.jpg')

    const inputs = container.querySelectorAll('input.inp[type="number"]')
    const widthInput = inputs[0] as HTMLInputElement
    const heightInput = inputs[1] as HTMLInputElement
    // width 60 → height = round(60 * 90/120) = 45
    fireEvent.change(widthInput, { target: { value: '60' } })
    expect(heightInput.value).toBe('45')
  })

  it('resizes and shows an output notice + working Download', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const { container } = render(<ImageResizer />)
    fireEvent.change(getFileInput(container), { target: { files: [jpgFile()] } })
    await screen.findByText('photo.jpg')

    // Quick-scale to 50% → 60x45.
    fireEvent.click(screen.getByRole('button', { name: '50%' }))
    fireEvent.click(screen.getByRole('button', { name: 'Resize' }))

    // Success notice shows the new dimensions.
    expect(await screen.findByText(/60×45/, {}, { timeout: 10000 })).toBeInTheDocument()
    const download = await screen.findByRole('button', { name: 'Download' })

    spy.mockClear()
    fireEvent.click(download)
    await waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 10000 })
  })

  it('rejects a non-image file with an error notice', () => {
    const { container } = render(<ImageResizer />)
    const txt = new File(['x'], 'a.txt', { type: 'text/plain' })
    fireEvent.change(getFileInput(container), { target: { files: [txt] } })
    expect(screen.getByText(/Please choose an image file/i)).toBeInTheDocument()
  })
})
