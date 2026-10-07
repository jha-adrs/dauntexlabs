import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AadhaarMasker from '@/components/tools/AadhaarMasker'

// Canvas is stubbed (toBlob → tiny fake PNG, Image mocked → 120x90). FLOW only:
// load → draw boxes with pointer events → undo/clear → export fires a download.
// Box geometry is covered by test/lib/redact.test.ts.

const png = () => new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'card.png', { type: 'image/png' })
const fileInput = (c: HTMLElement) => c.querySelector('input[type="file"]') as HTMLInputElement

async function loaded() {
  const utils = render(<AadhaarMasker />)
  fireEvent.change(fileInput(utils.container), { target: { files: [png()] } })
  await screen.findByText('card.png')
  const canvas = utils.container.querySelector('canvas') as HTMLCanvasElement
  return { ...utils, canvas }
}

function drag(canvas: HTMLCanvasElement, from: [number, number], to: [number, number]) {
  fireEvent.pointerDown(canvas, { clientX: from[0], clientY: from[1], button: 0, pointerId: 1 })
  fireEvent.pointerMove(canvas, { clientX: to[0], clientY: to[1], pointerId: 1 })
  fireEvent.pointerUp(canvas, { clientX: to[0], clientY: to[1], pointerId: 1 })
}

describe('AadhaarMasker (canvas-stubbed: flow-only)', () => {
  it('says masking is manual before anything is loaded', () => {
    render(<AadhaarMasker />)
    expect(screen.getByText(/You choose what to cover/)).toBeInTheDocument()
  })

  it('loads an image and shows the drawing canvas with no boxes yet', async () => {
    const { canvas } = await loaded()
    expect(canvas).toBeInTheDocument()
    expect(screen.getByText(/120×90/)).toBeInTheDocument()
    expect(screen.getByText('0 boxes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled()
  })

  it('draws boxes by dragging (any direction), then undo and clear', async () => {
    const { canvas } = await loaded()
    drag(canvas, [10, 10], [50, 40])
    expect(screen.getByText('1 box')).toBeInTheDocument()
    drag(canvas, [80, 60], [60, 20]) // dragged up-left
    expect(screen.getByText('2 boxes')).toBeInTheDocument()
    drag(canvas, [5, 5], [5, 5]) // a click is not a box
    expect(screen.getByText('2 boxes')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByText('1 box')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear boxes' }))
    expect(screen.getByText('0 boxes')).toBeInTheDocument()
  })

  it('exports PNG by default and JPG when chosen', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const { canvas } = await loaded()
    drag(canvas, [10, 10], [50, 40])
    spy.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Download' }))
    await waitFor(() => expect(spy).toHaveBeenCalled())
    expect((spy.mock.calls[0][0] as Blob).type).toBe('image/png')

    fireEvent.click(screen.getByRole('tab', { name: 'JPG' }))
    spy.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Download' }))
    await waitFor(() => expect(spy).toHaveBeenCalled())
    expect((spy.mock.calls[0][0] as Blob).type).toBe('image/jpeg')
  })

  it('guide overlay is a toggle only — it never adds a box', async () => {
    await loaded()
    fireEvent.click(screen.getByLabelText(/Show 8-digit guide/))
    expect(screen.getByText('0 boxes')).toBeInTheDocument()
  })

  it('revokes the object URL when the image is removed', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    await loaded()
    revoke.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(revoke).toHaveBeenCalled()
    expect(screen.queryByText('card.png')).not.toBeInTheDocument()
  })

  it('rejects a PDF with a helpful error', () => {
    const { container } = render(<AadhaarMasker />)
    const pdf = new File(['%PDF'], 'aadhaar.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput(container), { target: { files: [pdf] } })
    expect(screen.getByText(/PDFs aren’t supported/)).toBeInTheDocument()
  })
})
