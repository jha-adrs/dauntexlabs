import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import QrCodeGenerator from '@/components/tools/QrCodeGenerator'

/* qrcode-generator is a real installed dep. The preview is our own SVG markup,
 * so structure is asserted directly; PNG/JPEG rasterising is covered by e2e. */

afterEach(() => {
  vi.restoreAllMocks()
})

const COPY = 'Free, no sign-up, no watermark. Static QR code — it never expires and scanning it never goes through our servers.'

async function preview() {
  return screen.findByRole('img', { name: /qr code preview/i }, { timeout: 5000 })
}

function typeUrl(value = 'https://dauntexlabs.com') {
  fireEvent.change(screen.getByLabelText('Link'), { target: { value } })
}

describe('QrCodeGenerator', () => {
  it('lists 12 content types and shows the free/no-watermark copy', () => {
    render(<QrCodeGenerator />)
    const select = screen.getByLabelText('Content') as HTMLSelectElement
    expect(select.options.length).toBe(12)
    expect(select.value).toBe('url')
    expect(screen.getByText(COPY)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /qr code preview/i })).toBeNull()
  })

  it('renders an SVG preview after typing a URL', async () => {
    render(<QrCodeGenerator />)
    typeUrl()
    const img = await preview()
    expect(img.querySelector('svg')).not.toBeNull()
    expect(img.querySelectorAll('[data-eye-frame]').length).toBe(3)
  })

  it('shows SSID, password and security fields for Wi-Fi', () => {
    render(<QrCodeGenerator />)
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'wifi' } })
    expect(screen.getByLabelText('Network name (SSID)')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Security')).toBeInTheDocument()
  })

  it('changes the preview when a preset is clicked', async () => {
    render(<QrCodeGenerator />)
    typeUrl()
    const img = await preview()
    const before = img.innerHTML
    fireEvent.click(screen.getByRole('button', { name: 'Dots' }))
    await waitFor(() => expect(screen.getByRole('img', { name: /qr code preview/i }).innerHTML).not.toBe(before))
    expect(screen.getByRole('img', { name: /qr code preview/i }).querySelector('circle')).not.toBeNull()
  })

  it('raises error correction to H when a logo is added', async () => {
    const { container } = render(<QrCodeGenerator />)
    typeUrl()
    await preview()
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'logo.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByText(/Error correction raised to H/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('img', { name: /qr code preview/i }).querySelector('image')).not.toBeNull())
  })

  it('warns about low contrast colours', async () => {
    render(<QrCodeGenerator />)
    typeUrl()
    await preview()
    fireEvent.change(screen.getByLabelText('Code colour'), { target: { value: '#777777' } })
    fireEvent.change(screen.getByLabelText('Background colour'), { target: { value: '#888888' } })
    expect(await screen.findByText(/Low contrast/)).toBeInTheDocument()
  })

  it('Download SVG creates an image/svg+xml blob and revokes its URL', async () => {
    const create = vi.spyOn(URL, 'createObjectURL')
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    render(<QrCodeGenerator />)
    typeUrl()
    await preview()
    fireEvent.click(screen.getByRole('button', { name: 'Download SVG' }))
    expect(create).toHaveBeenCalled()
    const blob = create.mock.calls[0][0] as Blob
    expect(blob.type).toBe('image/svg+xml')
    expect(revoke).toHaveBeenCalled()
  })

  it('Download PNG rasterises and downloads, revoking every object URL', async () => {
    const create = vi.spyOn(URL, 'createObjectURL')
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    render(<QrCodeGenerator />)
    typeUrl()
    await preview()
    fireEvent.click(screen.getByRole('button', { name: 'Download PNG' }))
    await waitFor(() => expect(create.mock.calls.some(([b]) => (b as Blob).type === 'image/png')).toBe(true))
    await waitFor(() => expect(revoke.mock.calls.length).toBe(create.mock.calls.length))
  })

  it('shows an error and no preview for invalid input', async () => {
    render(<QrCodeGenerator />)
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'geo' } })
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '95' } })
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '10' } })
    expect(await screen.findByText(/Latitude must be/)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /qr code preview/i })).toBeNull()
  })

  it('offers only the eye centres allowed for the chosen frame, snapping when needed', () => {
    render(<QrCodeGenerator />)
    const group = (label: string) => within(screen.getByText(label).parentElement as HTMLElement)
    const names = () => group('Eye centre').getAllByRole('tab').map((t) => t.textContent)
    const selected = () => group('Eye centre').getAllByRole('tab').find((t) => t.getAttribute('aria-selected') === 'true')?.textContent

    expect(names()).toEqual(['Square'])
    fireEvent.click(group('Eye frame').getByRole('tab', { name: 'Leaf' }))
    expect(names()).toEqual(['Rounded', 'Circle'])
    expect(selected()).toBe('Rounded')
    fireEvent.click(group('Eye centre').getByRole('tab', { name: 'Circle' }))
    fireEvent.click(group('Eye frame').getByRole('tab', { name: 'Circle' }))
    expect(names()).toEqual(['Circle'])
    expect(selected()).toBe('Circle')
    fireEvent.click(group('Eye frame').getByRole('tab', { name: 'Rounded' }))
    expect(selected()).toBe('Rounded')
    expect(screen.queryByRole('tab', { name: 'Diamond' })).toBeNull()
  })
})
