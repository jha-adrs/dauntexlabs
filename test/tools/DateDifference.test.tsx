import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DateDifference from '@/components/tools/DateDifference'

function setStart(value: string) {
  fireEvent.change(screen.getByLabelText('Start date'), { target: { value } })
}

function setEnd(value: string) {
  fireEvent.change(screen.getByLabelText('End date'), { target: { value } })
}

describe('DateDifference', () => {
  it('2020-01-01 to 2020-01-31 = 30 days', () => {
    render(<DateDifference />)
    setStart('2020-01-01')
    setEnd('2020-01-31')
    // The aria-label on the big number
    expect(screen.getByLabelText('30 total days')).toBeInTheDocument()
  })

  it('2020-01-01 to 2021-01-01 = 366 days (2020 is a leap year)', () => {
    render(<DateDifference />)
    setStart('2020-01-01')
    setEnd('2021-01-01')
    expect(screen.getByLabelText('366 total days')).toBeInTheDocument()
  })

  it('shows 0 days when start and end are the same', () => {
    render(<DateDifference />)
    setStart('2023-03-15')
    setEnd('2023-03-15')
    expect(screen.getByLabelText('0 total days')).toBeInTheDocument()
  })

  it('is symmetric: end < start still gives absolute difference', () => {
    render(<DateDifference />)
    setStart('2020-01-31')
    setEnd('2020-01-01')
    expect(screen.getByLabelText('30 total days')).toBeInTheDocument()
  })

  it('shows weeks breakdown for 30 days: 4 wk + 2 d', () => {
    render(<DateDifference />)
    setStart('2020-01-01')
    setEnd('2020-01-31')
    expect(screen.getByText(/4 wk \+ 2 d/)).toBeInTheDocument()
  })

  it('shows 0 result when no dates entered', () => {
    render(<DateDifference />)
    expect(screen.queryByLabelText(/total days/)).not.toBeInTheDocument()
  })

  it('shows error when only start is entered', () => {
    render(<DateDifference />)
    setStart('2020-01-01')
    expect(screen.getByText(/Enter an end date/i)).toBeInTheDocument()
  })

  it('2019-03-01 to 2020-03-01 = 366 days (includes Feb 29 2020)', () => {
    render(<DateDifference />)
    setStart('2019-03-01')
    setEnd('2020-03-01')
    expect(screen.getByLabelText('366 total days')).toBeInTheDocument()
  })

  it('shows years/months/days breakdown: 1y 0m 0d for full year', () => {
    render(<DateDifference />)
    setStart('2020-01-01')
    setEnd('2021-01-01')
    expect(screen.getByText(/1y 0m 0d/)).toBeInTheDocument()
  })
})
