import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MarginCalculator from '@/components/tools/MarginCalculator'

describe('MarginCalculator', () => {
  // --- Cost + Price mode ---

  it('computes profit, margin %, and markup % from cost and price', () => {
    render(<MarginCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 80'), { target: { value: '80' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '100' } })

    expect(screen.getByTestId('result-profit').textContent).toContain('20.00')
    expect(screen.getByTestId('result-margin').textContent).toBe('20.00%')
    expect(screen.getByTestId('result-markup').textContent).toBe('25.00%')
    expect(screen.getByTestId('result-price').textContent).toContain('100.00')
  })

  it('shows zero profit when cost equals price', () => {
    render(<MarginCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 80'), { target: { value: '50' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '50' } })

    expect(screen.getByTestId('result-profit').textContent).toContain('0.00')
    expect(screen.getByTestId('result-margin').textContent).toBe('0.00%')
    expect(screen.getByTestId('result-markup').textContent).toBe('0.00%')
  })

  it('computes negative profit (loss) when price < cost', () => {
    render(<MarginCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 80'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '80' } })

    // Intl.NumberFormat formats -20 as "-$20.00"; profit is negative
    const profitText = screen.getByTestId('result-profit').textContent ?? ''
    expect(parseFloat(profitText.replace(/[^0-9.\-]/g, ''))).toBeLessThan(0)
  })

  it('shows error for invalid selling price', () => {
    render(<MarginCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 80'), { target: { value: '80' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 100'), { target: { value: '0' } })

    expect(screen.getByText(/greater than zero/i)).toBeInTheDocument()
  })

  // --- Cost + Margin % mode ---

  it('derives price from cost and desired margin %', () => {
    render(<MarginCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Cost + Margin %' }))

    fireEvent.change(screen.getByPlaceholderText('e.g. 80'), { target: { value: '80' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 20'), { target: { value: '20' } })

    // price = 80 / (1 - 0.20) = 100
    expect(screen.getByTestId('result-price').textContent).toContain('100.00')
    expect(screen.getByTestId('result-profit').textContent).toContain('20.00')
    expect(screen.getByTestId('result-margin').textContent).toBe('20.00%')
    expect(screen.getByTestId('result-markup').textContent).toBe('25.00%')
  })

  it('shows error for margin >= 100', () => {
    render(<MarginCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Cost + Margin %' }))

    fireEvent.change(screen.getByPlaceholderText('e.g. 80'), { target: { value: '80' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 20'), { target: { value: '100' } })

    expect(screen.getByText(/between 0%/i)).toBeInTheDocument()
  })

  it('shows no result for empty inputs', () => {
    render(<MarginCalculator />)
    expect(screen.getByText(/Enter values/i)).toBeInTheDocument()
  })

  it('shows error for negative cost', () => {
    render(<MarginCalculator />)
    // type="number" inputs in jsdom sanitize non-numeric strings to ''; use a real negative number
    fireEvent.change(screen.getByPlaceholderText('e.g. 80'), { target: { value: '-5' } })
    expect(screen.getByText(/valid non-negative/i)).toBeInTheDocument()
  })
})
