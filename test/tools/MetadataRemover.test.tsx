import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import MetadataRemover from '@/components/tools/MetadataRemover'

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))

/** JPEG whose EXIF has Make "CANARY", orientation 6 and a GPS pointer (big-endian TIFF). */
function jpegWithExif() {
  const tiff = [
    ...ascii('MM'), 0, 42, 0, 0, 0, 8,
    0, 3,
    0x01, 0x0f, 0, 2, 0, 0, 0, 7, 0, 0, 0, 8 + 2 + 3 * 12 + 4, // Make -> string after the IFD
    0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, 6, 0, 0,
    0x88, 0x25, 0, 4, 0, 0, 0, 1, 0, 0, 0, 0,
    0, 0, 0, 0,
    ...ascii('CANARY'), 0,
  ]
  const body = [...ascii('Exif'), 0, 0, ...tiff]
  const len = body.length + 2
  return Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 0xff, ...body, 0xff, 0xda, 0, 2, 1, 0xff, 0xd9])
}

const fileInput = (c: HTMLElement) => c.querySelector('input[type="file"]') as HTMLInputElement
const has = (buf: Uint8Array, s: string) => Buffer.from(buf).includes(Buffer.from(s, 'latin1'))

afterEach(() => vi.restoreAllMocks())

describe('MetadataRemover', () => {
  it('lists what a photo contains and downloads a clean copy under the original name', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { container } = render(<MetadataRemover />)
    fireEvent.change(fileInput(container), {
      target: { files: [new File([jpegWithExif()], 'holiday.jpg', { type: 'image/jpeg' })] },
    })

    expect(await screen.findByText('GPS location')).toBeInTheDocument()
    expect(screen.getByText('CANARY')).toBeInTheDocument()
    expect(screen.getByText(/kept, so the photo stays upright/)).toBeInTheDocument()

    spy.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Download' }))
    const a = click.mock.contexts[click.mock.contexts.length - 1] as HTMLAnchorElement
    expect(a.download).toBe('holiday.jpg')
    const blob = spy.mock.calls[0][0] as Blob
    expect(blob.type).toBe('image/jpeg')
    const out = new Uint8Array(await blob.arrayBuffer())
    expect(has(out, 'CANARY')).toBe(false)
    expect([out[0], out[1]]).toEqual([0xff, 0xd8])
  })

  it('gives each of several files its own row and download button, and flags unsupported ones', async () => {
    const { container } = render(<MetadataRemover />)
    fireEvent.change(fileInput(container), {
      target: {
        files: [
          new File([jpegWithExif()], 'a.jpg', { type: 'image/jpeg' }),
          new File([jpegWithExif()], 'b.jpg', { type: 'image/jpeg' }),
          new File(['%PDF-1.7'], 'doc.pdf', { type: 'application/pdf' }),
        ],
      },
    })
    expect(await screen.findByText(/not supported/i)).toBeInTheDocument()
    expect(await screen.findAllByRole('button', { name: 'Download' })).toHaveLength(2)
    const pdfRow = screen.getByText('doc.pdf').closest('li') as HTMLElement
    expect(within(pdfRow).queryByRole('button', { name: 'Download' })).toBeNull()
  })

  it('reports a damaged file instead of crashing', async () => {
    const { container } = render(<MetadataRemover />)
    fireEvent.change(fileInput(container), {
      target: { files: [new File([Uint8Array.from([0xff, 0xd8, 0xff, 0x00, 1, 2])], 'bad.jpg', { type: 'image/jpeg' })] },
    })
    expect(await screen.findByText(/damaged/i)).toBeInTheDocument()
  })
})
