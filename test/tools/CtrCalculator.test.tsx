import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CtrCalculator from '@/components/tools/CtrCalculator'

describe('CtrCalculator', () => {
  it('calculates CTR correctly: 50 clicks / 1000 impressions = 5%', () => {
    render(<CtrCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 50'), { target: { value: '50' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '1000' } })
    expect(screen.getByText('5.00%')).toBeInTheDocument()
  })

  it('calculates fractional CTR: 1 click / 400 impressions = 0.25%', () => {
    render(<CtrCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 50'), { target: { value: '1' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '400' } })
    expect(screen.getByText('0.25%')).toBeInTheDocument()
  })

  it('shows error when impressions is zero', () => {
    render(<CtrCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 50'), { target: { value: '10' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '0' } })
    expect(screen.getByText(/Impressions must be greater than zero/i)).toBeInTheDocument()
  })

  it('shows error when clicks exceed impressions', () => {
    render(<CtrCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 50'), { target: { value: '200' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '100' } })
    expect(screen.getByText(/Clicks cannot exceed impressions/i)).toBeInTheDocument()
  })

  it('shows info notice when inputs are empty', () => {
    render(<CtrCalculator />)
    expect(screen.getByText(/Enter clicks and impressions/i)).toBeInTheDocument()
  })

  it('solve mode: calculates clicks needed for 5% CTR over 10000 impressions', () => {
    render(<CtrCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Solve for Clicks' }))
    fireEvent.change(screen.getByPlaceholderText('e.g. 5'), { target: { value: '5' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 10000'), { target: { value: '10000' } })
    expect(screen.getByText('500')).toBeInTheDocument()
  })

  it('solve mode: shows error for invalid CTR (0%)', () => {
    render(<CtrCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Solve for Clicks' }))
    fireEvent.change(screen.getByPlaceholderText('e.g. 5'), { target: { value: '0' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 10000'), { target: { value: '10000' } })
    expect(screen.getByText(/Target CTR must be between 0 and 100/i)).toBeInTheDocument()
  })
})
