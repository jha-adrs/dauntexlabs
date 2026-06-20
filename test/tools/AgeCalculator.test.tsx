import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AgeCalculator from '@/components/tools/AgeCalculator'

function setDob(value: string) {
  fireEvent.change(screen.getByLabelText('Date of birth'), { target: { value } })
}

function setAsOf(value: string) {
  fireEvent.change(screen.getByLabelText('Age at date'), { target: { value } })
}

describe('AgeCalculator', () => {
  it('shows 20 years, 0 months, 0 days for DOB 2000-01-01 as-of 2020-01-01', () => {
    render(<AgeCalculator />)
    setDob('2000-01-01')
    setAsOf('2020-01-01')
    expect(screen.getByText('20')).toBeInTheDocument()
    // All three primary cells (years=20, months=0, days=0)
    const cells = screen.getAllByText('0')
    expect(cells.length).toBeGreaterThanOrEqual(2)
  })

  it('shows 0 years, 1 month, 24 days for DOB 2000-01-15 as-of 2000-03-10', () => {
    render(<AgeCalculator />)
    setDob('2000-01-15')
    setAsOf('2000-03-10')
    // Years = 0, Months = 1, Days = 24
    // There may be multiple "1" elements; verify at least one exists
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('24')).toBeInTheDocument()
  })

  it('shows correct total days for DOB 2000-01-01 as-of 2020-01-01 (7305 days)', () => {
    render(<AgeCalculator />)
    setDob('2000-01-01')
    setAsOf('2020-01-01')
    // 20 years including 5 leap years (2000,2004,2008,2012,2016) → 7305 days
    expect(screen.getByText('7,305')).toBeInTheDocument()
  })

  it('shows error when DOB is after the as-of date', () => {
    render(<AgeCalculator />)
    setDob('2025-06-01')
    setAsOf('2020-01-01')
    expect(screen.getByText(/Date of birth must be on or before/i)).toBeInTheDocument()
  })

  it('shows no result when no DOB is entered', () => {
    render(<AgeCalculator />)
    setAsOf('2020-01-01')
    expect(screen.queryByText(/Years/i)).not.toBeInTheDocument()
  })

  it('handles same DOB and as-of date (age = 0)', () => {
    render(<AgeCalculator />)
    setDob('2000-06-15')
    setAsOf('2000-06-15')
    // All three primary values should be 0
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(3)
  })

  it('handles leap day birthday (2000-02-29) as-of 2004-02-29', () => {
    render(<AgeCalculator />)
    setDob('2000-02-29')
    setAsOf('2004-02-29')
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('shows total weeks for 2000-01-01 to 2020-01-01', () => {
    render(<AgeCalculator />)
    setDob('2000-01-01')
    setAsOf('2020-01-01')
    // 7305 / 7 = 1043 weeks
    expect(screen.getByText('1,043')).toBeInTheDocument()
  })
})
