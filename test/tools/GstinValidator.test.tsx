import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import GstinValidator from '@/components/tools/GstinValidator'
import { toCsv } from '@/lib/csv-write'

const input = () => screen.getByPlaceholderText(/one GSTIN per line/i)

describe('GstinValidator', () => {
  it('validates a batch of lines into a table, one row each', () => {
    render(<GstinValidator />)
    fireEvent.change(input(), { target: { value: '27AAPFU0939F1ZV\n\n07AAACR5055K1Z8\n29aaacb2894g1zj' } })
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows).toHaveLength(3)
    expect(within(rows[0]).getByText('Maharashtra')).toBeInTheDocument()
    expect(within(rows[0]).getByText('AAPFU0939F')).toBeInTheDocument()
    expect(within(rows[0]).getByText('Firm')).toBeInTheDocument()
    expect(within(rows[1]).getByText(/check character/i)).toBeInTheDocument()
    expect(within(rows[2]).getByText('29AAACB2894G1ZJ')).toBeInTheDocument()
    expect(screen.getByText(/2 valid · 1 invalid/)).toBeInTheDocument()
  })

  it('downloads the results as CSV built with toCsv', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL')
    render(<GstinValidator />)
    fireEvent.change(input(), { target: { value: '27AAPFU0939F1ZV\n07AAACR5055K1Z8' } })
    fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }))
    const csv = await (spy.mock.calls.at(-1)![0] as Blob).text()
    const body = csv.replace(/^\uFEFF/, '')
    expect(body.startsWith(
      toCsv([
        ['GSTIN', 'Valid', 'State', 'State code', 'PAN', 'Entity type', 'Registration no.', 'Error'],
        ['27AAPFU0939F1ZV', 'Yes', 'Maharashtra', '27', 'AAPFU0939F', 'Firm', '1', ''],
      ]),
    )).toBe(true)
    expect(csv).toMatch(/07AAACR5055K1Z8,No,,,,,,.*check character/i)
    spy.mockRestore()
  })

  it('shows nothing until input is given', () => {
    render(<GstinValidator />)
    expect(screen.queryByRole('table')).toBeNull()
  })
})
