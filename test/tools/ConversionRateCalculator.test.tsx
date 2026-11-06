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

describe('ConversionRateCalculator upgrades', () => {
  const type = (ph: string, v: string) => fireEvent.change(screen.getByPlaceholderText(ph), { target: { value: v } })
  it('AOV gives revenue and revenue per visitor in the chosen currency', () => {
    render(<ConversionRateCalculator />)
    type('e.g. 25', '25'); type('e.g. 500', '500'); type('e.g. 40', '40')
    expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    expect(screen.getByText('$2.00')).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('USD ($)'), { target: { value: 'INR' } })
    expect(screen.getByText('₹1,000.00')).toBeInTheDocument()
  })
  it('hides revenue cards without an AOV', () => {
    render(<ConversionRateCalculator />)
    type('e.g. 25', '25'); type('e.g. 500', '500')
    expect(screen.queryByText('Revenue per visitor')).not.toBeInTheDocument()
  })
  it('visits needed mode', () => {
    render(<ConversionRateCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Visits needed' }))
    type('e.g. 50', '50'); type('e.g. 2.5', '2.5')
    expect(screen.getByText('2,000')).toBeInTheDocument()
    expect(screen.getByText('visits needed')).toBeInTheDocument()
  })
  it('conversions needed mode', () => {
    render(<ConversionRateCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Conversions needed' }))
    type('e.g. 2000', '2000'); type('e.g. 2.5', '2.5')
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('conversions needed')).toBeInTheDocument()
  })
  it('switching solver modes with only the rate filled shows the prompt, not an error', () => {
    render(<ConversionRateCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Visits needed' }))
    type('e.g. 50', '50'); type('e.g. 2.5', '2.5')
    fireEvent.click(screen.getByRole('tab', { name: 'Conversions needed' }))
    expect(screen.queryByText('Enter valid numbers.')).not.toBeInTheDocument()
    expect(screen.getByText(/Enter visits and a conversion rate/)).toBeInTheDocument()
  })
  it('a zero target renders 0 visits, not -0', () => {
    render(<ConversionRateCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Visits needed' }))
    type('e.g. 50', '0'); type('e.g. 2.5', '2.5')
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByText('-0')).not.toBeInTheDocument()
  })
  it('rate mode waits for both fields before showing an error', () => {
    render(<ConversionRateCalculator />)
    type('e.g. 25', '25')
    expect(screen.queryByText(/Enter valid numbers/)).not.toBeInTheDocument()
    expect(screen.getByText(/Enter conversions and total visits/)).toBeInTheDocument()
  })
  it('solver waits for the rate before showing an error', () => {
    render(<ConversionRateCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Visits needed' }))
    type('e.g. 50', '50')
    expect(screen.queryByText(/Enter valid numbers/)).not.toBeInTheDocument()
  })
  it('solver shows the rate error', () => {
    render(<ConversionRateCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Visits needed' }))
    type('e.g. 50', '50'); type('e.g. 2.5', '0')
    expect(screen.getByText(/greater than 0% and at most 100%/)).toBeInTheDocument()
  })
})
