import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GradeCalculator from '@/components/tools/GradeCalculator'

function cardValue(label: string): string {
  const labelEl = screen.getByText(label)
  const card = labelEl.parentElement as HTMLElement
  const value = card.children[1] as HTMLElement
  return value.textContent ?? ''
}

describe('GradeCalculator', () => {
  it('computes the weighted current grade: 90%@50 + 80%@50 → 85.00%', () => {
    render(<GradeCalculator />)
    // defaults are exactly these two rows
    expect(cardValue('Final grade')).toBe('85.00%')
    expect(cardValue('Total weight')).toBe('100%')
  })

  it('reflects edited weights/scores', () => {
    render(<GradeCalculator />)
    const scores = screen.getAllByPlaceholderText('0')
    // inputs order per row: weight, score. Row1 weight idx0, score idx1; row2 weight idx2 score idx3
    // change row1 score to 100 → (100*50 + 80*50)/100 = 90
    fireEvent.change(scores[1], { target: { value: '100' } })
    expect(cardValue('Final grade')).toBe('90.00%')
  })

  it('handles unequal weights (70/30)', () => {
    render(<GradeCalculator />)
    const inputs = screen.getAllByPlaceholderText('0')
    // weight row1 -> 70, weight row2 -> 30 ; scores stay 90 and 80
    fireEvent.change(inputs[0], { target: { value: '70' } })
    fireEvent.change(inputs[2], { target: { value: '30' } })
    // (90*70 + 80*30)/100 = (6300 + 2400)/100 = 87
    expect(cardValue('Final grade')).toBe('87.00%')
  })

  it('adds and removes categories', () => {
    render(<GradeCalculator />)
    fireEvent.click(screen.getByRole('button', { name: '+ Add category' }))
    expect(screen.getAllByTitle('Remove category')).toHaveLength(3)
    fireEvent.click(screen.getAllByTitle('Remove category')[2])
    expect(screen.getAllByTitle('Remove category')).toHaveLength(2)
  })

  it('errors on an invalid weight/score', () => {
    render(<GradeCalculator />)
    const inputs = screen.getAllByPlaceholderText('0')
    fireEvent.change(inputs[0], { target: { value: '-5' } })
    expect(screen.getByText(/Weight and score must be numbers/i)).toBeInTheDocument()
  })

  it('computes required final: current 85, final weight 30%, want 90 → ~101.67% (>100 warning)', () => {
    render(<GradeCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Final exam needed' }))
    // defaults are exactly current 85 / weight 30 / desired 90
    // (90 - 85*0.7)/0.3 = (90 - 59.5)/0.3 = 30.5/0.3 = 101.666...
    expect(cardValue('Required on final')).toBe('101.67%')
    expect(screen.getByText(/more than 100%/i)).toBeInTheDocument()
  })

  it('computes a reachable required final', () => {
    render(<GradeCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Final exam needed' }))
    // current 80, final weight 50%, want 85 → (85 - 80*0.5)/0.5 = (85-40)/0.5 = 90
    fireEvent.change(screen.getByPlaceholderText('85'), { target: { value: '80' } })
    fireEvent.change(screen.getByPlaceholderText('30'), { target: { value: '50' } })
    fireEvent.change(screen.getByPlaceholderText('90'), { target: { value: '85' } })
    expect(cardValue('Required on final')).toBe('90.00%')
    expect(screen.queryByText(/more than 100%/i)).not.toBeInTheDocument()
  })

  it('notes when the target is already secured (≤0% needed)', () => {
    render(<GradeCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Final exam needed' }))
    // current 95, final weight 20%, want 70 → (70 - 95*0.8)/0.2 = (70-76)/0.2 = -30
    fireEvent.change(screen.getByPlaceholderText('85'), { target: { value: '95' } })
    fireEvent.change(screen.getByPlaceholderText('30'), { target: { value: '20' } })
    fireEvent.change(screen.getByPlaceholderText('90'), { target: { value: '70' } })
    expect(screen.getByText(/already secured/i)).toBeInTheDocument()
  })

  it('errors on an out-of-range final weight', () => {
    render(<GradeCalculator />)
    fireEvent.click(screen.getByRole('tab', { name: 'Final exam needed' }))
    fireEvent.change(screen.getByPlaceholderText('30'), { target: { value: '0' } })
    expect(screen.getByText(/between 0 and 100/i)).toBeInTheDocument()
  })
})
