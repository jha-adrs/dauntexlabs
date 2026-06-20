import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CalorieCalculator from '@/components/tools/CalorieCalculator'

// Mifflin-St Jeor (male): 10w + 6.25h - 5a + 5
// male, 30y, 80kg, 180cm → 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
// sedentary (1.2): TDEE = 1780 * 1.2 = 2136

describe('CalorieCalculator', () => {
  function fillInputs(age: string, weight: string, height: string) {
    fireEvent.change(screen.getByPlaceholderText('e.g. 30'), { target: { value: age } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 80'), { target: { value: weight } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 180'), { target: { value: height } })
  }

  it('male 30y 80kg 180cm sedentary → BMR 1780, TDEE 2136', () => {
    render(<CalorieCalculator />)
    // Male is default
    fillInputs('30', '80', '180')
    // sedentary is default (1.2)
    expect(screen.getByText(/1,780|1780/)).toBeInTheDocument()
    expect(screen.getByText(/2,136|2136/)).toBeInTheDocument()
  })

  it('female 25y 60kg 165cm sedentary → BMR 1339, TDEE 1607', () => {
    render(<CalorieCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Female' }))
    fillInputs('25', '60', '165')
    // female: 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 → 1345
    // Wait — let's recalculate: 10*60=600, 6.25*165=1031.25, 5*25=125, 600+1031.25-125-161=1345.25 → 1345
    // TDEE = 1345 * 1.2 = 1614 (rounded from 1345.25 * 1.2 = 1614.3)
    // The component rounds BMR first: Math.round(1345.25)=1345, TDEE = Math.round(1345.25*1.2)=Math.round(1614.3)=1614
    expect(screen.getByText(/1,345|1345/)).toBeInTheDocument()
    expect(screen.getByText(/1,614|1614/)).toBeInTheDocument()
  })

  it('shows cut (TDEE - 500) and bulk (TDEE + 500)', () => {
    render(<CalorieCalculator />)
    fillInputs('30', '80', '180')
    // cut = 2136 - 500 = 1636, bulk = 2136 + 500 = 2636
    expect(screen.getByText(/1,636|1636/)).toBeInTheDocument()
    expect(screen.getByText(/2,636|2636/)).toBeInTheDocument()
  })

  it('activity multiplier: moderate (1.55) gives higher TDEE', () => {
    render(<CalorieCalculator />)
    fillInputs('30', '80', '180')
    // Switch to moderately active
    const sel = screen.getByRole('combobox')
    fireEvent.change(sel, { target: { value: '1.55' } })
    // TDEE = 1780 * 1.55 = 2759
    expect(screen.getByText(/2,759|2759/)).toBeInTheDocument()
  })

  it('shows error for invalid age', () => {
    render(<CalorieCalculator />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 30'), { target: { value: '200' } })
    expect(screen.getByText(/Age must be between/i)).toBeInTheDocument()
  })

  it('shows no result when fields are empty', () => {
    render(<CalorieCalculator />)
    expect(screen.getByText(/Fill in all fields/i)).toBeInTheDocument()
  })
})
