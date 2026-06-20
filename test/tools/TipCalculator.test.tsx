import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TipCalculator from '@/components/tools/TipCalculator'

describe('TipCalculator', () => {
  it('shows info notice before any bill input', () => {
    render(<TipCalculator />)
    expect(screen.getByText(/Enter a bill amount/i)).toBeInTheDocument()
  })

  it('computes tip amount $18.00 for bill $100 at 18%', () => {
    render(<TipCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '100' } })
    // tip % defaults to 18, so tip = 18
    expect(screen.getByText('$18.00')).toBeInTheDocument()
  })

  it('computes total $118.00 for bill $100 at 18%', () => {
    render(<TipCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '100' } })
    expect(screen.getByText('$118.00')).toBeInTheDocument()
  })

  it('computes per-person total $29.50 for bill $100, 18%, split 4', () => {
    render(<TipCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 4'), { target: { value: '4' } })
    expect(screen.getByText('$29.50')).toBeInTheDocument()
  })

  it('computes per-person tip $4.50 for bill $100, 18%, split 4', () => {
    render(<TipCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 4'), { target: { value: '4' } })
    expect(screen.getByText('$4.50')).toBeInTheDocument()
  })

  it('preset buttons change tip percentage', () => {
    render(<TipCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '200' } })
    fireEvent.click(screen.getByRole('button', { name: '20%' }))
    // tip = 200 * 0.20 = 40
    expect(screen.getByText('$40.00')).toBeInTheDocument()
  })

  it('preset 10% computes correct tip', () => {
    render(<TipCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: '10%' }))
    expect(screen.getByText('$5.00')).toBeInTheDocument()
  })

  it('preset 15% computes correct tip', () => {
    render(<TipCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: '15%' }))
    expect(screen.getByText('$15.00')).toBeInTheDocument()
  })

  it('does not show per-person breakdown for single person', () => {
    render(<TipCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '100' } })
    // numPeople defaults to 1, per-person cards should not render
    expect(screen.queryByText(/total each/i)).not.toBeInTheDocument()
  })

  it('shows error for negative bill amount', () => {
    render(<TipCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '-50' } })
    expect(screen.getByText(/cannot be negative/i)).toBeInTheDocument()
  })

  it('shows error for zero people', () => {
    render(<TipCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 4'), { target: { value: '0' } })
    expect(screen.getByText(/at least 1/i)).toBeInTheDocument()
  })
})
