import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WaterIntake from '@/components/tools/WaterIntake'

// Formula: base = 35 ml/kg + floor(activityMin/30) * 350
// 70 kg, 0 activity → 35 * 70 = 2450 ml = 2.45 L = 10.4 cups

describe('WaterIntake', () => {
  it('70 kg, 0 activity → 2450 ml', () => {
    render(<WaterIntake />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 70'), { target: { value: '70' } })
    expect(screen.getByText('2,450')).toBeInTheDocument()
  })

  it('70 kg, 0 activity → 2.45 L', () => {
    render(<WaterIntake />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 70'), { target: { value: '70' } })
    expect(screen.getByText('2.45')).toBeInTheDocument()
  })

  it('70 kg, 0 activity → 10.4 cups (2450 / 236.6)', () => {
    render(<WaterIntake />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 70'), { target: { value: '70' } })
    // 2450 / 236.6 = 10.355... → 10.4
    expect(screen.getByText('10.4')).toBeInTheDocument()
  })

  it('70 kg, 30 min activity → 2800 ml (base + 350)', () => {
    render(<WaterIntake />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 70'), { target: { value: '70' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 30'), { target: { value: '30' } })
    expect(screen.getByText('2,800')).toBeInTheDocument()
  })

  it('70 kg, 60 min activity → 3150 ml (base + 700)', () => {
    render(<WaterIntake />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 70'), { target: { value: '70' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 30'), { target: { value: '60' } })
    expect(screen.getByText('3,150')).toBeInTheDocument()
  })

  it('switches to lb: 154 lb → ~70 kg → 2450 ml', () => {
    render(<WaterIntake />)
    fireEvent.click(screen.getByRole('tab', { name: 'Pounds (lb)' }))
    fireEvent.change(screen.getByPlaceholderText('e.g. 154'), { target: { value: '154' } })
    // 154 * 0.453592 = 69.853 kg → 35 * 69.853 = 2444.855 → 2445 ml
    expect(screen.getByText('2,445')).toBeInTheDocument()
  })

  it('shows error for negative weight', () => {
    render(<WaterIntake />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 70'), { target: { value: '-10' } })
    expect(screen.getByText(/Weight must be a positive number/i)).toBeInTheDocument()
  })

  it('shows no result when weight is empty', () => {
    render(<WaterIntake />)
    expect(screen.getByText(/Enter your weight/i)).toBeInTheDocument()
  })

  it('80 kg, 0 activity → 2800 ml', () => {
    render(<WaterIntake />)
    fireEvent.change(screen.getByPlaceholderText('e.g. 70'), { target: { value: '80' } })
    expect(screen.getByText('2,800')).toBeInTheDocument()
  })
})
