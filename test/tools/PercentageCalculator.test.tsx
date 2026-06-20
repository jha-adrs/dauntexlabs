import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PercentageCalculator from '@/components/tools/PercentageCalculator'

describe('PercentageCalculator', () => {
  function setup() {
    render(<PercentageCalculator />)
  }

  // Helper: get inputs (there are always exactly 2)
  function getInputs() {
    return screen.getAllByRole('spinbutton') as HTMLInputElement[]
  }

  it('default mode "X% of Y": 25% of 200 = 50', () => {
    setup()
    const [a, b] = getInputs()
    fireEvent.change(a, { target: { value: '25' } })
    fireEvent.change(b, { target: { value: '200' } })

    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('mode "X is what % of Y": 50 is 25% of 200', () => {
    setup()
    fireEvent.click(screen.getByRole('tab', { name: 'X is what % of Y' }))
    const [a, b] = getInputs()
    fireEvent.change(a, { target: { value: '50' } })
    fireEvent.change(b, { target: { value: '200' } })

    // Result = +25%
    expect(screen.getByText('+25%')).toBeInTheDocument()
  })

  it('mode "% change A→B": 100 → 150 = +50%', () => {
    setup()
    fireEvent.click(screen.getByRole('tab', { name: '% change A→B' }))
    const [a, b] = getInputs()
    fireEvent.change(a, { target: { value: '100' } })
    fireEvent.change(b, { target: { value: '150' } })

    expect(screen.getByText('+50%')).toBeInTheDocument()
  })

  it('mode "% change A→B": 200 → 100 = -50%', () => {
    setup()
    fireEvent.click(screen.getByRole('tab', { name: '% change A→B' }))
    const [a, b] = getInputs()
    fireEvent.change(a, { target: { value: '200' } })
    fireEvent.change(b, { target: { value: '100' } })

    expect(screen.getByText('-50%')).toBeInTheDocument()
  })

  it('mode "Inc / Dec Y by X%": increase 200 by 10% = 220', () => {
    setup()
    fireEvent.click(screen.getByRole('tab', { name: 'Inc / Dec Y by X%' }))
    const [a, b] = getInputs()
    fireEvent.change(a, { target: { value: '200' } })
    fireEvent.change(b, { target: { value: '10' } })

    expect(screen.getByText('220')).toBeInTheDocument()
  })

  it('mode "Inc / Dec Y by X%": decrease 200 by 25% = 150', () => {
    setup()
    fireEvent.click(screen.getByRole('tab', { name: 'Inc / Dec Y by X%' }))
    const [a, b] = getInputs()
    fireEvent.change(a, { target: { value: '200' } })
    fireEvent.change(b, { target: { value: '-25' } })

    expect(screen.getByText('150')).toBeInTheDocument()
  })

  it('shows error when "X is what % of Y" denominator is 0', () => {
    setup()
    fireEvent.click(screen.getByRole('tab', { name: 'X is what % of Y' }))
    const [a, b] = getInputs()
    fireEvent.change(a, { target: { value: '50' } })
    fireEvent.change(b, { target: { value: '0' } })

    expect(screen.getByText(/cannot be zero/i)).toBeInTheDocument()
  })

  it('shows error when "% change A→B" from value is 0', () => {
    setup()
    fireEvent.click(screen.getByRole('tab', { name: '% change A→B' }))
    const [a, b] = getInputs()
    fireEvent.change(a, { target: { value: '0' } })
    fireEvent.change(b, { target: { value: '100' } })

    expect(screen.getByText(/cannot be zero/i)).toBeInTheDocument()
  })

  it('returns nothing for empty inputs', () => {
    setup()
    // Default state has pre-filled values; clear both
    const [a, b] = getInputs()
    fireEvent.change(a, { target: { value: '' } })
    fireEvent.change(b, { target: { value: '' } })

    expect(screen.queryByLabelText('result')).not.toBeInTheDocument()
  })

  it('handles fractional percentages: 12.5% of 80 = 10', () => {
    setup()
    const [a, b] = getInputs()
    fireEvent.change(a, { target: { value: '12.5' } })
    fireEvent.change(b, { target: { value: '80' } })

    expect(screen.getByText('10')).toBeInTheDocument()
  })
})
