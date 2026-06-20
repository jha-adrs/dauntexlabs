import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DateCalculator from '@/components/tools/DateCalculator'

function setStart(value: string) {
  fireEvent.change(screen.getByLabelText('Start date'), { target: { value } })
}

function setAmount(value: string) {
  fireEvent.change(screen.getByPlaceholderText('1'), { target: { value } })
}

function setUnit(value: string) {
  fireEvent.change(screen.getByDisplayValue('Days'), { target: { value } })
}

function clickOp(label: 'Add' | 'Subtract') {
  fireEvent.click(screen.getByRole('tab', { name: label }))
}

describe('DateCalculator', () => {
  it('2020-01-01 + 30 days = 2020-01-31', () => {
    render(<DateCalculator />)
    setStart('2020-01-01')
    setAmount('30')
    // unit defaults to days
    expect(screen.getByText('2020-01-31')).toBeInTheDocument()
    expect(screen.getByText('Friday')).toBeInTheDocument()
  })

  it('2020-01-31 + 1 month = 2020-02-29 (clamp to leap Feb)', () => {
    render(<DateCalculator />)
    setStart('2020-01-31')
    setAmount('1')
    setUnit('months')
    expect(screen.getByText('2020-02-29')).toBeInTheDocument()
    expect(screen.getByText('Saturday')).toBeInTheDocument()
  })

  it('2020-01-01 subtract 1 day = 2019-12-31', () => {
    render(<DateCalculator />)
    setStart('2020-01-01')
    setAmount('1')
    clickOp('Subtract')
    expect(screen.getByText('2019-12-31')).toBeInTheDocument()
    expect(screen.getByText('Tuesday')).toBeInTheDocument()
  })

  it('2020-01-01 + 1 year = 2021-01-01', () => {
    render(<DateCalculator />)
    setStart('2020-01-01')
    setAmount('1')
    setUnit('years')
    expect(screen.getByText('2021-01-01')).toBeInTheDocument()
    expect(screen.getByText('Friday')).toBeInTheDocument()
  })

  it('2020-02-29 + 1 year = 2021-02-28 (clamp non-leap)', () => {
    render(<DateCalculator />)
    setStart('2020-02-29')
    setAmount('1')
    setUnit('years')
    expect(screen.getByText('2021-02-28')).toBeInTheDocument()
    expect(screen.getByText('Sunday')).toBeInTheDocument()
  })

  it('2020-01-01 + 2 weeks = 2020-01-15', () => {
    render(<DateCalculator />)
    setStart('2020-01-01')
    setAmount('2')
    setUnit('weeks')
    expect(screen.getByText('2020-01-15')).toBeInTheDocument()
    expect(screen.getByText('Wednesday')).toBeInTheDocument()
  })

  it('shows error when no start date entered', () => {
    render(<DateCalculator />)
    setAmount('5')
    expect(screen.getByText(/Enter a start date/i)).toBeInTheDocument()
  })

  it('2020-03-31 + 1 month = 2020-04-30 (clamp 30-day April)', () => {
    render(<DateCalculator />)
    setStart('2020-03-31')
    setAmount('1')
    setUnit('months')
    expect(screen.getByText('2020-04-30')).toBeInTheDocument()
    expect(screen.getByText('Thursday')).toBeInTheDocument()
  })

  it('subtract 0 days returns same date', () => {
    render(<DateCalculator />)
    setStart('2023-06-15')
    setAmount('0')
    clickOp('Subtract')
    expect(screen.getByText('2023-06-15')).toBeInTheDocument()
    expect(screen.getByText('Thursday')).toBeInTheDocument()
  })
})
