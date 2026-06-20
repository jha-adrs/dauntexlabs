import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoanCalculator from '@/components/tools/LoanCalculator'

describe('LoanCalculator', () => {
  function setup() {
    render(<LoanCalculator />)
  }

  function getPrincipalInput() {
    return screen.getByPlaceholderText('e.g. 10000')
  }

  function getRateInput() {
    return screen.getByPlaceholderText('e.g. 5')
  }

  function getTermInput() {
    return screen.getByPlaceholderText('e.g. 1')
  }

  it('calculates correct monthly payment for P=10000, 5%, 1 year', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '10000' } })
    fireEvent.change(getRateInput(), { target: { value: '5' } })
    fireEvent.change(getTermInput(), { target: { value: '1' } })

    // Monthly payment = $856.07 — appears in summary card and table rows
    const matches = screen.getAllByText(/856\.07/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('calculates correct total interest for P=10000, 5%, 1 year', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '10000' } })
    fireEvent.change(getRateInput(), { target: { value: '5' } })
    fireEvent.change(getTermInput(), { target: { value: '1' } })

    // Total interest ≈ $272.90 — appears exactly once in the summary card
    expect(screen.getByText('$272.90')).toBeInTheDocument()
  })

  it('calculates correct total paid for P=10000, 5%, 1 year', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '10000' } })
    fireEvent.change(getRateInput(), { target: { value: '5' } })
    fireEvent.change(getTermInput(), { target: { value: '1' } })

    // Total paid ≈ $10,272.90
    expect(screen.getByText('$10,272.90')).toBeInTheDocument()
  })

  it('handles 0% interest rate (simple division)', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '12000' } })
    fireEvent.change(getRateInput(), { target: { value: '0' } })
    fireEvent.change(getTermInput(), { target: { value: '1' } })

    // Monthly = 12000 / 12 = 1000.00; should appear in the summary
    const matches = screen.getAllByText(/\$1,000\.00/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('shows error for negative principal', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '-5000' } })
    fireEvent.change(getRateInput(), { target: { value: '5' } })
    fireEvent.change(getTermInput(), { target: { value: '1' } })

    expect(screen.getByText(/positive number/i)).toBeInTheDocument()
  })

  it('shows error for negative interest rate', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '10000' } })
    fireEvent.change(getRateInput(), { target: { value: '-1' } })
    fireEvent.change(getTermInput(), { target: { value: '1' } })

    expect(screen.getByText(/0 or greater/i)).toBeInTheDocument()
  })

  it('renders amortization schedule table rows', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '10000' } })
    fireEvent.change(getRateInput(), { target: { value: '5' } })
    fireEvent.change(getTermInput(), { target: { value: '1' } })

    // 12-month loan: rows 1..12 should all be visible
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('supports months term unit', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '10000' } })
    fireEvent.change(getRateInput(), { target: { value: '5' } })
    // Switch to Months
    fireEvent.click(screen.getByRole('tab', { name: 'Months' }))
    fireEvent.change(getTermInput(), { target: { value: '12' } })

    // Same as 1 year → monthly ≈ 856.07 (appears in summary + table)
    const matches = screen.getAllByText(/856\.07/)
    expect(matches.length).toBeGreaterThan(0)
  })
})
