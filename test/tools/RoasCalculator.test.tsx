import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RoasCalculator from '@/components/tools/RoasCalculator'

describe('RoasCalculator', () => {
  it('calculates ROAS: revenue $5000 / spend $1000 = 5x (500%)', () => {
    render(<RoasCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 5000'), { target: { value: '5000' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '1000' } })
    expect(screen.getByText('5.00x')).toBeInTheDocument()
    expect(screen.getByText('500.00%')).toBeInTheDocument()
  })

  it('calculates net profit: $5000 revenue - $1000 spend = $4000', () => {
    render(<RoasCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 5000'), { target: { value: '5000' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '1000' } })
    expect(screen.getByText('$4,000.00')).toBeInTheDocument()
  })

  it('calculates break-even ROAS (revenue equals spend)', () => {
    render(<RoasCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 5000'), { target: { value: '500' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '500' } })
    expect(screen.getByText('1.00x')).toBeInTheDocument()
    expect(screen.getByText('100.00%')).toBeInTheDocument()
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('shows negative net profit color when revenue < spend', () => {
    render(<RoasCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 5000'), { target: { value: '200' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '500' } })
    expect(screen.getByText('-$300.00')).toBeInTheDocument()
  })

  it('shows error when spend is zero', () => {
    render(<RoasCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 5000'), { target: { value: '5000' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '0' } })
    expect(screen.getByText(/Ad spend must be greater than zero/i)).toBeInTheDocument()
  })

  it('shows error for invalid inputs', () => {
    render(<RoasCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 5000'), { target: { value: 'abc' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '1000' } })
    expect(screen.getByText(/Enter valid numbers/i)).toBeInTheDocument()
  })

  it('shows info notice when inputs are empty', () => {
    render(<RoasCalculator />)
    expect(screen.getByText(/Enter revenue and ad spend/i)).toBeInTheDocument()
  })
})
