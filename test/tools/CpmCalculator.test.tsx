import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CpmCalculator from '@/components/tools/CpmCalculator'

describe('CpmCalculator', () => {
  it('calculates CPM: spend $200 / 50000 impressions = $4.00', () => {
    render(<CpmCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '200' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 50000'), { target: { value: '50000' } })
    expect(screen.getByText('$4.00')).toBeInTheDocument()
    expect(screen.getByText('cost per 1,000 impressions')).toBeInTheDocument()
  })

  it('calculates CPC: spend $200 / 100 clicks = $2.00', () => {
    render(<CpmCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '200' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '100' } })
    expect(screen.getByText('$2.00')).toBeInTheDocument()
    expect(screen.getByText('cost per click')).toBeInTheDocument()
  })

  it('calculates CPA: spend $200 / 20 conversions = $10.00', () => {
    render(<CpmCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '200' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 20'), { target: { value: '20' } })
    expect(screen.getByText('$10.00')).toBeInTheDocument()
    expect(screen.getByText('cost per acquisition / conversion')).toBeInTheDocument()
  })

  it('calculates all three metrics simultaneously', () => {
    render(<CpmCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '200' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 50000'), { target: { value: '50000' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 20'), { target: { value: '20' } })
    expect(screen.getByText('cost per 1,000 impressions')).toBeInTheDocument()
    expect(screen.getByText('cost per click')).toBeInTheDocument()
    expect(screen.getByText('cost per acquisition / conversion')).toBeInTheDocument()
  })

  it('shows error when only spend is provided (no denominators)', () => {
    render(<CpmCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '200' } })
    expect(screen.getByText(/Enter at least one of/i)).toBeInTheDocument()
  })

  it('shows error for non-positive spend', () => {
    render(<CpmCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '0' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 50000'), { target: { value: '50000' } })
    expect(screen.getByText(/Ad spend must be a positive number/i)).toBeInTheDocument()
  })

  it('shows info notice when all inputs are empty', () => {
    render(<CpmCalculator />)
    expect(screen.getByText(/Enter ad spend plus at least one/i)).toBeInTheDocument()
  })
})
