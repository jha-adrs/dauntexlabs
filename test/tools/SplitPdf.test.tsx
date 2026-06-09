import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PDFDocument } from 'pdf-lib'
import SplitPdf from '@/components/tools/SplitPdf'

// pdf-lib runs for real. UI flow assertions + direct pdf-lib page-count check.

async function nPagePdfFile(name: string, n: number) {
  const d = await PDFDocument.create()
  for (let i = 0; i < n; i++) d.addPage()
  const bytes = await d.save()
  return new File([bytes], name, { type: 'application/pdf' })
}
function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

describe('SplitPdf', () => {
  it('loads a 5-page PDF, extracts a range, and triggers a download', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const { container } = render(<SplitPdf />)

    const file = await nPagePdfFile('doc.pdf', 5)
    fireEvent.change(getFileInput(container), { target: { files: [file] } })

    // After load, chip shows page count (appears in both chip meta and the
    // field hint, so assert at least one match rather than a unique one).
    expect(await screen.findByText('doc.pdf', {}, { timeout: 10000 })).toBeInTheDocument()
    expect(screen.getAllByText(/5 pages/).length).toBeGreaterThan(0)

    fireEvent.change(screen.getByPlaceholderText(/1-3,5,8-10/), { target: { value: '1-2' } })

    const runBtn = screen.getByRole('button', { name: /Extract pages/i })
    spy.mockClear()
    fireEvent.click(runBtn)

    await waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 10000 })
  })

  it('shows an error for an out-of-range page request', async () => {
    const { container } = render(<SplitPdf />)
    const file = await nPagePdfFile('doc.pdf', 5)
    fireEvent.change(getFileInput(container), { target: { files: [file] } })
    await screen.findByText('doc.pdf', {}, { timeout: 10000 })

    fireEvent.change(screen.getByPlaceholderText(/1-3,5,8-10/), { target: { value: '99' } })
    fireEvent.click(screen.getByRole('button', { name: /Extract pages/i }))

    expect(await screen.findByText(/only 5 pages/i, {}, { timeout: 10000 })).toBeInTheDocument()
  })

  it('direct pdf-lib: extracting pages 1-2 from a 5-page doc yields 2 pages', async () => {
    const src = await PDFDocument.create()
    for (let i = 0; i < 5; i++) src.addPage()
    const srcBytes = await src.save()

    const loaded = await PDFDocument.load(srcBytes)
    const out = await PDFDocument.create()
    const copied = await out.copyPages(loaded, [0, 1])
    copied.forEach((p) => out.addPage(p))
    const outBytes = await out.save()

    const reloaded = await PDFDocument.load(outBytes)
    expect(reloaded.getPageCount()).toBe(2)
  })
})
