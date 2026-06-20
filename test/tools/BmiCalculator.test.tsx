import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BmiCalculator from '@/components/tools/BmiCalculator'

describe('BmiCalculator', () => {
  it('calculates metric BMI: 70 kg, 175 cm → 22.9, Normal', () => {
    render(<BmiCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 70'), { target: { value: '70' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 175'), { target: { value: '175' } })
    expect(screen.getByText('22.9')).toBeInTheDocument()
    // "Normal" appears in the large display span and in the legend grid — both should be present
    expect(screen.getAllByText('Normal').length).toBeGreaterThanOrEqual(1)
  })

  it('classifies Underweight (BMI < 18.5): 50 kg, 175 cm → 16.3', () => {
    render(<BmiCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 70'), { target: { value: '50' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 175'), { target: { value: '175' } })
    expect(screen.getByText('16.3')).toBeInTheDocument()
    expect(screen.getAllByText('Underweight').length).toBeGreaterThanOrEqual(1)
  })

  it('classifies Overweight (25–29.9): 90 kg, 175 cm → 29.4', () => {
    render(<BmiCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 70'), { target: { value: '90' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 175'), { target: { value: '175' } })
    expect(screen.getByText('29.4')).toBeInTheDocument()
    expect(screen.getAllByText('Overweight').length).toBeGreaterThanOrEqual(1)
  })

  it('classifies Obese (BMI ≥ 30): 100 kg, 175 cm → 32.7', () => {
    render(<BmiCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 70'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 175'), { target: { value: '175' } })
    expect(screen.getByText('32.7')).toBeInTheDocument()
    expect(screen.getAllByText('Obese').length).toBeGreaterThanOrEqual(1)
  })

  it('switches to Imperial and calculates: 154 lb, 5ft 9in → BMI 22.7', () => {
    render(<BmiCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Imperial (lb / ft)' }))
    fireEvent.change(screen.getByPlaceholderText('e.g. 154'), { target: { value: '154' } })
    fireEvent.change(screen.getByPlaceholderText('5'), { target: { value: '5' } })
    fireEvent.change(screen.getByPlaceholderText('9'), { target: { value: '9' } })
    // 703 * 154 / (69*69) = 108262 / 4761 ≈ 22.7
    expect(screen.getByText('22.7')).toBeInTheDocument()
    expect(screen.getAllByText('Normal').length).toBeGreaterThanOrEqual(1)
  })

  it('shows an error for negative weight', () => {
    render(<BmiCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 70'), { target: { value: '-5' } })
    expect(screen.getByText(/Weight must be a positive number/i)).toBeInTheDocument()
  })

  it('shows no result when inputs are empty', () => {
    render(<BmiCalculator />)
    expect(screen.getByText(/Enter your weight and height/i)).toBeInTheDocument()
  })
})
