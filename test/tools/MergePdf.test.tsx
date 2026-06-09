import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PDFDocument } from 'pdf-lib'
import MergePdf from '@/components/tools/MergePdf'

// pdf-lib runs for real in jsdom. We assert the UI flow (download triggered) AND
// the underlying page math directly against pdf-lib.

async function twoPagePdfFile(name: string) {
  const d = await PDFDocument.create()
  d.addPage()
  d.addPage()
  const bytes = await d.save()
  return new File([bytes], name, { type: 'application/pdf' })
}
function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

describe('MergePdf', () => {
  it('lists added PDFs and triggers a merged download (createObjectURL spy)', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const { container } = render(<MergePdf />)

    const a = await twoPagePdfFile('a.pdf')
    const b = await twoPagePdfFile('b.pdf')
    fireEvent.change(getFileInput(container), { target: { files: [a, b] } })

    // Both chips appear after the async arrayBuffer load.
    expect(await screen.findByText('a.pdf', {}, { timeout: 10000 })).toBeInTheDocument()
    expect(screen.getByText('b.pdf')).toBeInTheDocument()

    const mergeBtn = screen.getByRole('button', { name: /Merge 2 PDFs/i })
    spy.mockClear()
    fireEvent.click(mergeBtn)

    await waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 10000 })
    expect(screen.queryByText(/Could not merge/i)).not.toBeInTheDocument()
  })

  it('direct pdf-lib: merging two 2-page docs yields 4 pages', async () => {
    const out = await PDFDocument.create()
    for (const _ of [0, 1]) {
      const src = await PDFDocument.create()
      src.addPage()
      src.addPage()
      const srcBytes = await src.save()
      const loaded = await PDFDocument.load(srcBytes)
      const pages = await out.copyPages(loaded, loaded.getPageIndices())
      pages.forEach((p) => out.addPage(p))
    }
    const mergedBytes = await out.save()
    const reloaded = await PDFDocument.load(mergedBytes)
    expect(reloaded.getPageCount()).toBe(4)
  })
})
