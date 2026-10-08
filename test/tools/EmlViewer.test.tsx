import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EmlViewer from '@/components/tools/EmlViewer'
import { SANDBOX_CSP } from '@/lib/eml'

const EML = [
  'From: Asha <asha@example.com>',
  'To: ravi@example.com',
  'Subject: =?UTF-8?Q?Caf=C3=A9_menu?=',
  'Date: Thu, 08 Oct 2026 09:00:00 +0530',
  'Content-Type: multipart/mixed; boundary=b',
  '',
  '--b',
  'Content-Type: text/html; charset=utf-8',
  '',
  '<p>Hello</p><img src="https://tracker.example/pixel.gif"><script>alert(1)</script>',
  '--b',
  'Content-Type: text/plain; name=menu.txt',
  'Content-Disposition: attachment; filename=menu.txt',
  '',
  'Soup',
  '--b--',
].join('\r\n')

describe('EmlViewer', () => {
  it('shows headers and the HTML body in a locked-down sandboxed iframe', () => {
    const { container } = render(<EmlViewer />)
    fireEvent.change(screen.getByPlaceholderText(/paste/i), { target: { value: EML } })
    expect(screen.getByText('Café menu')).toBeInTheDocument()
    expect(screen.getByText('Asha <asha@example.com>')).toBeInTheDocument()
    expect(screen.getByText('Remote images and trackers in this email are blocked.')).toBeInTheDocument()
    const frame = container.querySelector('iframe')!
    expect(frame.getAttribute('sandbox')).toBe('')
    const doc = frame.getAttribute('srcdoc')!
    expect(doc.startsWith(`<meta http-equiv="Content-Security-Policy" content="${SANDBOX_CSP}">`)).toBe(true)
    expect(doc).not.toMatch(/<script/i)
  })

  it('downloads an attachment through a revoked object URL', () => {
    const create = vi.spyOn(URL, 'createObjectURL')
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    render(<EmlViewer />)
    fireEvent.change(screen.getByPlaceholderText(/paste/i), { target: { value: EML } })
    expect(screen.getByText('menu.txt')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /download menu\.txt/i }))
    expect(create).toHaveBeenCalledTimes(1)
    expect(revoke).toHaveBeenCalledWith(create.mock.results[0].value)
    create.mockRestore()
    revoke.mockRestore()
  })

  it('loads an .eml file from bytes', async () => {
    const { container } = render(<EmlViewer />)
    const file = new File([new TextEncoder().encode(EML)], 'mail.eml', { type: 'message/rfc822' })
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } })
    expect(await screen.findByText('Café menu')).toBeInTheDocument()
    expect(screen.getByText('mail.eml')).toBeInTheDocument()
  })

  it('shows an error for text that is not an email', () => {
    render(<EmlViewer />)
    fireEvent.change(screen.getByPlaceholderText(/paste/i), { target: { value: 'hello world' } })
    expect(screen.getByText(/no headers/i)).toBeInTheDocument()
  })
})
