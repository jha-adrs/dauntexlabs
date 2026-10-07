import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PhotoDateStamp from '@/components/tools/PhotoDateStamp'
import { formatDateIN } from '@/lib/stamp'

// Canvas is stubbed (toBlob → tiny fake blob, Image mocked → 120x90). FLOW only;
// layout/date/fit maths are covered by test/lib/stamp.test.ts.

const jpg = (name: string) => new File([new Uint8Array([0xff, 0xd8, 0xff])], name, { type: 'image/jpeg' })
const inputs = (c: HTMLElement) => Array.from(c.querySelectorAll('input[type="file"]')) as HTMLInputElement[]

async function loaded() {
  const utils = render(<PhotoDateStamp />)
  fireEvent.change(inputs(utils.container)[0], { target: { files: [jpg('me.jpg')] } })
  await screen.findByText('me.jpg')
  return utils
}

describe('PhotoDateStamp (canvas-stubbed: flow-only)', () => {
  it('loads a photo and shows name, date, size controls and a live preview', async () => {
    const { container } = await loaded()
    expect(screen.getByPlaceholderText('Name as on the form')).toBeInTheDocument()
    const date = container.querySelector('input[type="date"]') as HTMLInputElement
    expect(formatDateIN(date.value)).not.toBe('') // defaults to today
    expect(screen.getByText(new RegExp(formatDateIN(date.value)))).toBeInTheDocument()
    expect(screen.getByText('Photo size')).toBeInTheDocument()
    expect(screen.getByText(/JPEG quality —/)).toBeInTheDocument()
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('shows the formatted date for a picked date', async () => {
    const { container } = await loaded()
    fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: '2026-01-26' } })
    expect(screen.getByText(/26\/01\/2026/)).toBeInTheDocument()
  })

  it('custom size reveals width/height inputs', async () => {
    const { container } = await loaded()
    fireEvent.change(container.querySelector('select.sel')!, { target: { value: 'custom' } })
    expect(screen.getByText('Width (px)')).toBeInTheDocument()
    expect(screen.getByText('Height (px)')).toBeInTheDocument()
  })

  it('downloads a JPEG and reports its size', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    await loaded()
    fireEvent.change(screen.getByPlaceholderText('Name as on the form'), { target: { value: 'Asha Rao' } })
    spy.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Download photo' }))
    await waitFor(() => expect(spy).toHaveBeenCalled())
    expect((spy.mock.calls[0][0] as Blob).type).toBe('image/jpeg')
    expect(await screen.findByText(/Saved .* KB|Saved .* B/)).toBeInTheDocument()
  })

  it('adds a signature: joined by default, separate download when unjoined', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    const { container } = await loaded()
    // the photo drop is replaced by its chip, so the only file input left is the signature's
    fireEvent.change(inputs(container).at(-1)!, { target: { files: [jpg('sign.jpg')] } })
    await screen.findByText('sign.jpg')
    expect(screen.queryByRole('button', { name: 'Download signature' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText(/Join signature below photo/))
    const btn = await screen.findByRole('button', { name: 'Download signature' })
    spy.mockClear()
    fireEvent.click(btn)
    await waitFor(() => expect(spy).toHaveBeenCalled())
  })

  it('rejects a non-image file', () => {
    const { container } = render(<PhotoDateStamp />)
    fireEvent.change(inputs(container)[0], { target: { files: [new File(['x'], 'a.txt', { type: 'text/plain' })] } })
    expect(screen.getByText(/Please choose an image/)).toBeInTheDocument()
  })

  it('revokes the object URL when the photo is removed', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    await loaded()
    revoke.mockClear()
    fireEvent.click(screen.getAllByRole('button', { name: /remove/i })[0])
    expect(revoke).toHaveBeenCalled()
  })
})
