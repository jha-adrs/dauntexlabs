import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PDFDocument } from 'pdf-lib'
import ImagesToPdf from '@/components/tools/ImagesToPdf'

// pdf-lib runs for real. We use a REAL 1x1 transparent PNG so embedPng succeeds
// (fake bytes would reject and only yield the error path). UI flow + direct test.

// 1x1 transparent PNG.
const PNG_1x1 = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
  (c) => c.charCodeAt(0),
)

function pngFile(name: string) {
  return new File([PNG_1x1], name, { type: 'image/png' })
}
function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

describe('ImagesToPdf', () => {
  it('lists added images and creates a PDF → download triggered (real PNG embeds)', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const { container } = render(<ImagesToPdf />)

    fireEvent.change(getFileInput(container), {
      target: { files: [pngFile('one.png'), pngFile('two.png')] },
    })

    // Chips appear after the async arrayBuffer load.
    expect(await screen.findByText('one.png', {}, { timeout: 10000 })).toBeInTheDocument()
    expect(screen.getByText('two.png')).toBeInTheDocument()

    const createBtn = screen.getByRole('button', { name: /Create PDF \(2 images\)/i })
    spy.mockClear()
    fireEvent.click(createBtn)

    await waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 10000 })
    expect(screen.queryByText(/Could not build the PDF/i)).not.toBeInTheDocument()
  })

  it('rejects non-image files with an error notice', () => {
    const { container } = render(<ImagesToPdf />)
    const txt = new File(['x'], 'note.txt', { type: 'text/plain' })
    fireEvent.change(getFileInput(container), { target: { files: [txt] } })
    expect(screen.getByText(/Please choose image files/i)).toBeInTheDocument()
  })

  it('direct pdf-lib: embedding two real PNGs yields a 2-page PDF', async () => {
    const doc = await PDFDocument.create()
    for (const _ of [0, 1]) {
      const img = await doc.embedPng(PNG_1x1)
      const page = doc.addPage([img.width, img.height])
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
    }
    const bytes = await doc.save()
    const reloaded = await PDFDocument.load(bytes)
    expect(reloaded.getPageCount()).toBe(2)
  })
})
