import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { PDFDocument, degrees } from 'pdf-lib'
import OrganizePdf from '@/components/tools/OrganizePdf'

// pdf-lib runs for real. UI flow assertions + a direct pdf-lib check.

async function nPagePdfFile(name: string, n: number) {
  const d = await PDFDocument.create()
  for (let i = 0; i < n; i++) d.addPage()
  const bytes = await d.save()
  return new File([bytes], name, { type: 'application/pdf' })
}
function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

describe('OrganizePdf', () => {
  it('lists pages, rotates one, deletes one, and applies → download triggered', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const { container } = render(<OrganizePdf />)

    const file = await nPagePdfFile('doc.pdf', 3)
    fireEvent.change(getFileInput(container), { target: { files: [file] } })

    expect(await screen.findByText('doc.pdf', {}, { timeout: 10000 })).toBeInTheDocument()
    expect(screen.getByText('Page 1')).toBeInTheDocument()
    expect(screen.getByText('Page 2')).toBeInTheDocument()
    expect(screen.getByText('Page 3')).toBeInTheDocument()

    // Rotate page 1. The three rotate buttons always read "↻ 90°"; rotating
    // page 1 adds a "↻ 90°" indicator span to its label, so the total count of
    // matching text nodes increases from 3 to 4.
    const rotateButtons = screen.getAllByRole('button', { name: /↻ 90°/ })
    expect(rotateButtons).toHaveLength(3)
    expect(screen.getAllByText(/↻ 90°/)).toHaveLength(3)
    fireEvent.click(rotateButtons[0])
    expect(screen.getAllByText(/↻ 90°/)).toHaveLength(4)

    // Delete page 3 (third "delete" toggle).
    const deleteToggles = screen.getAllByLabelText('delete')
    fireEvent.click(deleteToggles[2])

    // Apply button now reflects 2 remaining pages.
    const applyBtn = await screen.findByRole('button', { name: /Apply → 2 pages/i })
    spy.mockClear()
    fireEvent.click(applyBtn)

    await waitFor(() => expect(spy).toHaveBeenCalled(), { timeout: 10000 })
    expect(screen.queryByText(/Could not rebuild/i)).not.toBeInTheDocument()
  })

  it('errors when all pages are deleted', async () => {
    const { container } = render(<OrganizePdf />)
    const file = await nPagePdfFile('doc.pdf', 2)
    fireEvent.change(getFileInput(container), { target: { files: [file] } })
    await screen.findByText('doc.pdf', {}, { timeout: 10000 })

    // Delete both pages; Apply button becomes disabled (remaining === 0).
    const deleteToggles = screen.getAllByLabelText('delete')
    fireEvent.click(deleteToggles[0])
    fireEvent.click(deleteToggles[1])

    const applyBtn = screen.getByRole('button', { name: /Apply →/i })
    expect(applyBtn).toBeDisabled()
  })

  it('direct pdf-lib: deleting one page from a 3-page doc + rotating yields 2 pages rotated 90°', async () => {
    const src = await PDFDocument.create()
    for (let i = 0; i < 3; i++) src.addPage()
    const srcBytes = await src.save()

    const loaded = await PDFDocument.load(srcBytes)
    const out = await PDFDocument.create()
    // keep pages 0 and 1, drop 2; rotate the first kept page.
    const copied = await out.copyPages(loaded, [0, 1])
    copied.forEach((page, k) => {
      const existing = page.getRotation().angle
      const added = k === 0 ? 90 : 0
      page.setRotation(degrees((existing + added) % 360))
      out.addPage(page)
    })
    const outBytes = await out.save()

    const reloaded = await PDFDocument.load(outBytes)
    expect(reloaded.getPageCount()).toBe(2)
    expect(reloaded.getPage(0).getRotation().angle).toBe(90)
  })
})
