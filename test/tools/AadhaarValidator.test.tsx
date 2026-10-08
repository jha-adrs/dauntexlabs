import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AadhaarValidator from '@/components/tools/AadhaarValidator'

const input = () => screen.getByPlaceholderText(/1234 5678 9012/)

describe('AadhaarValidator', () => {
  it('says it checks format only and links to the masker', () => {
    render(<AadhaarValidator />)
    expect(
      screen.getByText('This checks the format and check digit only. It cannot tell you whether an Aadhaar number was issued.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /aadhaar masker/i })).toHaveAttribute('href', '/tools/aadhaar-masker/')
  })

  it('shows a valid number masked by default, full on toggle', () => {
    render(<AadhaarValidator />)
    fireEvent.change(input(), { target: { value: '2341 2341 2346' } })
    expect(screen.getByText(/format valid/i)).toBeInTheDocument()
    expect(screen.getByText('XXXX XXXX 2346')).toBeInTheDocument()
    expect(screen.queryByText('2341 2341 2346')).toBeNull()
    fireEvent.click(screen.getByLabelText('Show full number'))
    expect(screen.getByText('2341 2341 2346')).toBeInTheDocument()
  })

  it('reports a wrong check digit', () => {
    render(<AadhaarValidator />)
    fireEvent.change(input(), { target: { value: '234123412348' } })
    expect(screen.getByText(/check digit \(last digit\) does not match/i)).toBeInTheDocument()
    expect(screen.queryByText(/format valid/i)).toBeNull()
  })
})
