import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConversionRateCalculator from '@/components/tools/ConversionRateCalculator'

describe('ConversionRateCalculator', () => {
  it('calculates rate correctly: 25 conversions / 500 visits = 5%', () => {
    render(<ConversionRateCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 25'), { target: { value: '25' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 500'), { target: { value: '500' } })
    expect(screen.getByText('5.00%')).toBeInTheDocument()
  })

  it('calculates fractional rate: 3 conversions / 300 visits = 1%', () => {
    render(<ConversionRateCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 25'), { target: { value: '3' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 500'), { target: { value: '300' } })
    expect(screen.getByText('1.00%')).toBeInTheDocument()
  })

  it('shows error when visits is zero', () => {
    render(<ConversionRateCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 25'), { target: { value: '10' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 500'), { target: { value: '0' } })
    expect(screen.getByText(/Visits must be greater than zero/i)).toBeInTheDocument()
  })

  it('shows error when conversions exceed visits', () => {
    render(<ConversionRateCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 25'), { target: { value: '600' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 500'), { target: { value: '500' } })
    expect(screen.getByText(/Conversions cannot exceed total visits/i)).toBeInTheDocument()
  })

  it('shows info notice when inputs are empty', () => {
    render(<ConversionRateCalculator />)
    expect(screen.getByText(/Enter conversions and total visits/i)).toBeInTheDocument()
  })

  it('handles 100% conversion rate edge case', () => {
    render(<ConversionRateCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 25'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 500'), { target: { value: '100' } })
    expect(screen.getByText('100.00%')).toBeInTheDocument()
  })
})
