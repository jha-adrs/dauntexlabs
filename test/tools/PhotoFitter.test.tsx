import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import PhotoFitter from '@/components/photo/PhotoFitter'
import { jfifDensity } from '@/lib/photo-fit'
import { fakeJpeg } from '../lib/fake-jpeg'

// Canvas is stubbed in test/setup.ts; here toBlob returns a structurally valid JPEG whose
// size we control, so the engine's search/pad/DPI paths run for real. Image mock is 120×90.
let size: (q: number) => number = (q) => 30000 * q
const original = HTMLCanvasElement.prototype.toBlob
beforeEach(() => {
  size = (q) => 30000 * q
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, type?: string, q = 0.92) {
    cb(new Blob([fakeJpeg(Math.max(26, Math.round(size(q))))], { type: type ?? 'image/png' }))
  }
})
afterEach(() => { HTMLCanvasElement.prototype.toBlob = original; vi.restoreAllMocks() })

const jpg = (name: string) => new File([new Uint8Array([0xff, 0xd8, 0xff])], name, { type: 'image/jpeg' })
const section = (name: string) => screen.getByRole('region', { name })
async function load(name: string, file = jpg('me.jpg')) {
  fireEvent.change(section(name).querySelector('input[type="file"]')!, { target: { files: [file] } })
  await within(section(name)).findByText(file.name)
}

describe('PhotoFitter', () => {
  it('renders one section per IBPS upload', () => {
    render(<PhotoFitter preset="ibps-photo-signature-size" />)
    for (const n of ['Photo', 'Signature', 'Left thumb impression', 'Handwritten declaration']) expect(section(n)).toBeInTheDocument()
  })

  it('makes an in-range 200×230 JPG at 200 DPI and downloads photo.jpg', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    render(<PhotoFitter preset="ibps-photo-signature-size" />)
    await load('Photo')
    fireEvent.click(within(section('Photo')).getByRole('button', { name: 'Make file' }))
    const checks = await within(section('Photo')).findByRole('list', { name: 'Checks' })
    expect([...checks.querySelectorAll('li')].map((li) => li.dataset.ok)).toEqual(['true', 'true', 'true', 'true'])
    expect(within(section('Photo')).getByText(/200 × 230 px ·/)).toBeInTheDocument()
    spy.mockClear()
    fireEvent.click(within(section('Photo')).getByRole('button', { name: 'Download photo.jpg' }))
    await waitFor(() => expect(spy).toHaveBeenCalled())
    const blob = spy.mock.calls[0][0] as Blob
    expect(blob.type).toBe('image/jpeg')
    const bytes = new Uint8Array(await blob.arrayBuffer())
    expect(bytes.length).toBeGreaterThanOrEqual(20480)
    expect(bytes.length).toBeLessThanOrEqual(50000)
    expect(jfifDensity(bytes)).toBe(200)
  })

  it('upscales a small source into the 800×400 declaration', async () => {
    size = () => 70000
    render(<PhotoFitter preset="ibps-photo-signature-size" />)
    await load('Handwritten declaration')
    fireEvent.click(within(section('Handwritten declaration')).getByRole('button', { name: 'Make file' }))
    expect(await within(section('Handwritten declaration')).findByText(/800 × 400 px ·/)).toBeInTheDocument()
  })

  it('pads a tiny file up to the minimum and says so', async () => {
    size = () => 2000
    render(<PhotoFitter preset="increase-image-size-in-kb" />)
    await load('Photo')
    fireEvent.click(screen.getByRole('button', { name: 'Make file' }))
    expect(await screen.findByText(/Padded with blank bytes/)).toBeInTheDocument()
  })

  it('explains a fixed-size file that cannot get small enough', async () => {
    size = () => 1e6
    render(<PhotoFitter preset="ibps-photo-signature-size" />)
    await load('Photo')
    fireEvent.click(within(section('Photo')).getByRole('button', { name: 'Make file' }))
    expect(await screen.findByText(/can’t get under 50 KB at 200 × 230 px/)).toBeInTheDocument()
  })

  it('clears a stale result when the crop changes', async () => {
    render(<PhotoFitter preset="ibps-photo-signature-size" />)
    await load('Photo')
    fireEvent.click(within(section('Photo')).getByRole('button', { name: 'Make file' }))
    await within(section('Photo')).findByRole('list', { name: 'Checks' })
    fireEvent.change(within(section('Photo')).getByLabelText('Zoom'), { target: { value: '1.5' } })
    expect(within(section('Photo')).queryByRole('button', { name: 'Download photo.jpg' })).toBeNull()
  })

  it('rejects non-images and undecodable images in plain words', async () => {
    render(<PhotoFitter preset="resize-image-to-20kb" />)
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] } })
    expect(await screen.findByText('Please choose an image file (JPG, PNG or WebP).')).toBeInTheDocument()
    const Real = globalThis.Image
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    globalThis.Image = class { onload: (() => void) | null = null; onerror: (() => void) | null = null; set src(_v: string) { setTimeout(() => this.onerror?.(), 0) } } as unknown as typeof Image
    try {
      fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [jpg('IMG_1.heic')] } })
      expect(await screen.findByText(/Could not read that image\. iPhone HEIC/)).toBeInTheDocument()
      expect(revoke).toHaveBeenCalled()
    } finally { globalThis.Image = Real }
  })

  it('size pages expose px and KB inputs and block bad ranges', () => {
    render(<PhotoFitter preset="resize-image-to-20kb" />)
    for (const l of ['Width (px)', 'Height (px)', 'Min KB', 'Max KB']) expect(screen.getByText(l)).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('10'), { target: { value: '25' } })
    expect(screen.getByText(/minimum KB must be below maximum KB/)).toBeInTheDocument()
  })

  it('exam pages have no free size inputs; TNPSC turns the name strip on', async () => {
    render(<PhotoFitter preset="tnpsc-photo-signature-size" />)
    expect(screen.queryByText('Min KB')).toBeNull()
    await load('Photo')
    expect(within(section('Photo')).getByPlaceholderText('Name as on the form')).toBeInTheDocument()
    expect((section('Photo').querySelector('input[type="date"]') as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('drops a result whose settings changed while it was being made', async () => {
    const fast = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, type?: string, q?: number) {
      setTimeout(() => fast.call(this, cb, type, q), 30)
    }
    render(<PhotoFitter preset="ibps-photo-signature-size" />)
    await load('Photo')
    fireEvent.click(within(section('Photo')).getByRole('button', { name: 'Make file' }))
    fireEvent.change(within(section('Photo')).getByLabelText('Zoom'), { target: { value: '1.5' } })
    await new Promise((r) => setTimeout(r, 400))
    expect(within(section('Photo')).queryByRole('button', { name: 'Download photo.jpg' })).toBeNull()
    expect(within(section('Photo')).queryByRole('list', { name: 'Checks' })).toBeNull()
  })

  it('size pages hide the last result when the size inputs become invalid', async () => {
    render(<PhotoFitter preset="resize-image-to-20kb" />)
    await load('Photo')
    fireEvent.click(screen.getByRole('button', { name: 'Make file' }))
    await screen.findByRole('list', { name: 'Checks' })
    const width = screen.getByText('Width (px)').parentElement!.querySelector('input')!
    fireEvent.change(width, { target: { value: '300' } })
    expect(screen.queryByRole('button', { name: 'Download photo.jpg' })).toBeNull()
  })

  it('rejects absurd KB values before making anything', async () => {
    render(<PhotoFitter preset="resize-image-to-20kb" />)
    await load('Photo')
    const kb = (label: string) => screen.getByText(label).parentElement!.querySelector('input')!
    fireEvent.change(kb('Max KB'), { target: { value: '600000' } })
    fireEvent.change(kb('Min KB'), { target: { value: '500000' } })
    expect(screen.getByText(/at most 5000 KB/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Make file' })).toBeDisabled()
  })

  it('accepts a file with an empty MIME type (Android / WhatsApp pickers)', async () => {
    render(<PhotoFitter preset="resize-image-to-20kb" />)
    await load('Photo', new File([new Uint8Array([0xff, 0xd8, 0xff])], 'IMG-20261106-WA0001.jpg', { type: '' }))
    expect(screen.queryByText(/Please choose an image file/)).toBeNull()
  })

  it('downscales a huge photo once on load to at most 2000 px', async () => {
    const Real = globalThis.Image
    globalThis.Image = class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      naturalWidth = 8000
      naturalHeight = 6000
      set src(_v: string) { setTimeout(() => this.onload?.(), 0) }
    } as unknown as typeof Image
    const sizes: string[] = []
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...a: unknown[]) {
      sizes.push(`${this.width}x${this.height}`)
      return (getContext as (...x: unknown[]) => unknown).apply(this, a)
    } as typeof HTMLCanvasElement.prototype.getContext
    try {
      render(<PhotoFitter preset="resize-image-to-20kb" />)
      await load('Photo')
      expect(sizes).toContain('2000x1500')
      expect(screen.getByText('8000×6000')).toBeInTheDocument()
    } finally {
      globalThis.Image = Real
      HTMLCanvasElement.prototype.getContext = getContext
    }
  })

  it('warns that strong whitening can erase faint signatures', async () => {
    render(<PhotoFitter preset="rrb-signature-size" />)
    await load('Signature')
    expect(within(section('Signature')).getByText(/Faint signatures: lower the strength/)).toBeInTheDocument()
  })

  it('revokes the image URL when the file is removed', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    render(<PhotoFitter preset="resize-image-to-20kb" />)
    await load('Photo')
    fireEvent.click(within(section('Photo')).getByRole('button', { name: 'Remove file' }))
    expect(revoke).toHaveBeenCalled()
  })
})
