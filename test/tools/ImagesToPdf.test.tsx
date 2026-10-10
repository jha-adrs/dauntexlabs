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

// Minimal JPEG (2x3, 1 component) that pdf-lib can embed, carrying an EXIF block
// with Orientation (1 = upright, 6 = rotated) and a GPS-like marker string.
function jpegWithExif(orientation: number) {
  const seg = (m: number, body: number[]) => [0xff, m, (body.length + 2) >> 8, (body.length + 2) & 0xff, ...body]
  const a = (s: string) => [...s].map((c) => c.charCodeAt(0))
  const exif = [...a('Exif'), 0, 0, ...a('II'), 42, 0, 8, 0, 0, 0, 1, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, orientation, 0, 0, 0, 0, 0, 0, 0, ...a('GPS-SECRET')]
  return Uint8Array.from([
    0xff, 0xd8,
    ...seg(0xe1, exif),
    ...seg(0xdb, [0, ...new Array(64).fill(1)]),
    ...seg(0xc0, [8, 0, 2, 0, 3, 1, 1, 0x11, 0]),
    ...seg(0xda, [1, 1, 0, 0, 63, 0]),
    0x12, 0x34, 0xff, 0xd9,
  ])
}

async function pdfFrom(file: File) {
  const spy = vi.spyOn(URL, 'createObjectURL')
  const { container } = render(<ImagesToPdf />)
  fireEvent.change(getFileInput(container), { target: { files: [file] } })
  await screen.findByText(file.name, {}, { timeout: 10000 })
  spy.mockClear()
  fireEvent.click(screen.getByRole('button', { name: /Create PDF/i }))
  await waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 10000 })
  const blob = spy.mock.calls.at(-1)![0] as Blob
  spy.mockRestore()
  return new Uint8Array(await blob.arrayBuffer())
}

describe('ImagesToPdf', () => {
  it('strips EXIF (incl. GPS) from an upright JPEG before embedding', async () => {
    const bytes = await pdfFrom(new File([jpegWithExif(1)], 'gps.jpg', { type: 'image/jpeg' }))
    const text = Buffer.from(bytes).toString('latin1')
    expect(text.startsWith('%PDF')).toBe(true)
    expect(text).not.toContain('GPS-SECRET')
    expect(text).not.toContain('Exif')
  })

  it('re-encodes a rotated JPEG through canvas so it shows upright', async () => {
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob')
    const spy = vi.spyOn(URL, 'createObjectURL')
    const { container } = render(<ImagesToPdf />)
    fireEvent.change(getFileInput(container), {
      target: { files: [new File([jpegWithExif(6)], 'rot.jpg', { type: 'image/jpeg' })] },
    })
    await screen.findByText('rot.jpg', {}, { timeout: 10000 })
    fireEvent.click(screen.getByRole('button', { name: /Create PDF/i }))
    await waitFor(() => expect(toBlob).toHaveBeenCalled(), { timeout: 10000 })
    expect(toBlob.mock.calls[0][1]).toBe('image/jpeg')
    toBlob.mockRestore()
    spy.mockRestore()
  })

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
