import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PDFDocument, PDFName } from 'pdf-lib'
import PdfMetadataRemover from '@/components/tools/PdfMetadataRemover'

// Real pdf-lib in jsdom (pattern: test/tools/MergePdf.test.tsx). The downloaded Blob
// is captured from the createObjectURL spy and loaded back through pdf-lib.

async function canaryFile(encrypted = false) {
  const d = await PDFDocument.create()
  d.addPage()
  d.setAuthor('CANARY')
  d.setTitle('Secret plan')
  const xmp = d.context.stream('<x:xmpmeta>CANARY</x:xmpmeta>', { Type: 'Metadata', Subtype: 'XML' })
  d.catalog.set(PDFName.of('Metadata'), d.context.register(xmp))
  if (encrypted) d.context.trailerInfo.Encrypt = d.context.obj({ Filter: 'Standard', V: 1, R: 2 })
  return new File([await d.save()], 'report.pdf', { type: 'application/pdf' })
}
const fileInput = (c: HTMLElement) => c.querySelector('input[type="file"]') as HTMLInputElement

describe('PdfMetadataRemover', () => {
  it('shows metadata, removes it all and downloads <name>-clean.pdf', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { container } = render(<PdfMetadataRemover />)
    fireEvent.change(fileInput(container), { target: { files: [await canaryFile()] } })

    expect(await screen.findByDisplayValue('CANARY', {}, { timeout: 10000 })).toBeInTheDocument()
    expect(screen.getByText(/XMP metadata stream found/i)).toBeInTheDocument()

    spy.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Remove all metadata' }))
    await waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 10000 })

    const a = click.mock.contexts[click.mock.contexts.length - 1] as HTMLAnchorElement
    expect(a.download).toBe('report-clean.pdf')
    const blob = spy.mock.calls[0][0] as Blob
    const out = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()), { updateMetadata: false })
    expect(out.getAuthor()).toBeUndefined()
    expect(out.catalog.get(PDFName.of('Metadata'))).toBeUndefined()
    click.mockRestore()
  })

  it('shows a clear error for an encrypted PDF', async () => {
    const { container } = render(<PdfMetadataRemover />)
    fireEvent.change(fileInput(container), { target: { files: [await canaryFile(true)] } })
    expect(await screen.findByText(/encrypted or password-protected/i, {}, { timeout: 10000 })).toBeInTheDocument()
  })
})
