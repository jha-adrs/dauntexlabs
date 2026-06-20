import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RoiCalculator from '@/components/tools/RoiCalculator'

describe('RoiCalculator — ROI mode', () => {
  it('shows info notice before any ROI input', () => {
    render(<RoiCalculator />)
    expect(screen.getByText(/Enter the amount invested/i)).toBeInTheDocument()
  })

  it('computes ROI 50% for invest 1000 → 1500', () => {
    render(<RoiCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '1000' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 1500'), { target: { value: '1500' } })
    expect(screen.getByText('50.00%')).toBeInTheDocument()
  })

  it('computes net profit $500 for invest 1000 → 1500', () => {
    render(<RoiCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '1000' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 1500'), { target: { value: '1500' } })
    expect(screen.getByText('$500.00')).toBeInTheDocument()
  })

  it('shows negative ROI for a loss', () => {
    render(<RoiCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '1000' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 1500'), { target: { value: '800' } })
    expect(screen.getByText('-20.00%')).toBeInTheDocument()
  })

  it('shows error when invested is zero', () => {
    render(<RoiCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '0' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 1500'), { target: { value: '1500' } })
    expect(screen.getByText(/greater than zero/i)).toBeInTheDocument()
  })
})

describe('RoiCalculator — CAGR mode', () => {
  function switchToCagr() {
    fireEvent.click(screen.getByRole('tab', { name: 'CAGR' }))
  }

  it('shows info notice before any CAGR input', () => {
    render(<RoiCalculator />)
    switchToCagr()
    expect(screen.getByText(/Enter beginning value/i)).toBeInTheDocument()
  })

  it('computes CAGR ≈ 25.99% for begin 1000, end 2000, 3 years', () => {
    render(<RoiCalculator />)
    switchToCagr()
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '1000' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 2000'), { target: { value: '2000' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 3'), { target: { value: '3' } })
    // (2000/1000)^(1/3) - 1 = 2^(1/3) - 1 ≈ 0.2599... → 25.99%
    expect(screen.getByText('25.99%')).toBeInTheDocument()
  })

  it('computes CAGR 0% for flat growth', () => {
    render(<RoiCalculator />)
    switchToCagr()
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '1000' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 2000'), { target: { value: '1000' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 3'), { target: { value: '5' } })
    expect(screen.getByText('0.00%')).toBeInTheDocument()
  })

  it('shows error when years is zero', () => {
    render(<RoiCalculator />)
    switchToCagr()
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '1000' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 2000'), { target: { value: '2000' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 3'), { target: { value: '0' } })
    expect(screen.getByText(/greater than zero/i)).toBeInTheDocument()
  })

  it('shows error when beginning value is zero', () => {
    render(<RoiCalculator />)
    switchToCagr()
    fireEvent.change(screen.getByPlaceholderText('e.g. 1000'), { target: { value: '0' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 2000'), { target: { value: '2000' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 3'), { target: { value: '3' } })
    expect(screen.getByText(/greater than zero/i)).toBeInTheDocument()
  })
})
