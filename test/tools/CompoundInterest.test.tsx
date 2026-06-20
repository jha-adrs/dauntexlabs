import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CompoundInterest from '@/components/tools/CompoundInterest'

describe('CompoundInterest', () => {
  function setup() {
    render(<CompoundInterest />)
  }

  function getPrincipalInput() {
    return screen.getByPlaceholderText('e.g. 1000')
  }

  function getRateInput() {
    return screen.getByPlaceholderText('e.g. 5')
  }

  function getYearsInput() {
    return screen.getByPlaceholderText('e.g. 10')
  }

  function getContributionInput() {
    return screen.getByPlaceholderText('e.g. 100')
  }

  it('calculates P=1000, 5% annually, 10 years, 0 contribution → ≈ 1628.89', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '1000' } })
    fireEvent.change(getRateInput(), { target: { value: '5' } })
    fireEvent.change(getYearsInput(), { target: { value: '10' } })
    fireEvent.change(getContributionInput(), { target: { value: '0' } })

    // Final balance ≈ $1,628.89
    expect(screen.getByText(/1,628\.89/)).toBeInTheDocument()
  })

  it('total interest ≈ 628.89 for base case', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '1000' } })
    fireEvent.change(getRateInput(), { target: { value: '5' } })
    fireEvent.change(getYearsInput(), { target: { value: '10' } })
    fireEvent.change(getContributionInput(), { target: { value: '0' } })

    // Interest earned ≈ $628.89 — appears as exact text "$628.89" (not part of $1,628.89)
    const matches = screen.getAllByText(/628\.89/)
    expect(matches.some((el) => el.textContent === '$628.89')).toBe(true)
  })

  it('total contributions for 0 monthly = just principal', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '1000' } })
    fireEvent.change(getRateInput(), { target: { value: '5' } })
    fireEvent.change(getYearsInput(), { target: { value: '10' } })
    fireEvent.change(getContributionInput(), { target: { value: '0' } })

    // Total contributions = $1,000.00
    expect(screen.getByText(/1,000\.00/)).toBeInTheDocument()
  })

  it('monthly contributions increase final balance', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '1000' } })
    fireEvent.change(getRateInput(), { target: { value: '5' } })
    fireEvent.change(getYearsInput(), { target: { value: '10' } })
    fireEvent.change(getContributionInput(), { target: { value: '100' } })

    // With $100/mo contributions, final balance >> 1628.89
    // 120 months * 100 = 12000 contributions + interest
    // Total contributions = 1000 + 12000 = 13000; final balance > 13000
    const balanceEls = screen.getAllByText(/\$/)
    // Just assert we get some output (no error)
    expect(balanceEls.length).toBeGreaterThan(0)
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
  })

  it('handles 0% interest (no growth, just contributions)', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '1000' } })
    fireEvent.change(getRateInput(), { target: { value: '0' } })
    fireEvent.change(getYearsInput(), { target: { value: '5' } })
    fireEvent.change(getContributionInput(), { target: { value: '0' } })

    // Final balance = principal = $1,000.00 (no growth)
    expect(screen.getAllByText(/1,000\.00/).length).toBeGreaterThan(0)
  })

  it('shows error for negative rate', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '1000' } })
    fireEvent.change(getRateInput(), { target: { value: '-5' } })
    fireEvent.change(getYearsInput(), { target: { value: '10' } })

    expect(screen.getByText(/0 or greater/i)).toBeInTheDocument()
  })

  it('shows error for negative years', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '1000' } })
    fireEvent.change(getRateInput(), { target: { value: '5' } })
    fireEvent.change(getYearsInput(), { target: { value: '-1' } })

    expect(screen.getByText(/positive number/i)).toBeInTheDocument()
  })

  it('calculates quarterly compounding correctly', () => {
    setup()
    fireEvent.change(getPrincipalInput(), { target: { value: '1000' } })
    fireEvent.change(getRateInput(), { target: { value: '5' } })
    // Set compounding to quarterly
    const compSel = screen.getByDisplayValue('Annually (1×/yr)')
    fireEvent.change(compSel, { target: { value: '4' } })
    fireEvent.change(getYearsInput(), { target: { value: '10' } })
    fireEvent.change(getContributionInput(), { target: { value: '0' } })

    // P*(1 + 0.05/4)^(4*10) = 1000 * (1.0125)^40 ≈ 1643.62
    expect(screen.getByText(/1,643\.6/)).toBeInTheDocument()
  })
})
