import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImageToBase64 from '@/components/tools/ImageToBase64'

// Uses FileReader.readAsDataURL (jsdom provides this for real) — NOT canvas.
// The data-URI is genuinely derived from the file bytes, so we can assert it.

function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

describe('ImageToBase64', () => {
  it('encodes a loaded image to a data-URI and shows output + snippets', async () => {
    const { container } = render(<ImageToBase64 />)
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'a.jpg', { type: 'image/jpeg' })
    fireEvent.change(getFileInput(container), { target: { files: [file] } })

    // chip + the read-only Data URI textarea appear once FileReader finishes.
    expect(await screen.findByText('a.jpg', {}, { timeout: 10000 })).toBeInTheDocument()

    // The first read-only textarea holds the data-URI.
    await waitFor(() => {
      const tas = container.querySelectorAll('textarea.ta')
      expect(tas.length).toBeGreaterThanOrEqual(3) // data URI + <img> + CSS
      expect((tas[0] as HTMLTextAreaElement).value).toMatch(/^data:image\/jpeg;base64,/)
      expect((tas[0] as HTMLTextAreaElement).readOnly).toBe(true)
    })

    // HTML <img> snippet textarea references the data-URI.
    const tas = container.querySelectorAll('textarea.ta')
    expect((tas[1] as HTMLTextAreaElement).value).toContain('<img src="data:image/jpeg;base64,')
    // CSS background-image snippet.
    expect((tas[2] as HTMLTextAreaElement).value).toContain('background-image: url("data:image/jpeg;base64,')

    // A rendered <img> preview using the data-URI exists.
    const previews = container.querySelectorAll('img')
    expect(previews.length).toBeGreaterThan(0)
    expect(
      Array.from(previews).some((im) => (im as HTMLImageElement).src.startsWith('data:image/jpeg;base64,')),
    ).toBe(true)
  })

  it('rejects a non-image file with an error notice', () => {
    const { container } = render(<ImageToBase64 />)
    const txt = new File(['hi'], 'note.txt', { type: 'text/plain' })
    fireEvent.change(getFileInput(container), { target: { files: [txt] } })
    expect(screen.getByText(/Please choose an image file/i)).toBeInTheDocument()
  })
})
