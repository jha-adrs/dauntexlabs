import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VcfToCsv from '@/components/tools/VcfToCsv'

const VCF = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'N:Doe;Jane;;;',
  'FN:Jane Doe',
  'EMAIL:jane@example.com',
  'TEL;TYPE=CELL:+1 555 0100',
  'END:VCARD',
  'BEGIN:VCARD',
  'VERSION:3.0',
  'FN:Broken',
  'BEGIN:VCARD',
  'VERSION:2.1',
  'N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Ren=C3=A9;Andr=C3=A9',
  'END:VCARD',
].join('\r\n')

async function downloadedText(spy: ReturnType<typeof vi.spyOn>) {
  const blob = spy.mock.calls.at(-1)![0] as Blob
  return blob.text()
}

describe('VcfToCsv', () => {
  it('parses pasted vCards, shows counts and a preview table', () => {
    render(<VcfToCsv />)
    fireEvent.change(screen.getByPlaceholderText(/paste vCard text/i), { target: { value: VCF } })
    expect(screen.getByText(/2 contacts/)).toBeInTheDocument()
    expect(screen.getByText(/1 skipped/)).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Jane Doe' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'André René' })).toBeInTheDocument()
  })

  it('loads a .vcf file', async () => {
    const { container } = render(<VcfToCsv />)
    const file = new File([VCF], 'contacts.vcf', { type: 'text/vcard' })
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } })
    expect(await screen.findByRole('cell', { name: 'Jane Doe' })).toBeInTheDocument()
  })

  it('downloads CSV in the chosen preset', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    render(<VcfToCsv />)
    fireEvent.change(screen.getByPlaceholderText(/paste vCard text/i), { target: { value: VCF } })
    fireEvent.click(screen.getByRole('tab', { name: 'Google Contacts' }))
    spy.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /download csv/i }))
    await waitFor(() => expect(spy).toHaveBeenCalled())
    const csv = await downloadedText(spy)
    expect(csv).toContain('Given Name')
    expect(csv).toContain('jane@example.com')
  })

  it('shows an error for text that is not a vCard', () => {
    render(<VcfToCsv />)
    fireEvent.change(screen.getByPlaceholderText(/paste vCard text/i), { target: { value: 'hello' } })
    expect(screen.getByText(/No vCard found/)).toBeInTheDocument()
  })
})
