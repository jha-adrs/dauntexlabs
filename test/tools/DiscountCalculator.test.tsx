import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DiscountCalculator from '@/components/tools/DiscountCalculator'

describe('DiscountCalculator', () => {
  // --- Percent off mode ---

  it('computes 25% off 200 → final 150, saved 50', () => {
    render(<DiscountCalculator />)
    // default mode is "Percent off"
    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '200' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 25'), { target: { value: '25' } })

    expect(screen.getByTestId('result-final').textContent).toContain('150.00')
    expect(screen.getByTestId('result-saved').textContent).toContain('50.00')
    expect(screen.getByTestId('result-effective-pct').textContent).toBe('25.00%')
  })

  it('computes 50% off 80 → final 40, saved 40', () => {
    render(<DiscountCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '80' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 25'), { target: { value: '50' } })

    expect(screen.getByTestId('result-final').textContent).toContain('40.00')
    expect(screen.getByTestId('result-saved').textContent).toContain('40.00')
  })

  it('computes 0% off → final equals original, saved 0', () => {
    render(<DiscountCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 25'), { target: { value: '0' } })

    expect(screen.getByTestId('result-final').textContent).toContain('100.00')
    expect(screen.getByTestId('result-saved').textContent).toContain('0.00')
  })

  it('shows error for percent > 100', () => {
    render(<DiscountCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 25'), { target: { value: '150' } })
    expect(screen.getByText(/between 0 and 100/i)).toBeInTheDocument()
  })

  // --- Amount off mode ---

  it('computes 50 off 200 → final 150, effective 25%', () => {
    render(<DiscountCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Amount off' }))

    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '200' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 50'), { target: { value: '50' } })

    expect(screen.getByTestId('result-final').textContent).toContain('150.00')
    expect(screen.getByTestId('result-saved').textContent).toContain('50.00')
    expect(screen.getByTestId('result-effective-pct').textContent).toBe('25.00%')
  })

  it('shows error when discount amount exceeds original price', () => {
    render(<DiscountCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Amount off' }))

    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 50'), { target: { value: '150' } })

    expect(screen.getByText(/cannot exceed/i)).toBeInTheDocument()
  })

  // --- Find % off mode ---

  it('finds 25% off when original=200 and final=150', () => {
    render(<DiscountCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Find % off' }))

    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '200' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 150'), { target: { value: '150' } })

    expect(screen.getByTestId('result-discount-pct').textContent).toBe('25.00%')
    expect(screen.getByTestId('result-saved').textContent).toContain('50.00')
    expect(screen.getByTestId('result-final').textContent).toContain('150.00')
  })

  it('finds 0% off when final equals original', () => {
    render(<DiscountCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Find % off' }))

    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 150'), { target: { value: '100' } })

    expect(screen.getByTestId('result-discount-pct').textContent).toBe('0.00%')
    expect(screen.getByTestId('result-saved').textContent).toContain('0.00')
  })

  it('shows error when final price exceeds original', () => {
    render(<DiscountCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Find % off' }))

    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 150'), { target: { value: '200' } })

    expect(screen.getByText(/cannot exceed/i)).toBeInTheDocument()
  })

  // --- Shared validation ---

  it('shows no result for empty inputs', () => {
    render(<DiscountCalculator />)
    expect(screen.getByText(/Enter values/i)).toBeInTheDocument()
  })

  it('shows error for non-positive original price', () => {
    render(<DiscountCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), { target: { value: '0' } })
    expect(screen.getByText(/valid positive/i)).toBeInTheDocument()
  })
})
