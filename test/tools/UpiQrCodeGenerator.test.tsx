import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UpiQrCodeGenerator from '@/components/tools/UpiQrCodeGenerator'

describe('UpiQrCodeGenerator', () => {
  it('preselects UPI payment with its fields', () => {
    render(<UpiQrCodeGenerator />)
    const select = screen.getByLabelText('Content') as HTMLSelectElement
    expect(select.value).toBe('upi')
    expect(select.selectedOptions[0].textContent).toBe('UPI payment')
    for (const label of ['UPI ID', 'Payee name', 'Amount (optional)', 'Note']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
  })

  it('shows an error and no preview for an invalid UPI ID', async () => {
    render(<UpiQrCodeGenerator />)
    fireEvent.change(screen.getByLabelText('UPI ID'), { target: { value: 'not-a-upi-id' } })
    expect(await screen.findByText(/valid UPI ID/)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /qr code preview/i })).toBeNull()
  })

  it('renders a preview for a valid UPI ID', async () => {
    render(<UpiQrCodeGenerator />)
    fireEvent.change(screen.getByLabelText('UPI ID'), { target: { value: 'shop@okhdfc' } })
    fireEvent.change(screen.getByLabelText('Amount (optional)'), { target: { value: '150' } })
    expect(await screen.findByRole('img', { name: /qr code preview/i }, { timeout: 5000 })).toBeInTheDocument()
  })
})
