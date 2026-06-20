import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SalesTaxCalculator from '@/components/tools/SalesTaxCalculator'

describe('SalesTaxCalculator', () => {
  // --- Add tax mode ---

  it('adds 20% tax to 100 to give gross 120 and tax 20', () => {
    render(<SalesTaxCalculator />)
    // default mode is "Add tax"
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 20'), { target: { value: '20' } })

    expect(screen.getByTestId('result-net').textContent).toContain('100.00')
    expect(screen.getByTestId('result-tax').textContent).toContain('20.00')
    expect(screen.getByTestId('result-gross').textContent).toContain('120.00')
  })

  it('handles 0% tax rate correctly', () => {
    render(<SalesTaxCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '250' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 20'), { target: { value: '0' } })

    expect(screen.getByTestId('result-tax').textContent).toContain('0.00')
    expect(screen.getByTestId('result-gross').textContent).toContain('250.00')
  })

  it('computes 10% tax on 50 correctly', () => {
    render(<SalesTaxCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '50' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 20'), { target: { value: '10' } })

    expect(screen.getByTestId('result-tax').textContent).toContain('5.00')
    expect(screen.getByTestId('result-gross').textContent).toContain('55.00')
  })

  // --- Extract tax mode ---

  it('extracts 20% tax from gross 120 to give net 100 and tax 20', () => {
    render(<SalesTaxCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Extract tax' }))

    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '120' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 20'), { target: { value: '20' } })

    expect(screen.getByTestId('result-net').textContent).toContain('100.00')
    expect(screen.getByTestId('result-tax').textContent).toContain('20.00')
    expect(screen.getByTestId('result-gross').textContent).toContain('120.00')
  })

  it('extracts 10% tax from 110 correctly', () => {
    render(<SalesTaxCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Extract tax' }))

    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '110' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 20'), { target: { value: '10' } })

    expect(screen.getByTestId('result-net').textContent).toContain('100.00')
    expect(screen.getByTestId('result-tax').textContent).toContain('10.00')
  })

  // --- Validation ---

  it('shows error for negative amount', () => {
    render(<SalesTaxCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '-10' } })
    expect(screen.getByText(/non-negative/i)).toBeInTheDocument()
  })

  it('shows error for negative rate', () => {
    render(<SalesTaxCalculator />)
    // type="number" in jsdom sanitizes non-numeric strings to ''; use a real negative value
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 20'), { target: { value: '-5' } })
    expect(screen.getByText(/valid non-negative/i)).toBeInTheDocument()
  })

  it('shows no result for empty inputs', () => {
    render(<SalesTaxCalculator />)
    expect(screen.getByText(/Enter values/i)).toBeInTheDocument()
  })

  it('shows error when extract rate >= 100', () => {
    render(<SalesTaxCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Extract tax' }))
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 20'), { target: { value: '100' } })
    expect(screen.getByText(/less than 100%/i)).toBeInTheDocument()
  })
})
