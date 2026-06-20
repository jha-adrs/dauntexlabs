import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BreakEvenCalculator from '@/components/tools/BreakEvenCalculator'

function fillInputs(fixed: string, price: string, varCost: string) {
  fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: fixed } })
  fireEvent.change(screen.getByPlaceholderText('e.g. 10'), { target: { value: price } })
  fireEvent.change(screen.getByPlaceholderText('e.g. 5'), { target: { value: varCost } })
}

describe('BreakEvenCalculator', () => {
  it('shows info notice before any input', () => {
    render(<BreakEvenCalculator />)
    expect(screen.getByText(/Enter fixed costs/i)).toBeInTheDocument()
  })

  it('computes break-even units (fixed 1000, price 10, varCost 5 → 200 units)', () => {
    render(<BreakEvenCalculator />)
    fillInputs('1000', '10', '5')
    expect(screen.getByText('200')).toBeInTheDocument()
  })

  it('computes break-even revenue ($2,000)', () => {
    render(<BreakEvenCalculator />)
    fillInputs('1000', '10', '5')
    expect(screen.getByText('$2,000.00')).toBeInTheDocument()
  })

  it('computes contribution margin ($5.00)', () => {
    render(<BreakEvenCalculator />)
    fillInputs('1000', '10', '5')
    expect(screen.getByText('$5.00')).toBeInTheDocument()
  })

  it('computes contribution margin percentage (50.00%)', () => {
    render(<BreakEvenCalculator />)
    fillInputs('1000', '10', '5')
    expect(screen.getByText('50.00%')).toBeInTheDocument()
  })

  it('shows error when price equals variable cost', () => {
    render(<BreakEvenCalculator />)
    fillInputs('1000', '5', '5')
    expect(screen.getByText(/contribution margin must be positive/i)).toBeInTheDocument()
  })

  it('shows error when price is less than variable cost', () => {
    render(<BreakEvenCalculator />)
    fillInputs('1000', '3', '5')
    expect(screen.getByText(/contribution margin must be positive/i)).toBeInTheDocument()
  })

  it('rounds up break-even units (non-integer result)', () => {
    render(<BreakEvenCalculator />)
    // fixed 100, price 10, varCost 7 → contribution 3 → 100/3 = 33.33... → ceil = 34
    fillInputs('100', '10', '7')
    expect(screen.getByText('34')).toBeInTheDocument()
  })

  it('shows error for invalid (non-numeric) input', () => {
    render(<BreakEvenCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: 'abc' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 10'), { target: { value: '10' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 5'), { target: { value: '5' } })
    expect(screen.getByText(/valid numbers/i)).toBeInTheDocument()
  })
})
