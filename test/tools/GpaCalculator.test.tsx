import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GpaCalculator from '@/components/tools/GpaCalculator'

/** Find the result card with the given label and return its value text. */
function cardValue(label: string): string {
  const labelEl = screen.getByText(label)
  // label and value are siblings inside the card wrapper
  const card = labelEl.parentElement as HTMLElement
  const value = card.children[1] as HTMLElement
  return value.textContent ?? ''
}

describe('GpaCalculator', () => {
  it('computes weighted GPA for the default A(3) + B(3) → 3.50, 6 credits', () => {
    render(<GpaCalculator />)
    // defaults are A/3 and B/3 → (4*3 + 3*3)/6 = 21/6 = 3.50
    expect(cardValue('GPA')).toBe('3.50')
    expect(cardValue('Total credits')).toBe('6')
  })

  it('updates when grade/credits change', () => {
    render(<GpaCalculator />)
    const creditInputs = screen.getAllByPlaceholderText('0')
    // change first course's credits to 4 → (4*4 + 3*3)/7 = 25/7 = 3.571...
    fireEvent.change(creditInputs[0], { target: { value: '4' } })
    expect(cardValue('GPA')).toBe('3.57')
    expect(cardValue('Total credits')).toBe('7')
  })

  it('adds and removes courses', () => {
    render(<GpaCalculator />)
    fireEvent.click(screen.getByRole('button', { name: '+ Add course' }))
    // now 3 rows → 3 credit inputs
    expect(screen.getAllByPlaceholderText('0')).toHaveLength(3)
    // remove buttons are the ✕ buttons
    const removeButtons = screen.getAllByTitle('Remove course')
    fireEvent.click(removeButtons[2])
    expect(screen.getAllByPlaceholderText('0')).toHaveLength(2)
  })

  it('treats an all-F transcript as 0.00', () => {
    render(<GpaCalculator />)
    const grades = screen.getAllByRole('combobox')
    fireEvent.change(grades[0], { target: { value: 'F' } })
    fireEvent.change(grades[1], { target: { value: 'F' } })
    expect(cardValue('GPA')).toBe('0.00')
    expect(cardValue('Total credits')).toBe('6')
  })

  it('shows an error for invalid (negative) credit hours', () => {
    render(<GpaCalculator />)
    const creditInputs = screen.getAllByPlaceholderText('0')
    fireEvent.change(creditInputs[0], { target: { value: '-2' } })
    expect(screen.getByText(/Credit hours must be a number/i)).toBeInTheDocument()
  })

  it('shows a dash for GPA when no credits are entered', () => {
    render(<GpaCalculator />)
    const creditInputs = screen.getAllByPlaceholderText('0')
    fireEvent.change(creditInputs[0], { target: { value: '' } })
    fireEvent.change(creditInputs[1], { target: { value: '' } })
    expect(cardValue('GPA')).toBe('—')
    expect(cardValue('Total credits')).toBe('0')
  })

  it('rounds A- (3.7) and B+ (3.3) correctly', () => {
    render(<GpaCalculator />)
    const grades = screen.getAllByRole('combobox')
    fireEvent.change(grades[0], { target: { value: 'A-' } })
    fireEvent.change(grades[1], { target: { value: 'B+' } })
    // (3.7*3 + 3.3*3)/6 = (11.1 + 9.9)/6 = 21/6 = 3.50
    expect(cardValue('GPA')).toBe('3.50')
  })
})
